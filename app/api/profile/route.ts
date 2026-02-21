/**
 * GET  /api/profile — Get current user's profile
 * PUT  /api/profile — Update profile (name, region, language, etc.)
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireAuth, applyRateLimit, sanitizeString, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return jsonError("Profile not found", "NOT_FOUND", 404);

  // Also fetch favorites
  const [platforms, leagues, teams] = await Promise.all([
    supabase.from("favorite_platforms").select("platform_id, position").eq("user_id", user.id).order("position"),
    supabase.from("favorite_leagues").select("league").eq("user_id", user.id),
    supabase.from("favorite_teams").select("team, league").eq("user_id", user.id),
  ]);

  return jsonOk({
    ...profile,
    favoritePlatformIds: (platforms.data ?? []).map((p: { platform_id: string }) => p.platform_id),
    favoriteLeagues: (leagues.data ?? []).map((l: { league: string }) => l.league),
    favoriteTeams: (teams.data ?? []).map((t: { team: string }) => t.team),
  });
}

export async function PUT(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid body", "BAD_REQUEST", 400);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  // Only allow updating safe fields
  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = sanitizeString(body.name);
  if (body.region) updates.region = sanitizeString(body.region);
  if (body.language) updates.language = sanitizeString(body.language);
  if (body.timezone) updates.timezone = sanitizeString(body.timezone);
  if (typeof body.notifications_enabled === "boolean") updates.notifications_enabled = body.notifications_enabled;

  if (Object.keys(updates).length === 0) return jsonError("No valid fields to update", "NO_CHANGES", 400);

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return jsonError("Update failed", "UPDATE_FAILED", 500);

  await auditLog(req, user.id, "profile_updated", "profiles", { fields: Object.keys(updates) });
  return jsonOk({ updated: true, fields: Object.keys(updates) });
}
