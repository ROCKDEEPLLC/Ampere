import type { AttributionEvent, Card, ProfileState, ViewingEvent } from "../types";
import { normalizeKey, safeNowISO } from "./utils";
import { getSessionId, loadAttribution, loadViewing, saveAttribution, saveViewing } from "./storage";

export function track(event: string, props: Record<string, any>) {
  try {
    // eslint-disable-next-line no-console
    console.log("[ampere]", event, props);
  } catch {}

  try {
    if (typeof window === "undefined") return;
    const sessionId = getSessionId();
    const nextEvt: AttributionEvent = { at: safeNowISO(), sessionId, event, props: props ?? {} };
    const existing = loadAttribution();
    saveAttribution([...existing, nextEvt]);
  } catch {}
}

export function uniqByCardKey(cards: Card[]) {
  const m = new Map<string, Card>();
  for (const c of cards) {
    const k = [
      normalizeKey(c.title),
      c.platformId ?? normalizeKey(c.platformLabel ?? ""),
      normalizeKey(c.league ?? ""),
      normalizeKey(c.genre ?? ""),
    ].join("|");
    if (!m.has(k)) m.set(k, c);
  }
  return Array.from(m.values());
}

export function logViewing(card: Card) {
  try {
    const events = loadViewing();
    const next: ViewingEvent = { id: card.id, title: card.title, platformId: card.platformId, league: card.league, at: safeNowISO() };
    saveViewing([...events, next]);
    track("viewing_log", { id: card.id, platformId: card.platformId ?? null });
  } catch {}
}

export function rankForYou(cards: Card[], profile: ProfileState, viewing: ViewingEvent[]): Card[] {
  const favPlatforms = new Set(profile.favoritePlatformIds);
  const favLeagues = new Set(profile.favoriteLeagues.map(normalizeKey));
  const favTeams = new Set(profile.favoriteTeams.map(normalizeKey));

  const recent = viewing.slice(-120);
  const seenKey = new Map<string, number>();
  for (let i = 0; i < recent.length; i++) {
    const v = recent[i];
    const k = `${normalizeKey(v.title)}|${v.platformId ?? ""}|${normalizeKey(v.league ?? "")}`;
    seenKey.set(k, (seenKey.get(k) ?? 0) + 1);
  }

  const scored = cards.map((c, idx) => {
    let s = 0;
    if (c.platformId && favPlatforms.has(c.platformId)) s += 10;
    if (c.league && favLeagues.has(normalizeKey(c.league))) s += 8;

    const titleK = normalizeKey(c.title);
    const subK = normalizeKey(c.subtitle ?? "");
    for (const t of favTeams) {
      if (t && (titleK.includes(t) || subK.includes(t))) {
        s += 7;
        break;
      }
    }

    if (c.badge === "LIVE") s += 4;
    if (c.badge === "UPCOMING") s += 2;

    const k = `${normalizeKey(c.title)}|${c.platformId ?? ""}|${normalizeKey(c.league ?? "")}`;
    const seen = seenKey.get(k) ?? 0;
    s -= Math.min(6, seen * 2);

    s += (idx % 7) * 0.01;
    return { c, s };
  });

  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.c);
}

