// ============================================================================
// AMPERE SECURITY BASELINE
// File: lib/security.ts
//
// Implements the security baseline:
// 1. Authentication — Argon2id/bcrypt password hashing, MFA support
// 2. Authorization — RBAC/ABAC, default deny, server-side claims only
// 3. Session/JWT — httpOnly secure cookies, short-lived JWTs, refresh rotation
// 4. Input validation — Schema-based validation, injection prevention
// 5. Rate limiting — Per IP + per user + per route, progressive delays
// 6. Transport + headers — HTTPS, HSTS, CSP, CORS lockdown
// 7. Secrets management — No committed secrets, KMS integration points
// 8. Logging + monitoring — Audit auth events, redact PII, tamper-resistant logs
// 9. Dependency hygiene — Pin versions, SCA scanning, no debug in prod
//
// NOTE: This prototype runs client-side only. These implementations define
// the architecture and will be wired to a backend in Phase 2 (Supabase/Postgres).
// ============================================================================

import { redactSensitiveData, secureLog } from "./streamResourceManager";

// ============================================================================
// 1. AUTHENTICATION
// ============================================================================

export interface AuthCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export type UserRole = "viewer" | "admin" | "parent" | "child";

export interface PasswordHashConfig {
  algorithm: "argon2id" | "bcrypt";
  // Argon2id params (OWASP recommendations)
  memoryCost: number; // 19456 KB (19 MiB)
  timeCost: number; // 2 iterations
  parallelism: number; // 1 thread
  saltLength: number; // 16 bytes
  hashLength: number; // 32 bytes
}

export const DEFAULT_HASH_CONFIG: PasswordHashConfig = {
  algorithm: "argon2id",
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  saltLength: 16,
  hashLength: 32,
};

/**
 * Hash a password using the configured algorithm.
 * In production: use argon2 npm package or bcrypt.
 * Prototype: SHA-256 with salt (NOT production-safe).
 */
export async function hashPassword(password: string, _config = DEFAULT_HASH_CONFIG): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algo, salt, hash] = storedHash.split(":");
  if (algo !== "sha256") return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === hash;
}

// ============================================================================
// 2. AUTHORIZATION (RBAC)
// ============================================================================

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
  | "tv:configure";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: ["content:view", "profile:view", "profile:edit", "tv:control"],
  parent: ["content:view", "content:manage", "profile:view", "profile:edit", "profile:manage_all", "parental:configure", "tv:control", "tv:configure"],
  child: ["content:view", "profile:view"],
  admin: ["content:view", "content:manage", "profile:view", "profile:edit", "profile:manage_all", "parental:configure", "admin:users", "admin:system", "tv:control", "tv:configure"],
};

export function hasPermission(userRoles: UserRole[], permission: Permission): boolean {
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function enforcePermission(userRoles: UserRole[], permission: Permission): void {
  if (!hasPermission(userRoles, permission)) {
    secureLog("warn", `Authorization denied: missing permission ${permission}`);
    throw new Error(`Forbidden: missing permission ${permission}`);
  }
}

// ============================================================================
// 3. SESSION / JWT STRATEGY
// ============================================================================

export interface SessionConfig {
  /**
   * For web apps: prefer server sessions with httpOnly secure cookies.
   * For mobile/API: short-lived JWT + rotating refresh tokens.
   */
  strategy: "server_session" | "jwt";
  accessTokenLifetimeMs: number;
  refreshTokenLifetimeMs: number;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    path: string;
    domain?: string;
  };
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  strategy: "server_session",
  accessTokenLifetimeMs: 900000, // 15 min
  refreshTokenLifetimeMs: 604800000, // 7 days
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  },
};

// ============================================================================
// 4. INPUT VALIDATION
// ============================================================================

export interface ValidationRule {
  field: string;
  type: "string" | "number" | "boolean" | "email" | "url" | "alphanumeric";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export function validateInput(data: Record<string, unknown>, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    // Type checks
    if (rule.type === "string" && typeof value !== "string") {
      errors.push(`${rule.field} must be a string`);
      continue;
    }

    if (rule.type === "number" && typeof value !== "number") {
      errors.push(`${rule.field} must be a number`);
      continue;
    }

    if (rule.type === "email" && typeof value === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${rule.field} must be a valid email`);
      }
    }

    if (rule.type === "url" && typeof value === "string") {
      try {
        new URL(value);
      } catch {
        errors.push(`${rule.field} must be a valid URL`);
      }
    }

    if (rule.type === "alphanumeric" && typeof value === "string") {
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        errors.push(`${rule.field} must be alphanumeric`);
      }
    }

    // Length checks
    if (typeof value === "string") {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
      }
    }

    // Range checks
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${rule.field} must be at most ${rule.max}`);
      }
    }

    // Pattern check
    if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      errors.push(`${rule.field} format is invalid`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Sanitize string input to prevent XSS.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================================
// 5. RATE LIMITING
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  /** Progressive delay: multiply wait time after each violation */
  progressiveDelayFactor: number;
  /** Account lockout after N failed login attempts */
  loginMaxAttempts: number;
  loginLockoutMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  progressiveDelayFactor: 2,
  loginMaxAttempts: 5,
  loginLockoutMs: 900000, // 15 min lockout
};

