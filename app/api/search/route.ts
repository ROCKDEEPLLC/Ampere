/**
 * GET /api/search?q=batman&platforms=netflix,hulu&genre=Movies
 *
 * Federated search across platforms with caching.
 * Also supports voice command parsing via POST.
 */

import { NextRequest } from "next/server";
import { applyRateLimit, jsonOk, jsonError } from "@/lib/apiHelpers";
import {
  PLATFORMS,
  TEAMS_BY_LEAGUE,
  platformById,
  searchPlatforms,
  normalizeKey,
} from "@/lib/catalog";

// Simple content index for demo search
const DEMO_CONTENT = buildDemoIndex();

function buildDemoIndex() {
  const items: Array<{
    id: string;
    title: string;
    platformId: string;
    genre: string;
    type: string;
    year?: number;
  }> = [];

  // Generate demo content entries from platform catalog
  const titles: Record<string, Array<{ title: string; genre: string; type: string; year: number }>> = {
    netflix: [
      { title: "Stranger Things", genre: "Basic", type: "series", year: 2016 },
      { title: "Wednesday", genre: "Basic", type: "series", year: 2022 },
      { title: "Glass Onion", genre: "Movies", type: "movie", year: 2022 },
      { title: "The Queen's Gambit", genre: "Basic", type: "series", year: 2020 },
      { title: "Squid Game", genre: "Basic", type: "series", year: 2021 },
    ],
    disneyplus: [
      { title: "The Mandalorian", genre: "Basic", type: "series", year: 2019 },
      { title: "Loki", genre: "Basic", type: "series", year: 2021 },
      { title: "Inside Out 2", genre: "Kids", type: "movie", year: 2024 },
    ],
    hulu: [
      { title: "The Bear", genre: "Basic", type: "series", year: 2022 },
      { title: "Only Murders in the Building", genre: "Basic", type: "series", year: 2021 },
    ],
    max: [
      { title: "The Last of Us", genre: "Premium", type: "series", year: 2023 },
      { title: "House of the Dragon", genre: "Premium", type: "series", year: 2022 },
      { title: "Succession", genre: "Premium", type: "series", year: 2018 },
    ],
    primevideo: [
      { title: "The Boys", genre: "Premium", type: "series", year: 2019 },
      { title: "Reacher", genre: "Basic", type: "series", year: 2022 },
      { title: "The Lord of the Rings: Rings of Power", genre: "Premium", type: "series", year: 2022 },
    ],
    appletv: [
      { title: "Ted Lasso", genre: "Premium", type: "series", year: 2020 },
      { title: "Severance", genre: "Premium", type: "series", year: 2022 },
    ],
    peacock: [
      { title: "Poker Face", genre: "Basic", type: "series", year: 2023 },
      { title: "Bel-Air", genre: "Basic", type: "series", year: 2022 },
    ],
    paramountplus: [
      { title: "Yellowjackets", genre: "Basic", type: "series", year: 2021 },
      { title: "Star Trek: Strange New Worlds", genre: "Basic", type: "series", year: 2022 },
    ],
  };

  for (const [pid, content] of Object.entries(titles)) {
    for (const c of content) {
      items.push({ id: `${pid}_${normalizeKey(c.title)}`, platformId: pid, ...c });
    }
  }

  return items;
}

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const platformFilter = url.searchParams.get("platforms")?.split(",").filter(Boolean) ?? [];
  const genreFilter = url.searchParams.get("genre") ?? "";
  const typeFilter = url.searchParams.get("type") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

  if (!query && !platformFilter.length && !genreFilter) {
    return jsonError("At least one of: q, platforms, genre is required", "MISSING_QUERY", 400);
  }

  const startTime = Date.now();
  const qLower = query.toLowerCase();

  let results = DEMO_CONTENT;

  // Filter by query
  if (qLower) {
    results = results.filter((r) =>
      r.title.toLowerCase().includes(qLower) ||
      r.platformId.includes(qLower) ||
      r.genre.toLowerCase().includes(qLower)
    );
  }

  // Filter by platforms
  if (platformFilter.length > 0) {
    results = results.filter((r) => platformFilter.includes(r.platformId));
  }

  // Filter by genre
  if (genreFilter) {
    results = results.filter((r) => r.genre.toLowerCase() === genreFilter.toLowerCase());
  }

  // Filter by type
  if (typeFilter) {
    results = results.filter((r) => r.type === typeFilter);
  }

  // Score and sort
  const scored = results.map((r) => {
    let score = 0.5;
    if (qLower && r.title.toLowerCase().startsWith(qLower)) score += 0.3;
    if (qLower && r.title.toLowerCase() === qLower) score += 0.2;
    return { ...r, matchScore: Math.min(1, score), platform: platformById(r.platformId)?.label ?? r.platformId };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const searchTimeMs = Date.now() - startTime;

  return jsonOk({
    query,
    results: scored.slice(0, limit),
    totalCount: scored.length,
    searchTimeMs,
    filters: { platforms: platformFilter, genre: genreFilter, type: typeFilter },
  });
}

/**
 * POST /api/search — Voice command parsing
 * Body: { command: "switch to Netflix" }
 */
export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body?.command) return jsonError("command required", "MISSING_COMMAND", 400);

  const command = body.command.trim().toLowerCase();

  // Parse voice commands
  let intent: { action: string; target?: string; query?: string } = { action: "unknown" };

  if (/^(search|find|look for)\s+/i.test(command)) {
    const query = command.replace(/^(search|find|look for)\s+/i, "").trim();
    intent = { action: "search", query };
  } else if (/^(switch to|open|launch|go to)\s+/i.test(command)) {
    const target = command.replace(/^(switch to|open|launch|go to)\s+/i, "").trim();
    const platform = searchPlatforms(target)[0];
    intent = { action: "launch", target: platform?.id ?? target };
  } else if (/^(play|resume|watch)\s+/i.test(command)) {
    const query = command.replace(/^(play|resume|watch)\s+/i, "").trim();
    intent = { action: "play", query };
  } else if (/power\s*(on|off)/i.test(command)) {
    const state = /on/i.test(command) ? "on" : "off";
    intent = { action: "power", target: state };
  } else if (/^(home|live|favs|favorites|search)$/i.test(command)) {
    intent = { action: "navigate", target: command.toLowerCase() };
  } else if (/^(volume|vol)\s*(up|down|mute|\d+)/i.test(command)) {
    const match = command.match(/(up|down|mute|\d+)/i);
    intent = { action: "volume", target: match?.[1] ?? "mute" };
  } else {
    // Try matching as a platform name
    const platform = searchPlatforms(command)[0];
    if (platform) {
      intent = { action: "launch", target: platform.id };
    }
  }

  return jsonOk({ command: body.command, parsed: intent });
}
