/**
 * POST /api/auth/login
 * Sign in with email/password. Returns session cookies.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { applyRateLimit, validateEmail, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, true);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return jsonError("Email and password required", "MISSING_FIELDS", 400);
  }

  if (!validateEmail(body.email)) {
    return jsonError("Invalid email", "INVALID_EMAIL", 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return jsonError("Supabase not configured", "CONFIG_ERROR", 503);
  }

  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    await auditLog(req, null, "login_failed", "auth", { email: body.email });
    return jsonError("Invalid credentials", "LOGIN_FAILED", 401);
  }

  await auditLog(req, data.user.id, "login_success", "auth", { email: body.email });

  // Check if MFA is enrolled
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasMfa = (factors?.totp ?? []).length > 0;

  return jsonOk({
    user: { id: data.user.id, email: data.user.email },
    session: { accessToken: data.session.access_token, expiresAt: data.session.expires_at },
    mfaRequired: hasMfa,
  });
}