export class RateLimiter {
  private windows: Map<string, { count: number; resetAt: number; violations: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config = DEFAULT_RATE_LIMIT) {
    this.config = config;
  }

  /**
   * Check if a request should be allowed.
   * Key format: "ip:route" or "user:route"
   */
  isAllowed(key: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || now >= window.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + this.config.windowMs, violations: 0 });
      return { allowed: true };
    }

    if (window.count >= this.config.maxRequests) {
      window.violations++;
      const delay = this.config.windowMs * Math.pow(this.config.progressiveDelayFactor, window.violations - 1);
      secureLog("warn", `Rate limit exceeded for ${redactSensitiveData(key)}`);
      return { allowed: false, retryAfterMs: delay };
    }

    window.count++;
    return { allowed: true };
  }

  /**
   * Check login attempt rate limiting with lockout.
   */
  checkLoginAttempt(key: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
    const now = Date.now();
    const window = this.windows.get(`login:${key}`);

    if (!window || now >= window.resetAt) {
      this.windows.set(`login:${key}`, { count: 1, resetAt: now + this.config.loginLockoutMs, violations: 0 });
      return { allowed: true, remainingAttempts: this.config.loginMaxAttempts - 1 };
    }

    if (window.count >= this.config.loginMaxAttempts) {
      return { allowed: false, remainingAttempts: 0, lockedUntil: window.resetAt };
    }

    window.count++;
    return { allowed: true, remainingAttempts: this.config.loginMaxAttempts - window.count };
  }

  resetLoginAttempts(key: string): void {
    this.windows.delete(`login:${key}`);
  }
}

// ============================================================================
// 6. SECURITY HEADERS
// ============================================================================

export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0", // Disabled per modern best practices (use CSP instead)
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), payment=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "frame-src 'self' https:",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export const CORS_CONFIG = {
  allowedOrigins: ["https://ampere.app"], // Production only
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
  credentials: true,
};

// ============================================================================
// 7. SECRETS MANAGEMENT
// ============================================================================

export interface SecretReference {
  key: string;
  source: "env" | "kms" | "vault";
  envVar?: string;
  kmsKeyId?: string;
  vaultPath?: string;
  rotationIntervalDays?: number;
}

export const REQUIRED_SECRETS: SecretReference[] = [
  { key: "DATABASE_URL", source: "env", envVar: "DATABASE_URL", rotationIntervalDays: 90 },
  { key: "JWT_SECRET", source: "kms", kmsKeyId: "ampere-jwt-signing-key", rotationIntervalDays: 30 },
  { key: "ENCRYPTION_KEY", source: "kms", kmsKeyId: "ampere-data-encryption-key", rotationIntervalDays: 90 },
  { key: "OAUTH_CLIENT_SECRET", source: "vault", vaultPath: "secret/ampere/oauth", rotationIntervalDays: 90 },
];

export function getSecret(key: string): string | null {
  // In production: fetch from KMS/Vault based on source
  // For prototype: read from environment variables
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] ?? null;
  }
  return null;
}

// ============================================================================
// 8. AUDIT LOGGING
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  outcome: "success" | "failure" | "denied";
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  checksum?: string; // For tamper resistance
}

export class AuditLogger {
  private logs: AuditLogEntry[] = [];

  log(entry: Omit<AuditLogEntry, "id" | "timestamp" | "checksum">): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    // Compute checksum for tamper resistance
    fullEntry.checksum = this.computeChecksum(fullEntry);

    // NEVER log passwords, tokens, or PII
    if (fullEntry.details) {
      const sanitized = JSON.parse(redactSensitiveData(JSON.stringify(fullEntry.details)));
      fullEntry.details = sanitized;
    }

    this.logs.push(fullEntry);

    // Keep last 5000 entries
    if (this.logs.length > 5000) {
      this.logs = this.logs.slice(-5000);
    }
  }

  private computeChecksum(entry: AuditLogEntry): string {
    const data = `${entry.id}:${entry.timestamp}:${entry.action}:${entry.resource}:${entry.outcome}`;
    // In production: HMAC-SHA256 with a secret key
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(16);
  }

  getEntries(userId?: string, limit = 100): AuditLogEntry[] {
    let entries = this.logs;
    if (userId) {
      entries = entries.filter((e) => e.userId === userId);
    }
    return entries.slice(-limit);
  }
}

// ============================================================================
// 9. DEPENDENCY HYGIENE NOTES
// ============================================================================

/**
 * Production checklist:
 * - Pin all dependency versions in package.json (no ^ or ~)
 * - Run SCA scanning: `npm audit` + Snyk/Dependabot
 * - Disable debug/source maps in production builds
 * - Set NODE_ENV=production
 * - Review next.config.js for security-sensitive settings
 * - Enable CSP nonce-based script loading
 * - Configure Subresource Integrity (SRI) for CDN assets
 */
export const DEPENDENCY_HYGIENE = {
  pinVersions: true,
  scaEnabled: true,
  debugInProd: false,
  sourceMapInProd: false,
} as const;
