/**
 * AMPÈRE — API Helpers
 *
 * Shared utilities for all API routes: auth guard, rate limiting,
 * RBAC enforcement, input validation, and audit logging.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hashSync, compareSync } from "bcryptjs";

// ============================================
// Types
// ============================================

export type Role = "viewer" | "parent" | "child" | "admin";

export type Permission =
  | "content:view"
  | "content:manage"
  | "profile:view"
  | "profile:edit"
  | "profile:manage_all"
  | "parental:configure"
  | "admin:users"
  | "admin:system"
  | "tv:control"
  | "tv:configure"
  | "notifications:manage";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface ApiError {
  error: string;
  code: string;
  status: number;
}

// ============================================
// RBAC Permission Matrix
// ============================================

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ["content:view", "profile:view", "profile:edit", "notifications:manage"],
  child: ["content:view", "profile:view"],
  parent: [
    "content:view", "content:manage",
    "profile:view", "profile:edit", "profile:manage_all",
    "parental:configure",
    "tv:control", "tv:configure",
    "notifications:manage",
  ],
  admin: [
    "content:view", "content:manage",
    "profile:view", "profile:edit", "profile:manage_all",
    "parental:configure",
    "admin:users", "admin:system",
    "tv:control", "tv:configure",
    "notifications:manage",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ============================================
// Rate Limiting (in-memory, per-IP)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100", 10);
const LOGIN_RATE_LIMIT_MAX = parseInt(process.env.LOGIN_RATE_LIMIT_MAX ?? "5", 10);
const LOGIN_RATE_LIMIT_WINDOW = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? "900000", 10);

export function checkRateLimit(
  ip: string,
  opts?: { maxRequests?: number; windowMs?: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const max = opts?.maxRequests ?? RATE_LIMIT_MAX;
  const window = opts?.windowMs ?? RATE_LIMIT_WINDOW;
  const now = Date.now();
  const key = ip;

  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: max - 1, resetAt: now + window };
  }

  entry.count++;
  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

export function checkLoginRateLimit(ip: string) {
  return checkRateLimit(ip, {
    maxRequests: LOGIN_RATE_LIMIT_MAX,
    windowMs: LOGIN_RATE_LIMIT_WINDOW,
  });
}

// ============================================
// Auth Guard — Extract user from Supabase session
// ============================================

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        // Read-only in API route context
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.role as Role) ?? "viewer",
  };
}

// ============================================
// Middleware Wrappers
// ============================================

/** Require authentication. Returns 401 if not logged in. */
export async function requireAuth(req: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }
  return user;
}

/** Require specific permission. Returns 403 if not allowed. */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  if (!hasPermission(result.role, permission)) {
    return NextResponse.json(
      { error: "Insufficient permissions", code: "FORBIDDEN" },
      { status: 403 }
    );
  }
  return result;
}

/** Apply rate limiting. Returns 429 if exceeded. */
export function applyRateLimit(req: NextRequest, isLogin = false): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const prefix = isLogin ? "login:" : "api:";
  const result = isLogin ? checkLoginRateLimit(prefix + ip) : checkRateLimit(prefix + ip);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED", retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

// ============================================
// Input Validation
// ============================================

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
  if (password.length > 128) return { valid: false, error: "Password too long" };
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must contain an uppercase letter" };
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must contain a lowercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, error: "Password must contain a number" };
  return { valid: true };
}

export function validatePin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function sanitizeString(s: string): string {
  return s.replace(/[<>]/g, "").trim().slice(0, 500);
}

// ============================================
// Password Hashing (bcrypt — production-grade)
// ============================================

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): string {
  return hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

export function hashPin(pin: string): string {
  return hashSync(pin, 10);
}

export function verifyPin(pin: string, hash: string): boolean {
  return compareSync(pin, hash);
}

// ============================================
// Audit Logging
// ============================================

export async function auditLog(
  req: NextRequest,
  userId: string | null,
  action: string,
  resource: string,
  details: Record<string, unknown> = {}
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return; // Skip if not configured

  try {
    const { createClient } = require("@supabase/supabase-js");
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await admin.from("activity_log").insert({
      user_id: userId,
      action,
      resource,
      details,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      user_agent: req.headers.get("user-agent")?.slice(0, 256),
    });
  } catch {
    // Non-blocking — audit log failure should never break the request
  }
}

// ============================================
// JSON Response Helpers
// ============================================

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}
