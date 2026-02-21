/**
 * POST /api/auth/mfa — Enroll or verify TOTP MFA
 * GET  /api/auth/mfa — Get MFA enrollment status
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireAuth, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpFactors = factors?.totp ?? [];

  return jsonOk({
    enrolled: totpFactors.length > 0,
    factors: totpFactors.map((f) => ({ id: f.id, friendlyName: f.friendly_name, status: f.status })),
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const action = body?.action; // "enroll" | "verify" | "unenroll"

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  if (action === "enroll") {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: body.friendlyName ?? "AMPÈRE Auth",
    });
    if (error) return jsonError(error.message, "MFA_ENROLL_FAILED", 400);
    await auditLog(req, user.id, "mfa_enrolled", "auth", {});
    return jsonOk({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
  }

  if (action === "verify") {
    if (!body?.factorId || !body?.code) return jsonError("factorId and code required", "MISSING_FIELDS", 400);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: body.factorId });
    if (challengeError) return jsonError(challengeError.message, "MFA_CHALLENGE_FAILED", 400);

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: body.factorId,
      challengeId: challenge.id,
      code: body.code,
    });
    if (verifyError) {
      await auditLog(req, user.id, "mfa_verify_failed", "auth", {});
      return jsonError("Invalid MFA code", "MFA_INVALID", 401);
    }
    await auditLog(req, user.id, "mfa_verified", "auth", {});
    return jsonOk({ verified: true });
  }

  if (action === "unenroll") {
    if (!body?.factorId) return jsonError("factorId required", "MISSING_FIELDS", 400);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: body.factorId });
    if (error) return jsonError(error.message, "MFA_UNENROLL_FAILED", 400);
    await auditLog(req, user.id, "mfa_unenrolled", "auth", {});
    return jsonOk({ unenrolled: true });
  }

  return jsonError("Invalid action. Use: enroll, verify, unenroll", "INVALID_ACTION", 400);
}
