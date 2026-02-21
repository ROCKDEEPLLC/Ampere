/**
 * GET /api/sports?league=nfl — Real sports data from ESPN public API
 * GET /api/sports?league=nfl&type=schedule — Schedule data
 * GET /api/sports?league=nfl&type=scores — Live scores
 *
 * Supported leagues: nfl, nba, mlb, nhl, mls, ncaaf, ncaab,
 *   premier-league, la-liga, bundesliga, serie-a, ligue-1, champions-league
 */

import { NextRequest } from "next/server";
import { applyRateLimit, jsonOk, jsonError } from "@/lib/apiHelpers";

// ESPN API league path mapping
const ESPN_LEAGUE_MAP: Record<string, { sport: string; league: string }> = {
  nfl: { sport: "football", league: "nfl" },
  nba: { sport: "basketball", league: "nba" },
  mlb: { sport: "baseball", league: "mlb" },
  nhl: { sport: "hockey", league: "nhl" },
  mls: { sport: "soccer", league: "usa.1" },
  ncaaf: { sport: "football", league: "college-football" },
  ncaab: { sport: "basketball", league: "mens-college-basketball" },
  "premier-league": { sport: "soccer", league: "eng.1" },
  "la-liga": { sport: "soccer", league: "esp.1" },
  bundesliga: { sport: "soccer", league: "ger.1" },
  "serie-a": { sport: "soccer", league: "ita.1" },
  "ligue-1": { sport: "soccer", league: "fra.1" },
  "champions-league": { sport: "soccer", league: "uefa.champions" },
  "liga-mx": { sport: "soccer", league: "mex.1" },
  "brasileirao": { sport: "soccer", league: "bra.1" },
};

const BASE_URL = process.env.SPORTS_API_BASE_URL ?? "https://site.api.espn.com/apis/site/v2/sports";

// In-memory cache: 2 min TTL
const sportsCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 120_000;

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const leagueKey = url.searchParams.get("league")?.toLowerCase() ?? "nfl";
  const type = url.searchParams.get("type") ?? "scoreboard";

  const leagueInfo = ESPN_LEAGUE_MAP[leagueKey];
  if (!leagueInfo) {
    return jsonError(
      `Unsupported league. Available: ${Object.keys(ESPN_LEAGUE_MAP).join(", ")}`,
      "INVALID_LEAGUE",
      400
    );
  }

  const cacheKey = `${leagueKey}:${type}`;
  const cached = sportsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return jsonOk({ ...cached.data as object, fromCache: true });
  }

  try {
    let apiUrl: string;
    if (type === "schedule") {
      apiUrl = `${BASE_URL}/${leagueInfo.sport}/${leagueInfo.league}/scoreboard`;
    } else if (type === "scores") {
      apiUrl = `${BASE_URL}/${leagueInfo.sport}/${leagueInfo.league}/scoreboard`;
    } else if (type === "teams") {
      apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${leagueInfo.sport}/${leagueInfo.league}/teams`;
    } else if (type === "standings") {
      apiUrl = `https://site.api.espn.com/apis/v2/sports/${leagueInfo.sport}/${leagueInfo.league}/standings`;
    } else {
      apiUrl = `${BASE_URL}/${leagueInfo.sport}/${leagueInfo.league}/scoreboard`;
    }

    const resp = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 120 },
    });

    if (!resp.ok) {
      return jsonError(`ESPN API returned ${resp.status}`, "UPSTREAM_ERROR", 502);
    }

    const raw = await resp.json();

    // Normalize response
    const normalized = normalizeESPNData(raw, leagueKey, type);

    sportsCache.set(cacheKey, { data: normalized, expiresAt: Date.now() + CACHE_TTL });

    return jsonOk(normalized);
  } catch (err) {
    return jsonError("Failed to fetch sports data", "FETCH_FAILED", 502);
  }
}

function normalizeESPNData(raw: any, league: string, type: string) {
  if (type === "teams" && raw.sports?.[0]?.leagues?.[0]?.teams) {
    return {
      league,
      type: "teams",
      teams: raw.sports[0].leagues[0].teams.map((t: any) => ({
        id: t.team.id,
        name: t.team.displayName,
        abbreviation: t.team.abbreviation,
        logo: t.team.logos?.[0]?.href,
        color: t.team.color,
      })),
    };
  }

  // Scoreboard / schedule
  const events = raw.events ?? [];
  return {
    league,
    type,
    events: events.slice(0, 25).map((e: any) => ({
      id: e.id,
      name: e.name,
      shortName: e.shortName,
      date: e.date,
      status: e.status?.type?.description ?? "Unknown",
      statusDetail: e.status?.type?.detail,
      isLive: e.status?.type?.state === "in",
      venue: e.competitions?.[0]?.venue?.fullName,
      broadcast: e.competitions?.[0]?.broadcasts?.[0]?.names?.join(", "),
      competitors: (e.competitions?.[0]?.competitors ?? []).map((c: any) => ({
        id: c.team?.id,
        name: c.team?.displayName,
        abbreviation: c.team?.abbreviation,
        logo: c.team?.logo,
        score: c.score,
        isHome: c.homeAway === "home",
        record: c.records?.[0]?.summary,
      })),
    })),
    totalEvents: events.length,
  };
}
