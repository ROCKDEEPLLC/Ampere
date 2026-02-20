/**
 * POST /api/auth/signup
 * Register a new user with email/password via Supabase Auth.
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { applyRateLimit, validateEmail, validatePassword, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  // Rate limit
  const limited = applyRateLimit(req, true);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return jsonError("Email and password required", "MISSING_FIELDS", 400);
  }

  // Validate inputs
  if (!validateEmail(body.email)) {
    return jsonError("Invalid email format", "INVALID_EMAIL", 400);
  }
  const pwCheck = validatePassword(body.password);
  if (!pwCheck.valid) {
    return jsonError(pwCheck.error!, "WEAK_PASSWORD", 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return jsonError("Supabase not configured", "CONFIG_ERROR", 503);
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll() {},
    },
  });

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: { name: body.name ?? "User", region: body.region ?? "north_america" },
    },
  });

  if (error) {
    await auditLog(req, null, "signup_failed", "auth", { email: body.email, error: error.message });
    return jsonError(error.message, "SIGNUP_FAILED", 400);
  }

  await auditLog(req, data.user?.id ?? null, "signup_success", "auth", { email: body.email });

  return jsonOk({
    user: { id: data.user?.id, email: data.user?.email },
    message: "Account created. Check email for verification.",
  }, 201);
}
