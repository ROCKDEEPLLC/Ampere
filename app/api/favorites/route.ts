/**
 * GET  /api/favorites — Get user's favorites (platforms, leagues, teams)
 * PUT  /api/favorites — Bulk update favorites
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireAuth, applyRateLimit, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

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

  const [platforms, leagues, teams] = await Promise.all([
    supabase.from("favorite_platforms").select("platform_id, position").eq("user_id", user.id).order("position"),
    supabase.from("favorite_leagues").select("league").eq("user_id", user.id),
    supabase.from("favorite_teams").select("team, league").eq("user_id", user.id),
  ]);

  return jsonOk({
    platforms: (platforms.data ?? []).map((p: { platform_id: string }) => p.platform_id),
    leagues: (leagues.data ?? []).map((l: { league: string }) => l.league),
    teams: (teams.data ?? []).map((t: { team: string; league: string }) => ({ team: t.team, league: t.league })),
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

  // Atomic replacement: delete all then insert new
  if (Array.isArray(body.platforms)) {
    await supabase.from("favorite_platforms").delete().eq("user_id", user.id);
    if (body.platforms.length > 0) {
      await supabase.from("favorite_platforms").insert(
        body.platforms.map((pid: string, i: number) => ({
          user_id: user.id,
          platform_id: pid,
          position: i,
        }))
      );
    }
  }

  if (Array.isArray(body.leagues)) {
    await supabase.from("favorite_leagues").delete().eq("user_id", user.id);
    if (body.leagues.length > 0) {
      await supabase.from("favorite_leagues").insert(
        body.leagues.map((l: string) => ({ user_id: user.id, league: l }))
      );
    }
  }

  if (Array.isArray(body.teams)) {
    await supabase.from("favorite_teams").delete().eq("user_id", user.id);
    if (body.teams.length > 0) {
      await supabase.from("favorite_teams").insert(
        body.teams.map((t: { team: string; league?: string } | string) =>
          typeof t === "string"
            ? { user_id: user.id, team: t }
            : { user_id: user.id, team: t.team, league: t.league }
        )
      );
    }
  }

  await auditLog(req, user.id, "favorites_updated", "favorites", {
    platforms: body.platforms?.length ?? 0,
    leagues: body.leagues?.length ?? 0,
    teams: body.teams?.length ?? 0,
  });

  return jsonOk({ updated: true });
}