export function buildDemoCatalog() {
  const mk = (p: Partial<Card> & { title: string }): Card => ({
    id: `c_${Math.random().toString(16).slice(2)}_${normalizeKey(p.title)}`,
    title: p.title,
    ...p,
  });

  const forYou: Card[] = [
    mk({ title: "The Bear", subtitle: "Season highlights", platformId: "hulu", genre: "Basic Streaming", metaLeft: "Comedy-drama", metaRight: "HD" }),
    mk({ title: "Planet Earth: Space", subtitle: "Documentary series", platformId: "pbspassport", genre: "Documentaries", metaLeft: "Doc", metaRight: "4K" }),
    mk({ title: "Anime Night: Classics", subtitle: "New episodes", platformId: "crunchyroll", genre: "Anime / Asian cinema", metaLeft: "Anime", metaRight: "Sub/Dub" }),
    mk({ title: "Kidoodle Adventure Hour", subtitle: "Free kids playlist", platformId: "kidoodletv", genre: "Kids", metaLeft: "Kids", metaRight: "Free" }),
    mk({ title: "UFC Countdown", subtitle: "Fight week special", platformId: "espnplus", league: "UFC", genre: "Premium Sports Streaming", metaLeft: "UFC", metaRight: "LIVE soon", badge: "UPCOMING" }),
    mk({ title: "Indie Spotlight", subtitle: "Festival picks", platformId: "mubi", genre: "Indie and Arthouse Film", metaLeft: "Indie", metaRight: "Curated" }),
    mk({ title: "LGBTQ+ Picks", subtitle: "Tonight’s selection", platformId: "dekkoo", genre: "LGBT", metaLeft: "LGBT", metaRight: "Curated" }),
    mk({ title: "FAST: Movie Marathon", subtitle: "Always-on free stream", platformId: "plutotv", genre: "Free Streaming", metaLeft: "FAST", metaRight: "Free" }),
  ];

  const liveNow: Card[] = [
    mk({ title: "NFL: Chiefs vs Bills", subtitle: "Weeknight football", platformId: "espn", league: "NFL", genre: "Premium Sports Streaming", badge: "LIVE", metaLeft: "NFL", metaRight: "Live", timeRemaining: "Q3 • 10:22" }),
    mk({ title: "NBA: Lakers vs Celtics", subtitle: "Rivalry night", platformId: "youtubetv", league: "NBA", genre: "LiveTV", badge: "LIVE", metaLeft: "NBA", metaRight: "Live", timeRemaining: "2nd • 04:18" }),
    mk({ title: "NHL: Bruins vs Rangers", subtitle: "Original Six vibes", platformId: "nhl", league: "NHL", genre: "Premium Sports Streaming", badge: "LIVE", metaLeft: "NHL", metaRight: "Live", timeRemaining: "3rd • 07:11" }),
    mk({ title: "FS1: Soccer Night", subtitle: "Live match window", platformId: "foxsports1", league: "Soccer", genre: "LiveTV", badge: "LIVE", metaLeft: "FS1", metaRight: "Live" }),
  ];

  const continueWatching: Card[] = [
    mk({ title: "Stranger Things", subtitle: "Continue Episode 4", platformId: "netflix", genre: "Basic Streaming", metaLeft: "Sci-fi", metaRight: "Resume" }),
    mk({ title: "The Batman", subtitle: "Continue at 01:12:33", platformId: "max", genre: "Movie Streaming", metaLeft: "Movie", metaRight: "Resume" }),
    mk({ title: "Indie Library", subtitle: "Continue watchlist", platformId: "criterion", genre: "Indie and Arthouse Film", metaLeft: "Arthouse", metaRight: "Resume" }),
  ];

  const trending: Card[] = [
    mk({ title: "Top 10 Today", subtitle: "Across streaming", platformId: "netflix", genre: "Basic Streaming", metaLeft: "Trending", metaRight: "Now" }),
    mk({ title: "Horror / Cult Night", subtitle: "New arrivals", platformId: "shudder", genre: "Horror / Cult", metaLeft: "Horror", metaRight: "New" }),
    mk({ title: "Free Channels: Live", subtitle: "FAST lineup", platformId: "therokuchannel", genre: "Free Streaming", metaLeft: "FAST", metaRight: "Live" }),
  ];

  const blackMediaCards: Card[] = [
    mk({ title: "Black Star Network: Live", subtitle: "News + culture", platformId: "blackstarnetwork", genre: "Black culture & diaspora", badge: "LIVE", metaLeft: "Live", metaRight: "Now" }),
    mk({ title: "MANSA Originals", subtitle: "Curated stories", platformId: "mansa", genre: "Black culture & diaspora", metaLeft: "Originals", metaRight: "New" }),
    mk({ title: "ALLBLK: Drama Picks", subtitle: "Binge-ready", platformId: "allblk", genre: "Black culture & diaspora", metaLeft: "Drama", metaRight: "HD" }),
    mk({ title: "HBCU Game of the Week", subtitle: "Showcase", platformId: "hbcugosports", league: "HBCUGOSPORTS", genre: "Premium Sports Streaming", badge: "UPCOMING", metaLeft: "HBCU", metaRight: "Soon", startTime: "Sat 7:30 PM" }),
  ];

  return { forYou, liveNow, continueWatching, trending, blackMediaCards };
}
