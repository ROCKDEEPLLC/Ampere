"use client";
// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from "react";

import { AboutSection } from '../../components/AboutSection';
import { brandLogoCandidates, headerIconCandidates, footerIconCandidates } from '../../lib/assetPath';
/* =========================
   Types
   ========================= */

type TabKey = "home" | "live" | "favs" | "search";
type GenreKey = (typeof GENRES)[number]["key"];
type PlatformId = string;

type Platform = {
  id: PlatformId;
  label: string;
  genres?: GenreKey[];
  kind?: "streaming" | "sports" | "kids" | "livetv" | "gaming" | "niche";
};

type Card = {
  id: string;
  title: string;
  subtitle?: string;
  platformId?: PlatformId;
  platformLabel?: string;
  badge?: "LIVE" | "UPCOMING" | "NEW" | string;
  badgeRight?: string;
  metaLeft?: string;
  metaRight?: string;
  league?: string;
  genre?: GenreKey;
  startTime?: string;
  timeRemaining?: string;
};

type ProfileState = {
  name: string;
  profilePhoto: string | null;
  headerPhoto: string | null;
  favoritePlatformIds: PlatformId[];
  favoriteLeagues: string[];
  favoriteTeams: string[];
  connectedPlatformIds: Partial<Record<PlatformId, boolean>>;
  notificationsEnabled: boolean;
};

type ViewingEvent = {
  id: string;
  title: string;
  platformId?: PlatformId;
  league?: string;
  at: string;
};

type AttributionEvent = {
  at: string;
  sessionId: string;
  event: string;
  props: Record<string, any>;
};

type WizardDraft = {
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
  platforms: PlatformId[];
  leagues: string[];
  teams: string[];
  updatedAt: string;
};

/* =========================
   Small utilities
   ========================= */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function safeNowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
}

function normalizeKey(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function toggleInArray<T>(arr: T[], item: T) {
  const has = arr.includes(item);
  return has ? arr.filter((x) => x !== item) : [...arr, item];
}

/** basePath / assetPrefix-safe paths */
function assetPath(p: string) {
  const prefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "").replace(/\/$/, "");
  if (!prefix) return p;
  return `${prefix}${p.startsWith("/") ? p : `/${p}`}`;
}

/* =========================
   Platforms + Genres
   ========================= */

const GENRES = [
  { key: "All" },
  { key: "Basic Streaming" },
  { key: "Movie Streaming" },
  { key: "Documentaries" },
  { key: "Anime / Asian cinema" },
  { key: "Kids" },
  { key: "LiveTV" },
  { key: "Premium Sports Streaming" },
  { key: "Gaming" },
  { key: "Free Streaming" },
  { key: "Indie and Arthouse Film" },
  { key: "Horror / Cult" },
  { key: "LGBT" },
  { key: "Black culture & diaspora" },
] as const;

const PLATFORMS: Platform[] = [
  { id: "netflix", label: "Netflix", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming", "Documentaries"] },
  { id: "hulu", label: "Hulu", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "primevideo", label: "Prime Video", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "disneyplus", label: "Disney+", kind: "streaming", genres: ["Basic Streaming", "Kids"] },
  { id: "max", label: "Max", kind: "streaming", genres: ["Movie Streaming", "Basic Streaming"] },
  { id: "peacock", label: "Peacock", kind: "streaming", genres: ["Basic Streaming", "LiveTV"] },
  { id: "paramountplus", label: "Paramount+", kind: "streaming", genres: ["Basic Streaming", "LiveTV"] },
  { id: "youtube", label: "YouTube", kind: "streaming", genres: ["Gaming", "Documentaries", "Free Streaming"] },
  { id: "youtubetv", label: "YouTube TV", kind: "livetv", genres: ["LiveTV", "Premium Sports Streaming"] },
  { id: "appletv", label: "Apple TV", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },

  { id: "espn", label: "ESPN", kind: "sports", genres: ["Premium Sports Streaming", "LiveTV"] },
  { id: "espnplus", label: "ESPN+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "dazn", label: "DAZN", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nflplus", label: "NFL+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nbaleaguepass", label: "NBA League Pass", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "mlbtv", label: "MLB.TV", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nhl", label: "NHL", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "foxsports1", label: "FOX Sports 1", kind: "sports", genres: ["LiveTV", "Premium Sports Streaming"] },

  { id: "tubi", label: "Tubi", kind: "streaming", genres: ["Free Streaming"] },
  { id: "twitch", label: "Twitch", kind: "gaming", genres: ["Gaming"] },
  { id: "sling", label: "Sling", kind: "livetv", genres: ["LiveTV"] },
  { id: "fubotv", label: "Fubo", kind: "livetv", genres: ["LiveTV", "Premium Sports Streaming"] },

  { id: "pbskids", label: "PBS Kids", kind: "kids", genres: ["Kids"] },
  { id: "pbspassport", label: "PBS Passport", kind: "streaming", genres: ["Documentaries"] },
  { id: "noggin", label: "Noggin", kind: "kids", genres: ["Kids"] },
  { id: "kidoodletv", label: "Kidoodle.TV", kind: "kids", genres: ["Kids"] },
  { id: "happykids", label: "HappyKids", kind: "kids", genres: ["Kids"] },
  { id: "sensical", label: "Sensical", kind: "kids", genres: ["Kids"] },

  { id: "heretv", label: "HERE TV", kind: "niche", genres: ["LGBT"] },
  { id: "outtv", label: "OUTtv", kind: "niche", genres: ["LGBT"] },
  { id: "dekkoo", label: "Dekkoo", kind: "niche", genres: ["LGBT"] },

  { id: "kick", label: "Kick", kind: "gaming", genres: ["Gaming"] },
  { id: "xboxcloud", label: "Xbox Cloud", kind: "gaming", genres: ["Gaming"] },
  { id: "geforcenow", label: "GeForce NOW", kind: "gaming", genres: ["Gaming"] },
  { id: "playstationplus", label: "PlayStation Plus", kind: "gaming", genres: ["Gaming"] },
  { id: "steam", label: "Steam", kind: "gaming", genres: ["Gaming"] },

  { id: "mubi", label: "MUBI", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "criterion", label: "Criterion", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "crunchyroll", label: "Crunchyroll", kind: "niche", genres: ["Anime / Asian cinema"] },
  { id: "shudder", label: "Shudder", kind: "niche", genres: ["Horror / Cult"] },

  { id: "hbcugo", label: "HBCUGO", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "hbcugosports", label: "HBCUGO Sports", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "blackmedia", label: "Black Media", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "blackstarnetwork", label: "Black Star Network", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "mansa", label: "MANSA", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "allblk", label: "ALLBLK", kind: "niche", genres: ["Black culture & diaspora"] },
];

const ALL_PLATFORM_IDS = PLATFORMS.map((p) => p.id);

function platformById(id: PlatformId) {
  return PLATFORMS.find((p) => p.id === id) ?? null;
}

function platformIdFromLabel(label: string): PlatformId | null {
  const k = normalizeKey(label);
  if (!k) return null;
  const exact = PLATFORMS.find((p) => normalizeKey(p.label) === k);
  if (exact) return exact.id;
  const includes = PLATFORMS.find((p) => normalizeKey(p.label).includes(k) || k.includes(normalizeKey(p.label)));
  return includes?.id ?? null;
}

function platformsForGenre(genre: GenreKey): PlatformId[] {
  if (genre === "All") return ["all", ...ALL_PLATFORM_IDS, "livetv"];
  const ids = PLATFORMS.filter((p) => (p.genres ?? []).includes(genre)).map((p) => p.id);
  return ["all", ...uniq(ids), "livetv"];
}

/* =========================
   Asset candidate helpers
   ========================= */

function brandWideCandidates() {
  return [
    assetPath("/brand/ampere-wide.svg"),
    assetPath("/brand/ampere-wide.png"),
    assetPath("/assets/brand/ampere-wide.svg"),
    assetPath("/assets/brand/ampere-wide.png"),
    // common alternates
    assetPath("/brand/ampere-wordmark.svg"),
    assetPath("/brand/ampere-long.svg"),
  ];
}

function brandMarkCandidates() {
  return [
    assetPath("/brand/ampere-mark.svg"),
    assetPath("/brand/ampere-mark.png"),
    assetPath("/assets/brand/ampere-mark.svg"),
    assetPath("/assets/brand/ampere-mark.png"),
    // common alternates
    assetPath("/brand/ampere-icon.svg"),
    assetPath("/brand/ampere-short.svg"),
  ];
}

/** expanded, real-world filename patterns */
function platformIconCandidates(pid: PlatformId) {
  const raw = String(pid ?? "");
  const base = normalizeKey(raw); // espnplus, youtubetv, disneyplus

  const variants = uniq(
    [
      base,
      raw.toLowerCase(),
      raw.toLowerCase().replace(/\s+/g, ""),
      raw.toLowerCase().replace(/\s+/g, "-"),
      raw.toLowerCase().replace(/\s+/g, "_"),
      base.endsWith("plus") ? `${base.slice(0, -4)}+` : null, // espn+
      base.endsWith("plus") ? `${base.slice(0, -4)}-plus` : null,
      base.endsWith("plus") ? `${base.slice(0, -4)}_plus` : null,
      raw.toLowerCase().replace(/\+/g, "plus"),
    ].filter(Boolean) as string[]
  );

  const roots = ["/logos/services", "/assets/services", "/assets/platforms", "/logos/platforms"];

  const out: string[] = [];
  for (const r of roots) {
    for (const v of variants) {
      out.push(assetPath(`${r}/${v}.png`));
      out.push(assetPath(`${r}/${v}.svg`));
    }
  }
  return out;
}

function leagueLogoCandidates(league?: string) {
  const k = normalizeKey(league ?? "");
  if (!k) return [];
  return [
    assetPath(`/logos/leagues/${k}.png`),
    assetPath(`/logos/leagues/${k}.svg`),
    assetPath(`/assets/leagues/${k}.png`),
    assetPath(`/assets/leagues/${k}.svg`),
  ];
}

const Genre_ICON_CANDIDATES: Partial<Record<GenreKey, string[]>> = {
  All: brandMarkCandidates(),
  "Basic Streaming": [assetPath("/assets/Genre/basicstreaming/icon.png"), assetPath("/assets/Genre/basicstreaming/icon.svg")],
  "Movie Streaming": [assetPath("/assets/Genre/moviestreaming/icon.png"), assetPath("/assets/Genre/moviestreaming/icon.svg")],
  Documentaries: [assetPath("/assets/Genre/documentaries/icon.png"), assetPath("/assets/Genre/documentaries/icon.svg")],
  "Anime / Asian cinema": [assetPath("/assets/Genre/animeasiancinema/icon.png"), assetPath("/assets/Genre/animeasiancinema/icon.svg")],
  Kids: [assetPath("/assets/Genre/kids/icon.png"), assetPath("/assets/Genre/kids/icon.svg")],
  LiveTV: [assetPath("/assets/Genre/livetv/icon.png"), assetPath("/assets/Genre/livetv/icon.svg")],
  "Premium Sports Streaming": [
    assetPath("/assets/Genre/premiumsportsstreaming/icon.png"),
    assetPath("/assets/Genre/premiumsportsstreaming/icon.svg"),
  ],
  Gaming: [assetPath("/assets/Genre/gaming/icon.png"), assetPath("/assets/Genre/gaming/icon.svg")],
  "Free Streaming": [assetPath("/assets/Genre/freestreaming/icon.png"), assetPath("/assets/Genre/freestreaming/icon.svg")],
  "Indie and Arthouse Film": [
    assetPath("/assets/Genre/indieandarthousefilm/icon.png"),
    assetPath("/assets/Genre/indieandarthousefilm/icon.svg"),
  ],
  "Horror / Cult": [assetPath("/assets/Genre/horrorcult/icon.png"), assetPath("/assets/Genre/horrorcult/icon.svg")],
  LGBT: [assetPath("/assets/Genre/lgbt/icon.png"), assetPath("/assets/Genre/lgbt/icon.svg")],
  "Black culture & diaspora": [
    assetPath("/assets/Genre/blackcultureanddiaspora/icon.png"),
    assetPath("/assets/Genre/blackcultureanddiaspora/icon.svg"),
  ],
};

/* =========================
   SmartImg (never shows broken-image)
   ========================= */

const FAILED_SRC = new Set<string>();
function rememberFailed(src: string) {
  try {
    FAILED_SRC.add(src);
  } catch {}
}

function SmartImg({
  sources,
  alt = "",
  size = 32,
  rounded = 12,
  fit = "cover",
  fill,
  border = true,
  style,
  fallbackText,
}: {
  sources: string[];
  alt?: string;
  size?: number;
  rounded?: number;
  fit?: React.CSSProperties["objectFit"];
  fill?: boolean;
  border?: boolean;
  style?: React.CSSProperties;
  fallbackText?: string;
}) {
  const key = (sources ?? []).filter(Boolean).join("|");
  const [resolved, setResolved] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setResolved(null);

    const candidates = (sources ?? []).filter(Boolean).filter((s) => !FAILED_SRC.has(s));
    if (!candidates.length) return;

    let i = 0;
    const tryNext = () => {
      if (!alive) return;
      if (i >= candidates.length) return;

      const src = candidates[i++];
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        setResolved(src);
      };
      img.onerror = () => {
        rememberFailed(src);
        tryNext();
      };
      img.src = src;
    };

    tryNext();
    return () => {
      alive = false;
    };
  }, [key]);

  if (!resolved) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: fill ? "100%" : size,
          height: fill ? "100%" : size,
          borderRadius: rounded,
          background: "rgba(255,255,255,0.10)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 950,
          color: "rgba(255,255,255,0.75)",
          border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
          ...style,
        }}
      >
        {fallbackText ?? "•"}
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={resolved}
      alt={alt}
      width={fill ? undefined : size}
      height={fill ? undefined : size}
      style={{
        width: fill ? "100%" : size,
        height: fill ? "100%" : size,
        borderRadius: rounded,
        objectFit: fit,
        display: "block",
        border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
        background: "rgba(255,255,255,0.06)",
        ...style,
      }}
    />
  );
}

/* =========================
   Local storage
   ========================= */

const STORAGE_KEY = "ampere_profile_v5";
const VIEWING_KEY = "ampere_viewing_v4";
const ATTR_KEY = "ampere_attrib_v1";
const SESSION_KEY = "ampere_session_v1";
const WIZ_KEY = "ampere_setup_wiz_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultProfile(): ProfileState {
  return {
    name: "Demo User",
    profilePhoto: null,
    headerPhoto: null,
    favoritePlatformIds: ["netflix", "espn", "blackmedia", "foxsports1"],
    favoriteLeagues: ["NFL", "NBA", "NCAAF", "NHL"],
    favoriteTeams: ["Los Angeles Lakers", "Boston Celtics", "Kansas City Chiefs"],
    connectedPlatformIds: {},
    notificationsEnabled: true,
  };
}

function normalizeProfile(p: Partial<ProfileState> | null): ProfileState {
  const d = defaultProfile();

  const favoritePlatformIds = Array.isArray(p?.favoritePlatformIds)
    ? (p!.favoritePlatformIds.filter(Boolean) as PlatformId[])
    : d.favoritePlatformIds;

  const favoriteLeagues = Array.isArray(p?.favoriteLeagues) ? p!.favoriteLeagues.filter(Boolean) : d.favoriteLeagues;
  const favoriteTeams = Array.isArray(p?.favoriteTeams) ? p!.favoriteTeams.filter(Boolean) : d.favoriteTeams;

  const connectedPlatformIds =
    p?.connectedPlatformIds && typeof p.connectedPlatformIds === "object"
      ? (p.connectedPlatformIds as Partial<Record<PlatformId, boolean>>)
      : {};

  return {
    ...d,
    ...p,
    favoritePlatformIds: uniq(favoritePlatformIds),
    favoriteLeagues: uniq(favoriteLeagues),
    favoriteTeams: uniq(favoriteTeams),
    connectedPlatformIds,
    notificationsEnabled: typeof p?.notificationsEnabled === "boolean" ? p!.notificationsEnabled : d.notificationsEnabled,
  };
}

function loadProfile(): ProfileState {
  if (typeof window === "undefined") return defaultProfile();
  const parsed = safeJsonParse<Partial<ProfileState>>(window.localStorage.getItem(STORAGE_KEY));
  return normalizeProfile(parsed);
}

function saveProfile(p: ProfileState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

function loadViewing(): ViewingEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<any>(window.localStorage.getItem(VIEWING_KEY));
  return Array.isArray(parsed) ? (parsed as ViewingEvent[]) : [];
}

function saveViewing(events: ViewingEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEWING_KEY, JSON.stringify(events.slice(-300)));
  } catch {}
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const from = window.sessionStorage.getItem(SESSION_KEY);
    if (from) return from;
    const id = `s_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Math.random().toString(16).slice(2)}`;
  }
}

function loadAttribution(): AttributionEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<any>(window.localStorage.getItem(ATTR_KEY));
  return Array.isArray(parsed) ? (parsed as AttributionEvent[]) : [];
}

function saveAttribution(events: AttributionEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(events.slice(-600)));
  } catch {}
}

function loadWizardDraft(): WizardDraft | null {
  if (typeof window === "undefined") return null;
  const parsed = safeJsonParse<WizardDraft>(window.localStorage.getItem(WIZ_KEY));
  if (!parsed) return null;
  const step = (parsed.step ?? 1) as any;
  return {
    step: ([1, 2, 3, 4, 5].includes(step) ? step : 1) as any,
    name: String(parsed.name ?? ""),
    platforms: Array.isArray(parsed.platforms) ? (parsed.platforms.filter(Boolean) as PlatformId[]) : [],
    leagues: Array.isArray(parsed.leagues) ? parsed.leagues.filter(Boolean) : [],
    teams: Array.isArray(parsed.teams) ? parsed.teams.filter(Boolean) : [],
    updatedAt: String(parsed.updatedAt ?? safeNowISO()),
  };
}

function saveWizardDraft(d: WizardDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WIZ_KEY, JSON.stringify(d));
  } catch {}
}

function clearWizardDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WIZ_KEY);
  } catch {}
}

/* =========================
   Provider links
   ========================= */

type ProviderLink = {
  openBase: string;
  subscribe?: string;
  search?: (q: string) => string;
};

const PROVIDER_LINKS: Partial<Record<PlatformId, ProviderLink>> = {
  netflix: {
    openBase: "https://www.netflix.com/Genre",
    subscribe: "https://www.netflix.com/signup",
    search: (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
  },
  hulu: { openBase: "https://www.hulu.com/hub/home", subscribe: "https://www.hulu.com/welcome", search: (q) => `https://www.hulu.com/search?q=${encodeURIComponent(q)}` },
  primevideo: { openBase: "https://www.primevideo.com", subscribe: "https://www.primevideo.com", search: (q) => `https://www.primevideo.com/search/ref=atv_nb_sug?phrase=${encodeURIComponent(q)}` },
  disneyplus: { openBase: "https://www.disneyplus.com/home", subscribe: "https://www.disneyplus.com", search: (q) => `https://www.disneyplus.com/search/${encodeURIComponent(q)}` },
  max: { openBase: "https://play.max.com", subscribe: "https://www.max.com" },
  peacock: { openBase: "https://www.peacocktv.com/watch/home", subscribe: "https://www.peacocktv.com/plans/all-monthly", search: (q) => `https://www.peacocktv.com/search?q=${encodeURIComponent(q)}` },
  paramountplus: { openBase: "https://www.paramountplus.com", subscribe: "https://www.paramountplus.com/account/signup/", search: (q) => `https://www.paramountplus.com/search/${encodeURIComponent(q)}` },
  youtube: { openBase: "https://www.youtube.com", subscribe: "https://www.youtube.com/premium", search: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  youtubetv: { openBase: "https://tv.youtube.com", subscribe: "https://tv.youtube.com/welcome/" },
  appletv: { openBase: "https://tv.apple.com", subscribe: "https://tv.apple.com", search: (q) => `https://tv.apple.com/search?term=${encodeURIComponent(q)}` },

  espn: { openBase: "https://www.espn.com/watch/", subscribe: "https://plus.espn.com", search: (q) => `https://www.espn.com/search/results?q=${encodeURIComponent(q)}` },
  espnplus: { openBase: "https://plus.espn.com", subscribe: "https://plus.espn.com" },
  dazn: { openBase: "https://www.dazn.com", subscribe: "https://www.dazn.com" },
  nflplus: { openBase: "https://www.nfl.com/plus", subscribe: "https://www.nfl.com/plus" },
  nbaleaguepass: { openBase: "https://www.nba.com/watch/league-pass", subscribe: "https://www.nba.com/watch/league-pass" },
  mlbtv: { openBase: "https://www.mlb.com/live-stream-games/subscribe", subscribe: "https://www.mlb.com/live-stream-games/subscribe" },
  nhl: { openBase: "https://www.nhl.com", subscribe: "https://www.nhl.com/subscribe" },
  foxsports1: { openBase: "https://www.foxsports.com/live/fs1", subscribe: "https://www.foxsports.com/live/fs1" },

  tubi: { openBase: "https://tubitv.com", subscribe: "https://tubitv.com" },
  twitch: { openBase: "https://www.twitch.tv", search: (q) => `https://www.twitch.tv/search?term=${encodeURIComponent(q)}` },
  sling: { openBase: "https://www.sling.com", subscribe: "https://www.sling.com" },
  fubotv: { openBase: "https://www.fubo.tv/welcome", subscribe: "https://www.fubo.tv/welcome" },

  heretv: { openBase: "https://www.heretv.com", subscribe: "https://www.heretv.com" },
  outtv: { openBase: "https://outtvgo.com", subscribe: "https://outtvgo.com" },
  dekkoo: { openBase: "https://www.dekkoo.com", subscribe: "https://www.dekkoo.com" },

  kick: { openBase: "https://kick.com", subscribe: "https://kick.com" },
  xboxcloud: { openBase: "https://www.xbox.com/play", subscribe: "https://www.xbox.com/play" },
  geforcenow: { openBase: "https://www.nvidia.com/en-us/geforce-now/", subscribe: "https://www.nvidia.com/en-us/geforce-now/" },
  playstationplus: { openBase: "https://www.playstation.com/ps-plus/", subscribe: "https://www.playstation.com/ps-plus/" },
  steam: { openBase: "https://store.steampowered.com", subscribe: "https://store.steampowered.com" },

  pbskids: { openBase: "https://pbskids.org" },
  pbspassport: { openBase: "https://www.pbs.org/passport/" },
  noggin: { openBase: "https://www.nick.com/apps/noggin", subscribe: "https://www.nick.com/apps/noggin" },
  kidoodletv: { openBase: "https://www.kidoodle.tv" },
  happykids: { openBase: "https://happykids.tv" },
  sensical: { openBase: "https://sensical.tv" },

  hbcugo: { openBase: "https://hbcugo.tv", subscribe: "https://hbcugo.tv" },
  hbcugosports: { openBase: "https://hbcugo.tv/Sports", subscribe: "https://hbcugo.tv/Sports" },

  crunchyroll: { openBase: "https://www.crunchyroll.com", subscribe: "https://www.crunchyroll.com" },
  mubi: { openBase: "https://mubi.com", subscribe: "https://mubi.com" },
  criterion: { openBase: "https://www.criterionchannel.com", subscribe: "https://www.criterionchannel.com" },
  shudder: { openBase: "https://www.shudder.com", subscribe: "https://www.shudder.com" },

  blackmedia: { openBase: "https://www.google.com/search?q=black+media+streaming" },
  blackstarnetwork: { openBase: "https://www.theblackstarnetwork.com", subscribe: "https://www.theblackstarnetwork.com" },
  mansa: { openBase: "https://www.mansastreaming.com", subscribe: "https://www.mansastreaming.com" },
  allblk: { openBase: "https://allblk.tv", subscribe: "https://allblk.tv" },
};

function providerUrlOpen(pid: PlatformId | null, title: string) {
  const link = pid ? PROVIDER_LINKS[pid] : undefined;
  if (link?.search) return link.search(title);
  if (link?.openBase) return link.openBase;
  return "https://www.google.com/search?q=" + encodeURIComponent(`${pid ?? "streaming"} ${title}`);
}

function providerUrlSubscribe(pid: PlatformId | null) {
  const link = pid ? PROVIDER_LINKS[pid] : undefined;
  if (link?.subscribe) return link.subscribe;
  if (link?.openBase) return link.openBase;
  return "https://www.google.com/search?q=" + encodeURIComponent(`${pid ?? "streaming"} subscribe`);
}

function redactUrl(u: string) {
  try {
    const x = new URL(u);
    return `${x.origin}${x.pathname}${x.search ? "?…" : ""}`;
  } catch {
    return u ? "url" : "";
  }
}

/* =========================
   Teams
   ========================= */

function teamLogoCandidates(league: string, team: string): string[] {
  const l = normalizeKey(league);
  const t = normalizeKey(team);
  return [
    assetPath(`/assets/teams/${l}/${t}.png`),
    assetPath(`/assets/teams/${l}/${t}.svg`),
    assetPath(`/assets/teams/${l}/${t}/logo.png`),
    assetPath(`/assets/teams/${l}/${t}/logo.svg`),
    assetPath(`/logos/teams/${l}/${t}.png`),
    assetPath(`/logos/teams/${l}/${t}.svg`),
    assetPath(`/logos/teams/${l}/${t}/logo.png`),
  ];
}

const LEAGUES = ["ALL", "NFL", "NBA", "MLB", "NHL", "NCAAF", "Soccer", "UFC", "HBCUGOSPORTS", "HBCUGO"] as const;

const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  NFL: [
    "Arizona Cardinals","Atlanta Falcons","Baltimore Ravens","Buffalo Bills","Carolina Panthers","Chicago Bears","Cincinnati Bengals","Cleveland Browns","Dallas Cowboys","Denver Broncos","Detroit Lions","Green Bay Packers","Houston Texans","Indianapolis Colts","Jacksonville Jaguars","Kansas City Chiefs","Las Vegas Raiders","Los Angeles Chargers","Los Angeles Rams","Miami Dolphins","Minnesota Vikings","New England Patriots","New Orleans Saints","New York Giants","New York Jets","Philadelphia Eagles","Pittsburgh Steelers","San Francisco 49ers","Seattle Seahawks","Tampa Bay Buccaneers","Tennessee Titans","Washington Commanders",
  ],
  NBA: [
    "Atlanta Hawks","Boston Celtics","Brooklyn Nets","Charlotte Hornets","Chicago Bulls","Cleveland Cavaliers","Dallas Mavericks","Denver Nuggets","Detroit Pistons","Golden State Warriors","Houston Rockets","Indiana Pacers","LA Clippers","Los Angeles Lakers","Memphis Grizzlies","Miami Heat","Milwaukee Bucks","Minnesota Timberwolves","New Orleans Pelicans","New York Knicks","Oklahoma City Thunder","Orlando Magic","Philadelphia 76ers","Phoenix Suns","Portland Trail Blazers","Sacramento Kings","San Antonio Spurs","Toronto Raptors","Utah Jazz","Washington Wizards",
  ],
  MLB: [
    "Arizona Diamondbacks","Atlanta Braves","Baltimore Orioles","Boston Red Sox","Chicago Cubs","Chicago White Sox","Cincinnati Reds","Cleveland Guardians","Colorado Rockies","Detroit Tigers","Houston Astros","Indianapolis Colts","Kansas City Royals","Los Angeles Angels","Los Angeles Dodgers","Miami Marlins","Milwaukee Brewers","Minnesota Twins","New York Mets","New York Yankees","Oakland Athletics","Philadelphia Phillies","Pittsburgh Pirates","San Diego Padres","San Francisco Giants","Seattle Mariners","St. Louis Cardinals","Tampa Bay Rays","Texas Rangers","Toronto Blue Jays","Washington Nationals",
  ],
  NHL: [
    "Anaheim Ducks","Arizona Coyotes","Boston Bruins","Buffalo Sabres","Calgary Flames","Carolina Hurricanes","Chicago Blackhawks","Colorado Avalanche","Columbus Blue Jackets","Dallas Stars","Detroit Red Wings","Edmonton Oilers","Florida Panthers","Los Angeles Kings","Minnesota Wild","Montreal Canadiens","Nashville Predators","New Jersey Devils","New York Islanders","New York Rangers","Ottawa Senators","Philadelphia Flyers","Pittsburgh Penguins","San Jose Sharks","Seattle Kraken","St. Louis Blues","Tampa Bay Lightning","Toronto Maple Leafs","Vancouver Canucks","Vegas Golden Knights","Washington Capitals","Winnipeg Jets",
  ],
  NCAAF: [
    "Alabama Crimson Tide","Arizona Wildcats","Arizona State Sun Devils","Arkansas Razorbacks","Auburn Tigers","Baylor Bears","Boise State Broncos","Boston College Eagles","BYU Cougars","California Golden Bears","Clemson Tigers","Colorado Buffaloes","Duke Blue Devils","Florida Gators","Florida State Seminoles","Georgia Bulldogs","Georgia Tech Yellow Jackets","Illinois Fighting Illini","Indiana Hoosiers","Iowa Hawkeyes","Iowa State Cyclones","Kansas Jayhawks","Kansas State Wildcats","Kentucky Wildcats","LSU Tigers","Louisville Cardinals","Maryland Terrapins","Miami Hurricanes","Michigan Wolverines","Michigan State Spartans","Minnesota Golden Gophers","Mississippi State Bulldogs","Missouri Tigers","Nebraska Cornhuskers","North Carolina Tar Heels","NC State Wolfpack","Notre Dame Fighting Illini","Ohio State Buckeyes","Oklahoma Sooners","Oklahoma State Cowboys","Ole Miss Rebels","Oregon Ducks","Oregon State Beavers","Penn State Nittany Lions","Pittsburgh Panthers","Purdue Boilermakers","Rutgers Scarlet Knights","South Carolina Gamecocks","Stanford Cardinal","Syracuse Orange","TCU Horned Frogs","Tennessee Volunteers","Texas Longhorns","Texas A&M Aggies","Texas Tech Red Raiders","UCLA Bruins","USC Trojans","Utah Utes","Vanderbilt Commodores","Virginia Cavaliers","Virginia Tech Hokies","Wake Forest Demon Deacons","Washington Huskies","West Virginia Mountaineers","Wisconsin Badgers",
  ],
  Soccer: [
    "Inter Miami CF","LA Galaxy","New York City FC","Seattle Sounders","Atlanta United","Arsenal","Chelsea","Liverpool","Manchester City","Manchester United","Tottenham Hotspur","Barcelona","Real Madrid","Bayern Munich","PSG","Juventus","Inter Milan","AC Milan",
  ],
  UFC: ["UFC Fight Night", "UFC Main Card", "UFC PPV Main Event"],
  HBCUGOSPORTS: ["HBCU Showcase", "HBCU Game of the Week", "Classic Rivalry"],
  HBCUGO: ["Campus Stories", "HBCU Spotlight", "Student Athletes"],
};

function canonicalLeagueForTeams(league?: string): string | null {
  const k = normalizeKey(league ?? "");
  if (!k) return null;
  const map: Record<string, string> = {
    nfl: "NFL",
    nba: "NBA",
    mlb: "MLB",
    nhl: "NHL",
    ncaaf: "NCAAF",
    soccer: "Soccer",
    ufc: "UFC",
    hbcugosports: "HBCUGOSPORTS",
    hbcugo: "HBCUGO",
  };
  return map[k] ?? null;
}

function findTeamByFragment(leagueCanon: string, frag: string): string | null {
  const teams = TEAMS_BY_LEAGUE[leagueCanon] ?? [];
  const fk = normalizeKey(frag);
  if (!fk) return null;

  let hit = teams.find((t) => normalizeKey(t).includes(fk));
  if (hit) return hit;

  hit = teams.find((t) => normalizeKey(t).endsWith(fk));
  if (hit) return hit;

  const last = frag.trim().split(/\s+/).slice(-1)[0] ?? "";
  const lk = normalizeKey(last);
  if (lk) {
    hit = teams.find((t) => normalizeKey(t).endsWith(lk));
    if (hit) return hit;
  }

  return null;
}

function parseMatchupFromTitle(title: string): { a?: string; b?: string } {
  const raw = title.includes(":") ? title.split(":").slice(1).join(":").trim() : title.trim();
  const m = raw.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (!m) return {};
  return { a: m[1]?.trim(), b: m[2]?.trim() };
}

/* =========================
   Design tokens + global CSS
   ========================= */

const AMPERE_GLOBAL_CSS = `
:root{
  --bg0:#050505;
  --bg1:#0b0b0b;
  --surface: rgba(255,255,255,0.05);
  --surface2: rgba(255,255,255,0.08);
  --stroke: rgba(255,255,255,0.10);
  --stroke2: rgba(255,255,255,0.14);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.70);
  --muted2: rgba(255,255,255,0.55);

  --accent: rgba(58,167,255,1);
  --accentA: rgba(58,167,255,0.22);
  --accentB: rgba(58,167,255,0.12);

  --r-xl: 22px;
  --r-lg: 18px;
  --r-md: 14px;

  --shadow-lg: 0 20px 90px rgba(0,0,0,0.65);
  --shadow-md: 0 18px 60px rgba(0,0,0,0.55);

  --focus: rgba(58,167,255,0.90);
}
*{ box-sizing:border-box; }
button, a, input { -webkit-tap-highlight-color: transparent; }
.ampere-focus:focus-visible{
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0,0,0,0.55);
}
@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
`;

/* =========================
   Icons
   ========================= */

function IconChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.7-1l-.3-2.5H9l-.3 2.5a8 8 0 0 0-1.7 1L4.6 9l-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 1L2.6 16.5l2 3.5 2.4-.7a8 8 0 0 0 1.7 1l.3 2.5h6l.3-2.5a8 8 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconLive() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 12a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.2-9.2C1 7.8 3.5 5 6.6 5c1.8 0 3.3.9 4.2 2.1C11.7 5.9 13.2 5 15 5c3.1 0 5.6 2.8 3.8 6.8C19 16.4 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.4-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconRemote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="10" cy="16" r="1" fill="currentColor" />
      <circle cx="14" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

/* =========================
   Responsive density
   ========================= */

function useViewport() {
  const [w, setW] = useState<number>(() => (typeof window === "undefined" ? 1200 : window.innerWidth));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const isMobile = w < 860;

  const density = useMemo(() => {
    if (isMobile) {
      return { pad: 12, gap: 14, h1: 24, h2: 18, small: 12, cardMinW: 220, heroH: 120 };
    }
    return { pad: 16, gap: 18, h1: 30, h2: 20, small: 13, cardMinW: 260, heroH: 140 };
  }, [isMobile]);

  return { isMobile, density };
}

/* =========================
   Modal
   ========================= */

function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = 980,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const prevBodyOverflowRef = useRef<string>("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const titleId = useMemo(() => `modal_${normalizeKey(title)}_${Math.random().toString(16).slice(2)}`, [title]);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = (document.activeElement as HTMLElement) ?? null;
    prevBodyOverflowRef.current = document.body.style.overflow ?? "";
    document.body.style.overflow = "hidden";

    const getFocusable = (root: HTMLElement) => {
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
      return nodes.filter((el) => {
        const disabled = (el as HTMLButtonElement).disabled;
        const ariaDisabled = el.getAttribute("aria-disabled") === "true";
        const hidden = el.getAttribute("aria-hidden") === "true";
        return !disabled && !ariaDisabled && !hidden && el.offsetParent !== null;
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root) return;

        const focusables = getFocusable(root);
        if (!focusables.length) {
          e.preventDefault();
          root.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || !root.contains(active) || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || !root.contains(active) || active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);

    requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusables = getFocusable(root);
      const active = document.activeElement as HTMLElement | null;
      if (active && root.contains(active)) return;
      if (focusables.length) focusables[0].focus();
      else root.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflowRef.current ?? "";
      requestAnimationFrame(() => lastActiveRef.current?.focus?.());
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(10px)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: `min(${maxWidth}px, 100%)`,
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--stroke)",
          background: "rgba(12,12,12,0.98)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          outline: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 60%), rgba(0,0,0,0.35)",
          }}
        >
          <div id={titleId} style={{ fontSize: 18, fontWeight: 950, color: "white" }}>
            {title}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            className="ampere-focus"
            aria-label="Close modal"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 14, maxHeight: "72vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Pills / chips / dropdown
   ========================= */

function PillButton({
  label,
  iconSources,
  iconNode,
  active,
  onClick,
  fullWidth,
  multiline,
  ariaLabel,
  subtle,
}: {
  label: string;
  iconSources?: string[];
  iconNode?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  multiline?: boolean;
  ariaLabel?: string;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ampere-focus"
      aria-label={ariaLabel ?? label}
      aria-pressed={!!active}
      style={{
        width: fullWidth ? "100%" : undefined,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 999,
        border: active ? "1px solid rgba(58,167,255,0.38)" : "1px solid var(--stroke)",
        background: active
          ? "linear-gradient(180deg, rgba(58,167,255,0.18), rgba(0,0,0,0.06)), rgba(255,255,255,0.06)"
          : subtle
          ? "rgba(0,0,0,0.18)"
          : "rgba(255,255,255,0.05)",
        color: "white",
        cursor: "pointer",
        fontWeight: 950,
        userSelect: "none",
        minWidth: 0,
        position: "relative",
        boxShadow: active ? "0 0 0 1px rgba(58,167,255,0.10) inset" : undefined,
      }}
    >
      {iconNode ? (
        <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          {iconNode}
        </span>
      ) : iconSources && iconSources.length ? (
        <span style={{ flex: "0 0 auto" }}>
          <SmartImg sources={iconSources} size={24} rounded={9} fit="contain" fallbackText={label.slice(0, 1).toUpperCase()} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 24,
            height: 24,
            borderRadius: 9,
            background: "rgba(255,255,255,0.10)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            flex: "0 0 auto",
          }}
        >
          •
        </span>
      )}

      <span
        style={{
          flex: "1 1 auto",
          opacity: 0.95,
          whiteSpace: multiline ? "normal" : "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: multiline ? 1.15 : 1,
          textAlign: "center",
          paddingRight: active ? 16 : 0,
        }}
      >
        {label}
      </span>

      {active ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "rgba(58,167,255,0.95)",
            boxShadow: "0 0 0 4px rgba(58,167,255,0.14)",
          }}
        />
      ) : null}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <button
      type="button"
      className="ampere-focus"
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(58,167,255,0.22)",
        background: "rgba(58,167,255,0.10)",
        color: "white",
        fontWeight: 950,
        cursor: onRemove ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
      aria-label={onRemove ? `Remove ${label}` : label}
    >
      <span style={{ opacity: 0.95 }}>{label}</span>
      {onRemove ? <span style={{ opacity: 0.85, fontWeight: 950 }}>✕</span> : null}
    </button>
  );
}

const DropdownCtx = React.createContext<{ close: () => void } | null>(null);

function Dropdown({
  label,
  iconLeft,
  children,
  minWidth = 280,
}: {
  label: string;
  iconLeft?: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", on);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="ampere-focus"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 999,
          border: open ? "1px solid rgba(58,167,255,0.26)" : "1px solid var(--stroke)",
          background: open ? "rgba(58,167,255,0.10)" : "rgba(255,255,255,0.04)",
          color: "white",
          cursor: "pointer",
          fontWeight: 950,
          whiteSpace: "nowrap",
          boxShadow: open ? "0 0 0 1px rgba(58,167,255,0.10) inset" : undefined,
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {iconLeft ? <span style={{ display: "inline-flex" }}>{iconLeft}</span> : null}
        <span style={{ opacity: 0.95 }}>{label}</span>
        <IconChevronDown />
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(4px)",
              zIndex: 88,
            }}
            onMouseDown={() => setOpen(false)}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 10px)",
              minWidth,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(10,10,10,0.995)",
              backdropFilter: "blur(16px)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              zIndex: 89,
            }}
          >
            <DropdownCtx.Provider value={{ close: () => setOpen(false) }}>
              <div style={{ padding: 10, display: "grid", gap: 8 }}>{children}</div>
            </DropdownCtx.Provider>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  title,
  subtitle,
  onClick,
  right,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const ctx = React.useContext(DropdownCtx);

  return (
    <button
      type="button"
      onClick={() => {
        ctx?.close(); // ✅ close before opening modal
        onClick?.();
      }}
      className="ampere-focus"
      role="menuitem"
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.10)",
        padding: 12,
        color: "white",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 950, opacity: 0.94 }}>{title}</div>
        {subtitle ? <div style={{ marginTop: 4, fontWeight: 850, opacity: 0.68, fontSize: 12 }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ opacity: 0.9, fontWeight: 950 }}>{right}</div> : null}
    </button>
  );
}

/* =========================
   Filter accordion
   ========================= */

function FilterAccordion({
  title,
  right,
  children,
  defaultOpen,
  isMobile,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => {
    if (!isMobile) setOpen(true);
  }, [isMobile]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <button
        type="button"
        onClick={() => (isMobile ? setOpen((s) => !s) : null)}
        className="ampere-focus"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
          background: "transparent",
          border: "none",
          color: "white",
          cursor: isMobile ? "pointer" : "default",
          padding: 0,
        }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 18, fontWeight: 950 }}>{title}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, opacity: 0.8, fontWeight: 900, fontSize: 13 }}>
          {right}
          {isMobile ? (
            <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 120ms ease" }}>
              <IconChevronDown />
            </span>
          ) : null}
        </span>
      </button>

      {open ? children : null}
    </div>
  );
}

/* =========================
   Cards + grids
   ========================= */

function CardThumb({
  card,
  heroH,
  onOpen,
}: {
  card: Card;
  heroH: number;
  onOpen: (c: Card) => void;
}) {
  const platform = card.platformId ? platformById(card.platformId) : undefined;
  const badgeRight = card.badgeRight ?? platform?.label ?? card.platformLabel ?? "";

  const platformWatermarkSources = card.platformId
    ? [...platformIconCandidates(card.platformId), ...brandWideCandidates()]
    : [...brandWideCandidates(), ...brandMarkCandidates()];

  const leagueCanon = canonicalLeagueForTeams(card.league);
  const matchup = parseMatchupFromTitle(card.title);
  const t1 = leagueCanon && matchup.a ? findTeamByFragment(leagueCanon, matchup.a) : null;
  const t2 = leagueCanon && matchup.b ? findTeamByFragment(leagueCanon, matchup.b) : null;
  const team1Sources = leagueCanon && t1 ? teamLogoCandidates(leagueCanon, t1) : [];
  const team2Sources = leagueCanon && t2 ? teamLogoCandidates(leagueCanon, t2) : [];

  const leagueSources = leagueLogoCandidates(card.league);
  const platformIcon = card.platformId ? platformIconCandidates(card.platformId) : [];

  return (
    <button
      type="button"
      onClick={() => onOpen(card)}
      className="ampere-focus"
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: "1px solid var(--stroke)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          height: heroH,
          background:
            "radial-gradient(900px 260px at 30% 0%, rgba(58,167,255,0.18), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.20))",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.22, pointerEvents: "none", display: "grid", placeItems: "center", padding: 16 }}>
          <SmartImg
            sources={platformWatermarkSources}
            size={900}
            rounded={0}
            border={false}
            fit="contain"
            fill
            style={{ filter: "saturate(0.95) contrast(1.05)" }}
            fallbackText="AMPÈRE"
          />
        </div>

        {team1Sources.length > 0 && team2Sources.length > 0 ? (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: 10, top: 10, bottom: 10, width: "45%", opacity: 0.28, display: "grid", placeItems: "center" }}>
              <SmartImg sources={team1Sources} size={600} rounded={0} border={false} fit="contain" fill />
            </div>
            <div style={{ position: "absolute", right: 10, top: 10, bottom: 10, width: "45%", opacity: 0.28, display: "grid", placeItems: "center" }}>
              <SmartImg sources={team2Sources} size={600} rounded={0} border={false} fit="contain" fill />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", opacity: 0.45, fontWeight: 950, letterSpacing: 2, fontSize: 12 }}>
              VS
            </div>
          </div>
        ) : null}

        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 8 }}>
          {card.badge ? (
            <span
              style={{
                padding: "5px 9px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background:
                  card.badge === "LIVE"
                    ? "rgba(255,72,72,0.22)"
                    : card.badge === "UPCOMING"
                    ? "rgba(58,167,255,0.20)"
                    : "rgba(255,255,255,0.12)",
                color: "white",
                fontWeight: 950,
                fontSize: 11,
                letterSpacing: 0.6,
              }}
            >
              {card.badge}
            </span>
          ) : null}
        </div>

        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {badgeRight ? (
            <span
              style={{
                padding: "5px 9px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.40)",
                color: "white",
                fontWeight: 950,
                fontSize: 11,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={badgeRight}
            >
              {badgeRight}
            </span>
          ) : null}
        </div>

        <div style={{ position: "absolute", left: 10, bottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          {leagueSources.length ? <SmartImg sources={leagueSources} size={26} rounded={10} fit="contain" fallbackText={(card.league ?? "L")[0]} /> : null}
          {platformIcon.length ? <SmartImg sources={platformIcon} size={26} rounded={10} fit="contain" fallbackText={(platform?.label ?? "P")[0]} /> : null}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ color: "white", fontWeight: 950, fontSize: 15, lineHeight: 1.15 }}>{card.title}</div>

        {card.subtitle ? <div style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, fontWeight: 850, fontSize: 12 }}>{card.subtitle}</div> : null}

        {card.metaLeft || card.metaRight ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 8,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 900,
              fontSize: 11,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.metaLeft ?? ""}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.metaRight ?? ""}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

function Section({
  title,
  rightText,
  onRightClick,
  children,
}: {
  title: string;
  rightText?: string;
  onRightClick?: () => void;
  children: React.ReactNode;
}) {
  const showHeader = !!title || !!rightText;
  if (!showHeader) return <>{children}</>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 950, color: "white" }}>{title}</div>
        {rightText ? (
          <button
            type="button"
            onClick={onRightClick}
            className="ampere-focus"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.76)",
              cursor: "pointer",
              fontWeight: 950,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {rightText}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CardGrid({
  cards,
  cardMinW,
  heroH,
  onOpen,
  skeleton,
}: {
  cards: Card[];
  cardMinW: number;
  heroH: number;
  onOpen: (c: Card) => void;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cardMinW}px, 1fr))`, gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 18,
              border: "1px solid var(--stroke)",
              background: "rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: heroH, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              <div style={{ height: 14, background: "rgba(255,255,255,0.08)", borderRadius: 8 }} />
              <div style={{ height: 12, width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: 8 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cardMinW}px, 1fr))`, gap: 12 }}>
      {cards.map((c) => (
        <CardThumb key={c.id} card={c} heroH={heroH} onOpen={onOpen} />
      ))}
      {!cards.length ? <div style={{ opacity: 0.75, fontWeight: 950 }}>No items.</div> : null}
    </div>
  );
}

function PagedCardGrid({
  cards,
  cardMinW,
  heroH,
  onOpen,
  pageSize = 24,
}: {
  cards: Card[];
  cardMinW: number;
  heroH: number;
  onOpen: (c: Card) => void;
  pageSize?: number;
}) {
  const [shown, setShown] = useState(pageSize);
  useEffect(() => setShown(pageSize), [cards, pageSize]);

  const slice = cards.slice(0, shown);
  const more = shown < cards.length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CardGrid cards={slice} cardMinW={cardMinW} heroH={heroH} onOpen={onOpen} />
      {more ? (
        <button
          type="button"
          onClick={() => setShown((n) => Math.min(cards.length, n + pageSize))}
          className="ampere-focus"
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.10)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Load more ({slice.length}/{cards.length})
        </button>
      ) : null}
    </div>
  );
}

/* =========================
   Tracking + ranking + demo catalog
   ========================= */

function track(event: string, props: Record<string, any>) {
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

function uniqByCardKey(cards: Card[]) {
  const m = new Map<string, Card>();
  for (const c of cards) {
    const k = [normalizeKey(c.title), c.platformId ?? normalizeKey(c.platformLabel ?? ""), normalizeKey(c.league ?? ""), normalizeKey(c.genre ?? "")].join("|");
    if (!m.has(k)) m.set(k, c);
  }
  return Array.from(m.values());
}

function logViewing(card: Card) {
  try {
    const events = loadViewing();
    const next: ViewingEvent = { id: card.id, title: card.title, platformId: card.platformId, league: card.league, at: safeNowISO() };
    saveViewing([...events, next]);
    track("viewing_log", { id: card.id, platformId: card.platformId ?? null });
  } catch {}
}

function rankForYou(cards: Card[], profile: ProfileState, viewing: ViewingEvent[]): Card[] {
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

function buildDemoCatalog(): {
  forYou: Card[];
  liveNow: Card[];
  continueWatching: Card[];
  trending: Card[];
  blackMediaCards: Card[];
} {
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
    mk({ title: "Gaming: Speedrun Marathon", subtitle: "Live marathon", platformId: "twitch", genre: "Gaming", metaLeft: "Gaming", metaRight: "LIVE", badge: "LIVE" }),
  ];

  const liveNow: Card[] = [
    mk({ title: "NFL: Chiefs vs Bills", subtitle: "Weeknight football", platformId: "espn", league: "NFL", genre: "Premium Sports Streaming", badge: "LIVE", metaLeft: "NFL", metaRight: "Live", timeRemaining: "Q3 • 10:22" }),
    mk({ title: "NBA: Lakers vs Celtics", subtitle: "Rivalry night", platformId: "youtubetv", league: "NBA", genre: "LiveTV", badge: "LIVE", metaLeft: "NBA", metaRight: "Live", timeRemaining: "2nd • 04:18" }),
    mk({ title: "NHL: Bruins vs Rangers", subtitle: "Original Six vibes", platformId: "nhl", league: "NHL", genre: "Premium Sports Streaming", badge: "LIVE", metaLeft: "NHL", metaRight: "Live", timeRemaining: "3rd • 07:11" }),
    mk({ title: "NCAAF: Georgia vs Alabama", subtitle: "Top matchup", platformId: "fubotv", league: "NCAAF", genre: "LiveTV", badge: "LIVE", metaLeft: "NCAAF", metaRight: "Live", timeRemaining: "Q2 • 05:41" }),
    mk({ title: "FS1: Soccer Night", subtitle: "Live match window", platformId: "foxsports1", league: "Soccer", genre: "LiveTV", badge: "LIVE", metaLeft: "FS1", metaRight: "Live" }),
    mk({ title: "UFC Fight Night", subtitle: "Main card", platformId: "espnplus", league: "UFC", genre: "Premium Sports Streaming", badge: "LIVE", metaLeft: "UFC", metaRight: "Live" }),
  ];

  const continueWatching: Card[] = [
    mk({ title: "Stranger Things", subtitle: "Continue Episode 4", platformId: "netflix", genre: "Basic Streaming", metaLeft: "Sci-fi", metaRight: "Resume" }),
    mk({ title: "The Batman", subtitle: "Continue at 01:12:33", platformId: "max", genre: "Movie Streaming", metaLeft: "Movie", metaRight: "Resume" }),
    mk({ title: "Crunchyroll Picks", subtitle: "Continue queue", platformId: "crunchyroll", genre: "Anime / Asian cinema", metaLeft: "Anime", metaRight: "Resume" }),
    mk({ title: "Indie Library", subtitle: "Continue watchlist", platformId: "criterion", genre: "Indie and Arthouse Film", metaLeft: "Arthouse", metaRight: "Resume" }),
  ];

  const trending: Card[] = [
    mk({ title: "Top 10 Today", subtitle: "Across streaming", platformId: "netflix", genre: "Basic Streaming", metaLeft: "Trending", metaRight: "Now" }),
    mk({ title: "Horror / Cult Night", subtitle: "New arrivals", platformId: "shudder", genre: "Horror / Cult", metaLeft: "Horror", metaRight: "New" }),
    mk({ title: "Free Movies Marathon", subtitle: "Watch free", platformId: "tubi", genre: "Free Streaming", metaLeft: "Free", metaRight: "No sign-up" }),
    mk({ title: "Kids: Bedtime Stories", subtitle: "Calm picks", platformId: "pbskids", genre: "Kids", metaLeft: "Kids", metaRight: "Safe" }),
    mk({ title: "Live Gaming: Esports Finals", subtitle: "Championship", platformId: "youtube", genre: "Gaming", badge: "LIVE", metaLeft: "Gaming", metaRight: "Live" }),
    mk({ title: "LGBT: Weekend Premiere", subtitle: "New episode drop", platformId: "outtv", genre: "LGBT", metaLeft: "LGBT", metaRight: "New" }),
  ];

  const blackMediaCards: Card[] = [
    mk({ title: "Black Star Network: Live", subtitle: "News + culture", platformId: "blackstarnetwork", genre: "Black culture & diaspora", badge: "LIVE", metaLeft: "Live", metaRight: "Now" }),
    mk({ title: "MANSA Originals", subtitle: "Curated stories", platformId: "mansa", genre: "Black culture & diaspora", metaLeft: "Originals", metaRight: "New" }),
    mk({ title: "ALLBLK: Drama Picks", subtitle: "Binge-ready", platformId: "allblk", genre: "Black culture & diaspora", metaLeft: "Drama", metaRight: "HD" }),
    mk({ title: "HBCU Game of the Week", subtitle: "Showcase", platformId: "hbcugosports", league: "HBCUGOSPORTS", genre: "Premium Sports Streaming", badge: "UPCOMING", metaLeft: "HBCU", metaRight: "Soon", startTime: "Sat 7:30 PM" }),
  ];

  return { forYou, liveNow, continueWatching, trending, blackMediaCards };
}

/* =========================
   MAIN APP COMPONENT
   ========================= */

export default function AmpereApp() {
  const { isMobile, density } = useViewport();

  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [showAbout, setShowAbout] = useState(false);
  const [activeGenre, setActiveGenre] = useState<GenreKey>("All");
  const [activePlatform, setActivePlatform] = useState<PlatformId>("all");
  const [activeLeague, setActiveLeague] = useState<string>("ALL");

  const [profile, setProfile] = useState<ProfileState>(() => loadProfile());

  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [openSeeAll, setOpenSeeAll] = useState<null | "Genre" | "platforms" | "for-you" | "live-now" | "continue" | "trending" | "black-media">(null);

  const [openVoice, setOpenVoice] = useState(false);
  const [openRemote, setOpenRemote] = useState(false);
  const [openFavorites, setOpenFavorites] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openConnect, setOpenConnect] = useState(false);
  const [openSetup, setOpenSetup] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [openProfileSettings, setOpenProfileSettings] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);

  const [powerState, setPowerState] = useState<"off" | "booting" | "on">("off");

  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPlatforms, setDraftPlatforms] = useState<PlatformId[]>(profile.favoritePlatformIds);
  const [draftLeagues, setDraftLeagues] = useState<string[]>(profile.favoriteLeagues);
  const [draftTeams, setDraftTeams] = useState<string[]>(profile.favoriteTeams);

  const [wizShownByLeague, setWizShownByLeague] = useState<Record<string, number>>({});
  const [wizTeamSearch, setWizTeamSearch] = useState("");

  const [GenreShown, setGenreShown] = useState<number>(isMobile ? 6 : 10);
  const [platformsShown, setPlatformsShown] = useState<number>(isMobile ? 8 : 12);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const demo = useMemo(() => buildDemoCatalog(), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "AMPÈRE";
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  // Sync draft with profile ONLY when wizard is closed (so in-progress wizard isn't overwritten)
  useEffect(() => {
    if (openSetup) return;
    setDraftName(profile.name);
    setDraftPlatforms(profile.favoritePlatformIds);
    setDraftLeagues(profile.favoriteLeagues);
    setDraftTeams(profile.favoriteTeams);
  }, [profile, openSetup]);

  useEffect(() => {
    setGenreShown(isMobile ? 6 : 10);
    setPlatformsShown(isMobile ? 8 : 12);
  }, [isMobile]);

  useEffect(() => {
    const visible = platformsForGenre(activeGenre);
    const ok = activePlatform === "all" || visible.includes(activePlatform);
    if (!ok) setActivePlatform("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre]);

  // Wizard: initialize "shown teams per league" when step 4 entered
  useEffect(() => {
    if (setupStep !== 4) return;
    const initial = isMobile ? 12 : 20;
    const next: Record<string, number> = {};
    for (const l of draftLeagues) {
      const canon = canonicalLeagueForTeams(l) ?? l;
      next[canon] = next[canon] ?? initial;
    }
    setWizShownByLeague(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupStep, draftLeagues.join("|"), isMobile]);

  // Wizard persistence: load on open
  useEffect(() => {
    if (!openSetup) return;
    const saved = loadWizardDraft();
    if (saved) {
      setSetupStep(saved.step);
      setDraftName(saved.name || profile.name);
      setDraftPlatforms(saved.platforms.length ? saved.platforms : profile.favoritePlatformIds);
      setDraftLeagues(saved.leagues.length ? saved.leagues : profile.favoriteLeagues);
      setDraftTeams(saved.teams.length ? saved.teams : profile.favoriteTeams);
    } else {
      setSetupStep(1);
      setDraftName(profile.name);
      setDraftPlatforms(profile.favoritePlatformIds);
      setDraftLeagues(profile.favoriteLeagues);
      setDraftTeams(profile.favoriteTeams);
    }
    setWizTeamSearch("");
  }, [openSetup]); // intentionally not including profile as dependency

  // Wizard persistence: save while open
  useEffect(() => {
    if (!openSetup) return;
    saveWizardDraft({
      step: setupStep,
      name: draftName,
      platforms: uniq(draftPlatforms.filter(Boolean)),
      leagues: uniq(draftLeagues.filter(Boolean)),
      teams: uniq(draftTeams.filter(Boolean)),
      updatedAt: safeNowISO(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSetup, setupStep, draftName, draftPlatforms.join("|"), draftLeagues.join("|"), draftTeams.join("|")]);

  const viewing = useMemo(() => (typeof window === "undefined" ? [] : loadViewing()), [openCard]);
  const forYouRanked = useMemo(() => rankForYou(demo.forYou, profile, viewing), [demo.forYou, profile, viewing]);

  const visiblePlatformIds = useMemo(() => platformsForGenre(activeGenre), [activeGenre]);

  const visiblePlatforms = useMemo(() => {
    const ids = visiblePlatformIds
      .filter((id) => id !== "all" && id !== "livetv")
      .map((id) => platformById(id))
      .filter(Boolean) as Platform[];
    return ids;
  }, [visiblePlatformIds]);

  const matchesPlatform = (c: Card) => (activePlatform === "all" ? true : c.platformId === activePlatform);
  const matchesGenre = (c: Card) => (activeGenre === "All" ? true : c.genre ? c.genre === activeGenre : true);
  const matchesLeague = (c: Card) => (activeLeague === "ALL" ? true : normalizeKey(c.league ?? "") === normalizeKey(activeLeague));

  const forYou = useMemo(() => forYouRanked.filter(matchesGenre).filter(matchesPlatform), [forYouRanked, activeGenre, activePlatform]);
  const liveNow = useMemo(() => demo.liveNow.filter(matchesGenre).filter(matchesPlatform).filter(matchesLeague), [demo.liveNow, activeGenre, activePlatform, activeLeague]);
  const continueWatching = useMemo(() => demo.continueWatching.filter(matchesGenre).filter(matchesPlatform), [demo.continueWatching, activeGenre, activePlatform]);
  const trending = useMemo(() => demo.trending.filter(matchesGenre).filter(matchesPlatform), [demo.trending, activeGenre, activePlatform]);
  const blackMediaCards = useMemo(() => demo.blackMediaCards.filter(matchesGenre).filter(matchesPlatform), [demo.blackMediaCards, activeGenre, activePlatform]);

  const favOnlyPlatformSet = useMemo(() => new Set(profile.favoritePlatformIds), [profile.favoritePlatformIds]);
  const forYouFavs = useMemo(() => forYouRanked.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [forYouRanked, favOnlyPlatformSet]);
  const liveFavs = useMemo(() => demo.liveNow.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [demo.liveNow, favOnlyPlatformSet]);
  const continueFavs = useMemo(() => demo.continueWatching.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [demo.continueWatching, favOnlyPlatformSet]);
  const trendingFavs = useMemo(() => demo.trending.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [demo.trending, favOnlyPlatformSet]);

  const allSearchCards = useMemo(
    () => uniqByCardKey([...demo.forYou, ...demo.liveNow, ...demo.continueWatching, ...demo.trending, ...demo.blackMediaCards]),
    [demo]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = allSearchCards.filter(matchesGenre).filter(matchesPlatform);
    if (!q) return base.slice(0, 36);
    const out = base.filter((c) =>
      `${c.title} ${c.subtitle ?? ""} ${c.platformLabel ?? ""} ${c.league ?? ""} ${c.genre ?? ""}`.toLowerCase().includes(q)
    );
    return out.slice(0, 60);
  }, [searchQuery, allSearchCards, activeGenre, activePlatform]);

  const seeAllItems = useMemo(() => {
    if (!openSeeAll) return [];
    if (openSeeAll === "Genre") return [];
    if (openSeeAll === "platforms") return [];
    if (openSeeAll === "for-you") return activeTab === "favs" ? forYouFavs : forYou;
    if (openSeeAll === "live-now") return activeTab === "favs" ? liveFavs : liveNow;
    if (openSeeAll === "continue") return activeTab === "favs" ? continueFavs : continueWatching;
    if (openSeeAll === "black-media") return blackMediaCards;
    if (openSeeAll === "trending") return activeTab === "search" ? searchResults : activeTab === "favs" ? trendingFavs : trending;
    return [];
  }, [openSeeAll, forYou, liveNow, continueWatching, trending, activeTab, blackMediaCards, searchResults, forYouFavs, liveFavs, continueFavs, trendingFavs]);

  const openCardAndLog = (c: Card) => {
    logViewing(c);
    setOpenCard(c);
  };

  const toggleConnected = (pid: PlatformId, on?: boolean) => {
    setProfile((prev) => {
      const nextOn = typeof on === "boolean" ? on : !prev.connectedPlatformIds?.[pid];
      const next: ProfileState = { ...prev, connectedPlatformIds: { ...prev.connectedPlatformIds, [pid]: nextOn } };
      saveProfile(next);
      track("connected_toggle", { platformId: pid, on: nextOn });
      return next;
    });
  };

  const submitSearch = () => {
    const q = searchInput.trim();
    setSearchQuery(q);
    track("search_submit", { q });
  };

  const openProviderForCard = (card: Card) => {
    if (typeof window === "undefined") return;
    const pid = card.platformId ?? platformIdFromLabel(card.platformLabel ?? "") ?? null;
    const url = providerUrlOpen(pid, card.title);
    track("handoff_open", { platformId: pid, title: card.title, url: redactUrl(url) });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const subscribeProvider = (card: Card) => {
    if (typeof window === "undefined") return;
    const pid = card.platformId ?? platformIdFromLabel(card.platformLabel ?? "") ?? null;
    const url = providerUrlSubscribe(pid);
    track("handoff_subscribe", { platformId: pid, url: redactUrl(url) });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openPlatformHandoff = (pid: PlatformId, mode: "open" | "subscribe") => {
    if (typeof window === "undefined") return;
    const url = mode === "open" ? providerUrlOpen(pid, platformById(pid)?.label ?? pid) : providerUrlSubscribe(pid);
    track("connect_handoff", { platformId: pid, mode, url: redactUrl(url) });
    toggleConnected(pid, true);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const headerInputRef = useRef<HTMLInputElement | null>(null);

  const avatarSources = profile.profilePhoto ? [profile.profilePhoto] : [...brandMarkCandidates()];
  const headerBg = profile.headerPhoto
    ? `linear-gradient(135deg, rgba(0,0,0,0.62), rgba(0,0,0,0.84)), url(${profile.headerPhoto}) center/cover no-repeat`
    : "linear-gradient(135deg, #050505 0%, #151515 55%, #070707 100%)";

  const showBack =
    !!openCard ||
    !!openSeeAll ||
    openVoice ||
    openRemote ||
    openFavorites ||
    openNotifications ||
    openConnect ||
    openSetup ||
    openAbout ||
    openProfileSettings ||
    openArchive;

  const onBack = () => {
    if (openCard) return setOpenCard(null);
    if (openSeeAll) return setOpenSeeAll(null);
    if (openVoice) return setOpenVoice(false);
    if (openRemote) return setOpenRemote(false);
    if (openFavorites) return setOpenFavorites(false);
    if (openNotifications) return setOpenNotifications(false);
    if (openConnect) return setOpenConnect(false);
    if (openSetup) return setOpenSetup(false);
    if (openAbout) return setOpenAbout(false);
    if (openProfileSettings) return setOpenProfileSettings(false);
    if (openArchive) return setOpenArchive(false);
  };

  const resetFilters = () => {
    setActiveGenre("All");
    setActivePlatform("all");
    setActiveLeague("ALL");
    track("filters_reset", {});
  };

  const selectedChips: { label: string; onRemove: () => void }[] = [];
  if (activeGenre !== "All") selectedChips.push({ label: `Genre: ${activeGenre}`, onRemove: () => setActiveGenre("All") });
  if (activePlatform !== "all")
    selectedChips.push({ label: `Platform: ${platformById(activePlatform)?.label ?? activePlatform}`, onRemove: () => setActivePlatform("all") });
  if (activeTab === "live" && activeLeague !== "ALL") selectedChips.push({ label: `League: ${activeLeague}`, onRemove: () => setActiveLeague("ALL") });

  const isRailSeeAll = !!openSeeAll && openSeeAll !== "Genre" && openSeeAll !== "platforms";

  useEffect(() => {
    if (powerState !== "booting") return;
    track("power_booting", {});
    const t = setTimeout(() => {
      setPowerState("on");
      track("power_on", {});
    }, 900);
    return () => clearTimeout(t);
  }, [powerState]);

  const powerOff = () => {
    track("power_off", {});
    setOpenCard(null);
    setOpenSeeAll(null);
    setOpenVoice(false);
    setOpenRemote(false);
    setOpenFavorites(false);
    setOpenNotifications(false);
    setOpenConnect(false);
    setOpenSetup(false);
    setOpenAbout(false);
    setOpenProfileSettings(false);
    setOpenArchive(false);
    setPowerState("off");
  };

  const finishWizard = () => {
    const name = draftName.trim() ? draftName.trim() : profile.name;
    const next: ProfileState = normalizeProfile({
      ...profile,
      name,
      favoritePlatformIds: uniq(draftPlatforms),
      favoriteLeagues: uniq(draftLeagues),
      favoriteTeams: uniq(draftTeams),
    });
    setProfile(next);
    saveProfile(next);
    track("wizard_finish", { name, platforms: next.favoritePlatformIds.length, leagues: next.favoriteLeagues.length, teams: next.favoriteTeams.length });
    clearWizardDraft();
    setOpenSetup(false);
    setSetupStep(1);
  };

  const canNextWizard = () => {
    if (setupStep === 1) return !!draftName.trim();
    if (setupStep === 2) return draftPlatforms.length > 0;
    if (setupStep === 3) return true; // leagues optional
    if (setupStep === 4) return true; // teams optional
    return true;
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, var(--bg0) 0%, #161616 55%, #070707 100%)",
        color: "white",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      <style>{AMPERE_GLOBAL_CSS}</style>

      {/* Power overlay */}
      {powerState !== "on" ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background:
              "radial-gradient(900px 460px at 30% 0%, rgba(58,167,255,0.20), rgba(0,0,0,0.0) 60%), linear-gradient(135deg, #050505 0%, #151515 55%, #070707 100%)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            style={{
              width: "min(740px, 100%)",
              borderRadius: "var(--r-xl)",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.45)",
              boxShadow: "var(--shadow-lg)",
              padding: 18,
              display: "grid",
              gap: 14,
              textAlign: "center",
            }}
          >
            <div style={{ display: "grid", placeItems: "center" }}>
              <div style={{ width: "min(520px, 92%)", height: isMobile ? 44 : 54 }}>
                <SmartImg sources={brandWideCandidates()} size={900} rounded={0} border={false} fit="contain" fill fallbackText="AMPÈRE" />
              </div>
            </div>

            {powerState === "off" ? (
              <>
                <div style={{ fontWeight: 950, fontSize: 16, opacity: 0.92 }}>Ready when you are.</div>
                <button
                  type="button"
                  className="ampere-focus"
                  onClick={() => setPowerState("booting")}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 18,
                    border: "1px solid rgba(58,167,255,0.30)",
                    background: "rgba(58,167,255,0.14)",
                    color: "white",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Power On
                </button>
                <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 13 }}>Demo boot flow (Power On → splash → app).</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 950, fontSize: 16, opacity: 0.92 }}>Powering on…</div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "72%",
                      borderRadius: 999,
                      background: "rgba(58,167,255,0.55)",
                      boxShadow: "0 0 0 1px rgba(58,167,255,0.12) inset",
                    }}
                  />
                </div>
                <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 13 }}>Loading your rails, favorites, and connected platforms…</div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Hidden upload inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const dataUrl = await fileToResizedDataUrl(f, 220);
            setProfile((prev) => {
              const next = { ...prev, profilePhoto: dataUrl };
              saveProfile(next);
              track("avatar_set", {});
              return next;
            });
          } catch {
            track("avatar_set_failed", {});
          }
        }}
      />
      <input
        ref={headerInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const dataUrl = await fileToResizedDataUrl(f, 1400);
            setProfile((prev) => {
              const next = { ...prev, headerPhoto: dataUrl };
              saveProfile(next);
              track("header_image_set", {});
              return next;
            });
          } catch {
            track("header_image_set_failed", {});
          }
        }}
      />

      {/* HEADER */}
      <header
        style={{
          padding: density.pad,
          background: headerBg,
          borderBottom: "1px solid var(--stroke)",
          paddingTop: "max(env(safe-area-inset-top), 10px)",
        }}
      >
        <div
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 55%), rgba(0,0,0,0.36)",
            backdropFilter: "blur(10px)",
            padding: density.pad,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="ampere-focus"
                aria-label="Back"
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            ) : null}

            <div
              style={{
                width: isMobile ? 44 : 52,
                height: isMobile ? 44 : 52,
                borderRadius: 18,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <SmartImg sources={brandMarkCandidates()} size={isMobile ? 44 : 52} rounded={18} border={false} fit="contain" fallbackText="A" />
            </div>

            <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
              <div style={{ width: isMobile ? 170 : 220, height: isMobile ? 20 : 24 }}>
                <SmartImg sources={brandWideCandidates()} size={900} rounded={0} border={false} fit="contain" fill fallbackText="AMPÈRE" />
              </div>

              <div
                style={{
                  opacity: 0.72,
                  fontWeight: 900,
                  fontSize: density.small,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Profile: <span style={{ color: "white", opacity: 0.95 }}>{profile.name}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <PillButton label="Voice" iconNode={<IconMic />} onClick={() => setOpenVoice(true)} ariaLabel="Voice" />
            <PillButton label="Remote" iconNode={<IconRemote />} onClick={() => setOpenRemote(true)} ariaLabel="Remote" />

            <Dropdown label="Settings" iconLeft={<IconGear />}>
              <MenuItem title="Favorites" subtitle="Edit platforms / leagues / teams" onClick={() => setOpenFavorites(true)} right="›" />
              <MenuItem title="Notifications" subtitle="Alerts when favorite teams play" onClick={() => setOpenNotifications(true)} right="›" />
              <MenuItem title="Connect Platforms" subtitle="Open / Subscribe → return (demo)" onClick={() => setOpenConnect(true)} right="›" />
              <MenuItem title="Change Header Image" subtitle="Upload a header background" onClick={() => headerInputRef.current?.click()} right="⬆" />
              <MenuItem title="Power Off" subtitle="Return to standby screen" onClick={powerOff} right="⏻" />
            </Dropdown>

            <Dropdown
              label="Profile"
              iconLeft={
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <SmartImg sources={avatarSources} size={22} rounded={9} border={true} fit="cover" fallbackText={profile.name.slice(0, 1).toUpperCase()} />
                </span>
              }
            >
              <MenuItem title="Profile Settings" subtitle="Name, avatar, header image" onClick={() => setOpenProfileSettings(true)} right="›" />
              <MenuItem title="Archive" subtitle="History + attribution log" onClick={() => setOpenArchive(true)} right="›" />
              <MenuItem title="Set-Up Wizard" subtitle="Resume onboarding" onClick={() => setOpenSetup(true)} right="›" />
              <MenuItem
                title="About AMPÈRE"
                subtitle="App info & backstory"
                onClick={() => {
                  setShowSettings(false);
                  setShowAbout(true);
                }}
                right="M"
              />
            </Dropdown>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: density.pad,
          display: "grid",
          gap: density.gap,
        }}
      >
        {/* FILTERS */}
        <div
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: density.h2, fontWeight: 950 }}>Filters</div>
            <button
              type="button"
              onClick={resetFilters}
              className="ampere-focus"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.10)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
              aria-label="Reset filters"
              title="Reset"
            >
              <IconReset /> Reset
            </button>
          </div>

          {selectedChips.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {selectedChips.map((c) => (
                <Chip key={c.label} label={c.label} onRemove={c.onRemove} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>
              No active filters. <span style={{ opacity: 0.85 }}>Use Genre + Platforms (and League on Live) to narrow.</span>
            </div>
          )}

          <FilterAccordion title="Genre" isMobile={isMobile} defaultOpen={!isMobile} right={<span>{activeGenre === "All" ? "Any" : activeGenre}</span>}>
            <Section title="" rightText="See all" onRightClick={() => setOpenSeeAll("Genre")}>
              {(() => {
                const allGenres = GENRES.map((g) => g.key);
                const total = allGenres.length;
                const shown = clamp(GenreShown, 1, total);
                const slice = allGenres.slice(0, shown);
                const more = shown < total;

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                    {slice.map((k) => (
                      <PillButton
                        key={k}
                        label={k}
                        iconSources={Genre_ICON_CANDIDATES[k] ?? []}
                        active={activeGenre === k}
                        onClick={() => setActiveGenre(k)}
                        fullWidth
                      />
                    ))}
                    {more ? (
                      <PillButton
                        label={`Load More (${slice.length}/${total})`}
                        iconNode={<IconPlus />}
                        subtle
                        onClick={() => setGenreShown((n) => Math.min(total, n + (isMobile ? 6 : 10)))}
                        fullWidth
                        ariaLabel="Load more Genre categories"
                      />
                    ) : null}
                  </div>
                );
              })()}
            </Section>
          </FilterAccordion>

          <FilterAccordion
            title="Platforms"
            isMobile={isMobile}
            defaultOpen={!isMobile}
            right={<span>{activePlatform === "all" ? "Any" : platformById(activePlatform)?.label ?? activePlatform}</span>}
          >
            <Section title="" rightText="See all" onRightClick={() => setOpenSeeAll("platforms")}>
              {(() => {
                const total = visiblePlatforms.length;
                const shown = clamp(platformsShown, 1, Math.max(1, total));
                const slice = visiblePlatforms.slice(0, shown);
                const more = shown < total;

                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {slice.map((p) => (
                      <PillButton
                        key={`${activeGenre}_${p.id}`}
                        label={p.label}
                        iconSources={platformIconCandidates(p.id)}
                        active={activePlatform === p.id}
                        onClick={() => setActivePlatform(p.id)}
                        fullWidth
                        multiline
                      />
                    ))}
                    {more ? (
                      <PillButton
                        label={`Load More (${slice.length}/${total})`}
                        iconNode={<IconPlus />}
                        subtle
                        onClick={() => setPlatformsShown((n) => Math.min(total, n + (isMobile ? 8 : 12)))}
                        fullWidth
                        multiline
                        ariaLabel="Load more platforms"
                      />
                    ) : null}
                  </div>
                );
              })()}
            </Section>
          </FilterAccordion>

          {activeTab === "live" ? (
            <FilterAccordion title="League" isMobile={isMobile} defaultOpen={!isMobile} right={<span>{activeLeague === "ALL" ? "Any" : activeLeague}</span>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                {LEAGUES.map((l) => (
                  <PillButton key={l} label={l} active={normalizeKey(activeLeague) === normalizeKey(l)} onClick={() => setActiveLeague(l)} fullWidth />
                ))}
              </div>
            </FilterAccordion>
          ) : null}
        </div>

        {/* PAGE HEADER + SEARCH BAR */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: density.h1, fontWeight: 950 }}>
            {activeTab === "home" ? "Home" : activeTab === "live" ? "Live" : activeTab === "favs" ? "Favs" : "Search"}
          </div>

          {activeTab === "search" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", width: "min(900px, 100%)" }}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                placeholder="Search titles, platforms, leagues…"
                className="ampere-focus"
                style={{
                  flex: "1 1 280px",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--stroke2)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  outline: "none",
                  fontWeight: 850,
                  minWidth: 240,
                }}
              />
              <button
                type="button"
                onClick={submitSearch}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(58,167,255,0.22)",
                  background: "rgba(58,167,255,0.12)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>

              <div style={{ width: "100%", opacity: 0.75, fontWeight: 900, fontSize: 13 }}>
                {searchQuery ? (
                  <>
                    Results: <span style={{ color: "white" }}>{searchResults.length}</span>
                    {searchResults.length === 0 ? <span style={{ marginLeft: 8 }}>No matches. Try another query.</span> : null}
                  </>
                ) : (
                  <>Tip: press Enter to submit.</>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* RAILS */}
        {activeTab === "home" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title="For You" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYou.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Live Now" rightText="See all" onRightClick={() => setOpenSeeAll("live-now")}>
              <CardGrid cards={liveNow.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueWatching.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}

        {activeTab === "live" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title="Live Now" rightText="See all" onRightClick={() => setOpenSeeAll("live-now")}>
              <CardGrid cards={liveNow} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="For You (Sports-weighted)" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYou.filter((c) => !!c.league).slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueWatching.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid
                cards={trending.filter((c) => c.genre === "Premium Sports Streaming" || c.genre === "LiveTV").slice(0, 18)}
                cardMinW={density.cardMinW}
                heroH={density.heroH}
                onOpen={openCardAndLog}
                skeleton={loading}
              />
            </Section>
          </div>
        ) : null}

        {activeTab === "favs" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title="Favorite Platforms">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {profile.favoritePlatformIds.map((pid) => (
                  <PillButton
                    key={pid}
                    label={platformById(pid)?.label ?? pid}
                    iconSources={platformIconCandidates(pid)}
                    active={activePlatform === pid}
                    onClick={() => setActivePlatform(pid)}
                    fullWidth
                    multiline
                  />
                ))}
                {!profile.favoritePlatformIds.length ? <div style={{ opacity: 0.75, fontWeight: 950 }}>No favorites yet.</div> : null}
              </div>
            </Section>

            <Section title="For You" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYouFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Live Now" rightText="See all" onRightClick={() => setOpenSeeAll("live-now")}>
              <CardGrid cards={liveFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trendingFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Black Media Preview" rightText="See all" onRightClick={() => setOpenSeeAll("black-media")}>
              <CardGrid cards={blackMediaCards} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}

        {activeTab === "search" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title={searchQuery ? `Results for “${searchQuery}”` : "Search Preview"} rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={searchResults} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          padding: density.pad,
          borderTop: "1px solid var(--stroke)",
          background: "rgba(0,0,0,0.60)",
          backdropFilter: "blur(10px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 10px)",
        }}
      >
        <div
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <PillButton label="HOME" iconNode={<IconHome />} active={activeTab === "home"} onClick={() => setActiveTab("home")} fullWidth ariaLabel="Home tab" />
          <PillButton label="LIVE" iconNode={<IconLive />} active={activeTab === "live"} onClick={() => setActiveTab("live")} fullWidth ariaLabel="Live tab" />
          <PillButton label="FAVS" iconNode={<IconHeart />} active={activeTab === "favs"} onClick={() => setActiveTab("favs")} fullWidth ariaLabel="Favs tab" />
          <PillButton label="SEARCH" iconNode={<IconSearch />} active={activeTab === "search"} onClick={() => setActiveTab("search")} fullWidth ariaLabel="Search tab" />
        </div>
      </footer>

      {/* =========================
         MODALS
         ========================= */}

      <Modal
        open={isRailSeeAll}
        title={
          openSeeAll === "for-you"
            ? "See All — For You"
            : openSeeAll === "live-now"
            ? "See All — Live Now"
            : openSeeAll === "continue"
            ? "See All — Continue"
            : openSeeAll === "black-media"
            ? "See All — Black Media"
            : "See All — Trending"
        }
        onClose={() => setOpenSeeAll(null)}
      >
        <PagedCardGrid cards={seeAllItems} cardMinW={density.cardMinW} heroH={Math.max(100, density.heroH + 12)} onOpen={openCardAndLog} />
      </Modal>

      {/* Genre modal */}
      <Modal open={openSeeAll === "Genre"} title="See All — Genre" onClose={() => setOpenSeeAll(null)} maxWidth={920}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950, opacity: 0.92 }}>
              Current: <span style={{ color: "white" }}>{activeGenre === "All" ? "Any" : activeGenre}</span>
            </div>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setActiveGenre("All");
                setOpenSeeAll(null);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.10)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Clear (Any)
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
            {GENRES.map((g) => (
              <PillButton
                key={g.key}
                label={g.key}
                iconSources={Genre_ICON_CANDIDATES[g.key] ?? []}
                active={activeGenre === g.key}
                onClick={() => {
                  setActiveGenre(g.key);
                  setOpenSeeAll(null);
                }}
                fullWidth
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Platforms modal */}
      <Modal
        open={openSeeAll === "platforms"}
        title={`See All — Platforms (${activeGenre === "All" ? "All" : activeGenre})`}
        onClose={() => setOpenSeeAll(null)}
        maxWidth={980}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950, opacity: 0.92 }}>
              Current:{" "}
              <span style={{ color: "white" }}>
                {activePlatform === "all" ? "Any" : platformById(activePlatform)?.label ?? activePlatform}
              </span>
            </div>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setActivePlatform("all");
                setOpenSeeAll(null);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.10)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Clear (Any)
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {platformsForGenre(activeGenre)
              .filter((id) => id !== "all" && id !== "livetv")
              .map((id) => platformById(id))
              .filter(Boolean)
              .map((p) => (
                <PillButton
                  key={`seeall_${activeGenre}_${p!.id}`}
                  label={p!.label}
                  iconSources={platformIconCandidates(p!.id)}
                  active={activePlatform === p!.id}
                  onClick={() => {
                    setActivePlatform(p!.id);
                    setOpenSeeAll(null);
                  }}
                  fullWidth
                  multiline
                />
              ))}
          </div>
        </div>
      </Modal>

      {/* Card Details */}
      <Modal open={!!openCard} title={openCard ? openCard.title : "Details"} onClose={() => setOpenCard(null)} maxWidth={980}>
        {openCard ? (
          (() => {
            const pid = openCard.platformId ?? platformIdFromLabel(openCard.platformLabel ?? "") ?? null;
            const platform = pid ? platformById(pid) : null;
            const league = openCard.league ?? "";
            const isFavPlatform = pid ? profile.favoritePlatformIds.includes(pid) : false;
            const isConnected = pid ? !!profile.connectedPlatformIds?.[pid] : false;

            const watermark = pid ? [...platformIconCandidates(pid), ...brandWideCandidates()] : [...brandWideCandidates(), ...brandMarkCandidates()];

            return (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid var(--stroke)",
                    background: "radial-gradient(900px 260px at 30% 0%, rgba(58,167,255,0.18), rgba(0,0,0,0) 60%), rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ position: "relative", height: isMobile ? 160 : 220 }}>
                    <div style={{ position: "absolute", inset: 0, opacity: 0.24 }}>
                      <SmartImg sources={watermark} size={1200} rounded={0} border={false} fit="contain" fill fallbackText="AMPÈRE" />
                    </div>

                    <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {openCard.badge ? (
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.18)",
                            background:
                              openCard.badge === "LIVE"
                                ? "rgba(255,72,72,0.22)"
                                : openCard.badge === "UPCOMING"
                                ? "rgba(58,167,255,0.20)"
                                : "rgba(255,255,255,0.12)",
                            color: "white",
                            fontWeight: 950,
                            fontSize: 12,
                            letterSpacing: 0.6,
                          }}
                        >
                          {openCard.badge}
                        </span>
                      ) : null}

                      {openCard.genre ? (
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.40)",
                            color: "white",
                            fontWeight: 950,
                            fontSize: 12,
                          }}
                        >
                          {openCard.genre}
                        </span>
                      ) : null}
                    </div>

                    <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 10, alignItems: "center" }}>
                      {league ? <SmartImg sources={leagueLogoCandidates(league)} size={32} rounded={12} fit="contain" fallbackText={league.slice(0, 1)} /> : null}
                      {pid ? <SmartImg sources={platformIconCandidates(pid)} size={32} rounded={12} fit="contain" fallbackText={(platform?.label ?? "P")[0]} /> : null}
                      <div style={{ fontWeight: 950, opacity: 0.92 }}>
                        {platform?.label ?? openCard.platformLabel ?? (pid ?? "")}
                        {pid ? (
                          <span style={{ marginLeft: 10, opacity: 0.75, fontWeight: 900, fontSize: 12 }}>
                            {isConnected ? "Connected" : "Not connected (demo)"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 14, display: "grid", gap: 10 }}>
                    {openCard.subtitle ? <div style={{ opacity: 0.82, fontWeight: 900 }}>{openCard.subtitle}</div> : null}

                    {openCard.metaLeft || openCard.metaRight || openCard.startTime || openCard.timeRemaining ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.78, fontWeight: 900, fontSize: 13 }}>
                        {openCard.metaLeft ? <span>{openCard.metaLeft}</span> : null}
                        {openCard.metaRight ? <span>• {openCard.metaRight}</span> : null}
                        {openCard.startTime ? <span>• Starts: {openCard.startTime}</span> : null}
                        {openCard.timeRemaining ? <span>• {openCard.timeRemaining}</span> : null}
                      </div>
                    ) : null}

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <button
                        type="button"
                        className="ampere-focus"
                        onClick={() => openProviderForCard(openCard)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "1px solid rgba(58,167,255,0.22)",
                          background: "rgba(58,167,255,0.12)",
                          color: "white",
                          fontWeight: 950,
                          cursor: "pointer",
                        }}
                      >
                        Open on {platform?.label ?? "Provider"}
                      </button>

                      <button
                        type="button"
                        className="ampere-focus"
                        onClick={() => subscribeProvider(openCard)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          color: "white",
                          fontWeight: 950,
                          cursor: "pointer",
                        }}
                      >
                        Subscribe / Plans
                      </button>

                      {pid ? (
                        <button
                          type="button"
                          className="ampere-focus"
                          onClick={() => {
                            setProfile((prev) => {
                              const exists = prev.favoritePlatformIds.includes(pid);
                              const nextFavs = exists ? prev.favoritePlatformIds.filter((x) => x !== pid) : (uniq([...prev.favoritePlatformIds, pid]) as PlatformId[]);
                              const next: ProfileState = { ...prev, favoritePlatformIds: nextFavs };
                              saveProfile(next);
                              track("favorite_platform_toggle", { platformId: pid, on: !exists });
                              return next;
                            });
                          }}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: "1px solid rgba(58,167,255,0.22)",
                            background: isFavPlatform ? "rgba(58,167,255,0.14)" : "rgba(0,0,0,0.28)",
                            color: "white",
                            fontWeight: 950,
                            cursor: "pointer",
                            gridColumn: isMobile ? "auto" : "1 / -1",
                          }}
                        >
                          {isFavPlatform ? "Remove from Favorite Platforms" : "Add to Favorite Platforms"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </Modal>

      <Modal open={openVoice} title="Voice" onClose={() => setOpenVoice(false)} maxWidth={820}>
        <VoiceCenter
          onCommand={(cmd) => {
            track("voice_command", { cmd });
            const c = cmd.trim().toLowerCase();
            if (c.includes("search")) {
              setActiveTab("search");
              const q = cmd.replace(/search/i, "").trim();
              setSearchInput(q);
              setSearchQuery(q);
            } else if (c.includes("live")) {
              setActiveTab("live");
            } else if (c.includes("home")) {
              setActiveTab("home");
            } else if (c.includes("favs") || c.includes("favorites")) {
              setActiveTab("favs");
            }
          }}
        />
      </Modal>

      <Modal open={openRemote} title="Remote" onClose={() => setOpenRemote(false)} maxWidth={820}>
        <RemotePad
          onAction={(a) => {
            track("remote_action", { a });
            if (a === "HOME") setActiveTab("home");
            if (a === "LIVE") setActiveTab("live");
            if (a === "FAVS") setActiveTab("favs");
            if (a === "SEARCH") setActiveTab("search");
            if (a === "BACK") onBack();
          }}
        />
      </Modal>

      <Modal open={openFavorites} title="Favorites" onClose={() => setOpenFavorites(false)} maxWidth={980}>
        <FavoritesEditor
          isMobile={isMobile}
          profile={profile}
          onSave={(next) => {
            const normalized = normalizeProfile(next);
            setProfile(normalized);
            saveProfile(normalized);
            track("favorites_save", {
              platforms: normalized.favoritePlatformIds.length,
              leagues: normalized.favoriteLeagues.length,
              teams: normalized.favoriteTeams.length,
            });
            setOpenFavorites(false);
          }}
        />
      </Modal>

      <Modal open={openNotifications} title="Notifications" onClose={() => setOpenNotifications(false)} maxWidth={900}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Demo toggle (stored locally). In a real product this would schedule push notifications (mobile) or OS-level TV notifications.
          </div>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => {
              setProfile((prev) => {
                const next: ProfileState = { ...prev, notificationsEnabled: !prev.notificationsEnabled };
                saveProfile(next);
                track("notifications_toggle", { on: next.notificationsEnabled });
                return next;
              });
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: profile.notificationsEnabled ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            {profile.notificationsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </Modal>

      <Modal open={openConnect} title="Connect Platforms" onClose={() => setOpenConnect(false)} maxWidth={980}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Click <b>Open</b> or <b>Subscribe</b> to hand off to the provider. When you return, we mark the platform connected (demo).
            <div style={{ marginTop: 10, opacity: 0.85 }}>
              <b>TV Connect plan (real architecture):</b> Web UI alone can’t reliably discover/control TVs. Real solutions use a native companion app or device runtime (mDNS/SSDP discovery, CEC/eARC control, vendor APIs, or a local hub).
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 10 }}>
            {ALL_PLATFORM_IDS.map((pid) => {
              const p = platformById(pid);
              const on = !!profile.connectedPlatformIds?.[pid];
              return (
                <div
                  key={`conn_${pid}`}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    padding: 12,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <SmartImg sources={platformIconCandidates(pid)} size={34} rounded={12} fit="contain" fallbackText={(p?.label ?? pid)[0]} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, opacity: 0.94, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p?.label ?? pid}</div>
                      <div style={{ fontWeight: 900, opacity: on ? 0.9 : 0.6, fontSize: 12 }}>{on ? "Connected" : "Not connected"}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      type="button"
                      className="ampere-focus"
                      onClick={() => openPlatformHandoff(pid, "open")}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(58,167,255,0.22)",
                        background: "rgba(58,167,255,0.12)",
                        color: "white",
                        fontWeight: 950,
                        cursor: "pointer",
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="ampere-focus"
                      onClick={() => openPlatformHandoff(pid, "subscribe")}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        fontWeight: 950,
                        cursor: "pointer",
                      }}
                    >
                      Subscribe
                    </button>
                  </div>

                  <button
                    type="button"
                    className="ampere-focus"
                    onClick={() => toggleConnected(pid)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: on ? "rgba(58,167,255,0.10)" : "rgba(0,0,0,0.22)",
                      color: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    {on ? "Mark Disconnected" : "Mark Connected"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal open={openAbout} title="About AMPÈRE" onClose={() => setOpenAbout(false)} maxWidth={980}>
        <AboutContent />
      </Modal>

      <Modal open={openArchive} title="Archive" onClose={() => setOpenArchive(false)} maxWidth={980}>
        <ArchiveContent />
      </Modal>

      <Modal open={openProfileSettings} title="Profile Settings" onClose={() => setOpenProfileSettings(false)} maxWidth={820}>
        <ProfileSettingsContent
          profile={profile}
          onSave={(next) => {
            const normalized = normalizeProfile(next);
            setProfile(normalized);
            saveProfile(normalized);
            track("profile_save", {});
            setOpenProfileSettings(false);
          }}
          onPickAvatar={() => avatarInputRef.current?.click()}
          onPickHeader={() => headerInputRef.current?.click()}
        />
      </Modal>

      <Modal open={openSetup} title={`Set-Up Wizard — Step ${setupStep} of 5`} onClose={() => setOpenSetup(false)} maxWidth={980}>
        <SetupWizardContent
          isMobile={isMobile}
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          draftName={draftName}
          setDraftName={setDraftName}
          draftPlatforms={draftPlatforms}
          setDraftPlatforms={setDraftPlatforms}
          draftLeagues={draftLeagues}
          setDraftLeagues={setDraftLeagues}
          draftTeams={draftTeams}
          setDraftTeams={setDraftTeams}
          wizShownByLeague={wizShownByLeague}
          setWizShownByLeague={setWizShownByLeague}
          wizTeamSearch={wizTeamSearch}
          setWizTeamSearch={setWizTeamSearch}
          canNext={canNextWizard()}
          onFinish={finishWizard}
          onStartOver={() => {
            clearWizardDraft();
            setSetupStep(1);
            setDraftName(profile.name);
            setDraftPlatforms(profile.favoritePlatformIds);
            setDraftLeagues(profile.favoriteLeagues);
            setDraftTeams(profile.favoriteTeams);
            setWizTeamSearch("");
            track("wizard_start_over", {});
          }}
        />

        {/* About Modal */}
        {showAbout && (
          <AboutSection onClose={() => setShowAbout(false)} />
        )}
      </Modal>
    </div>
  );
}

/* =========================
   Helper components
   ========================= */

function ProfileSettingsContent({
  profile,
  onSave,
  onPickAvatar,
  onPickHeader,
}: {
  profile: ProfileState;
  onSave: (next: ProfileState) => void;
  onPickAvatar: () => void;
  onPickHeader: () => void;
}) {
  const [name, setName] = useState(profile.name);

  useEffect(() => setName(profile.name), [profile.name]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.78, fontWeight: 900 }}>Update your profile details (stored locally in this demo).</div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="ampere-focus"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--stroke2)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
            fontWeight: 900,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={onPickAvatar}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Upload Avatar
        </button>

        <button
          type="button"
          className="ampere-focus"
          onClick={onPickHeader}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Upload Header
        </button>

        <button
          type="button"
          className="ampere-focus"
          onClick={() => onSave({ ...profile, profilePhoto: null })}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.28)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear Avatar
        </button>

        <button
          type="button"
          className="ampere-focus"
          onClick={() => onSave({ ...profile, headerPhoto: null })}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.28)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear Header
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => onSave({ ...profile, name: name.trim() ? name.trim() : profile.name })}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.12)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ArchiveContent() {
  const [viewing, setViewing] = useState<ViewingEvent[]>([]);
  const [attrib, setAttrib] = useState<AttributionEvent[]>([]);

  useEffect(() => {
    setViewing(loadViewing().slice().reverse());
    setAttrib(loadAttribution().slice().reverse());
  }, []);

  const exportJson = (obj: any, filename: string) => {
    if (typeof window === "undefined") return;
    try {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.78, fontWeight: 900 }}>Local demo archive: viewing history + attribution/telemetry events.</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => exportJson({ viewing }, "ampere_viewing.json")}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.10)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Export Viewing
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => exportJson({ attribution: attrib }, "ampere_attribution.json")}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.10)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Export Attribution
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => {
            saveViewing([]);
            saveAttribution([]);
            setViewing([]);
            setAttrib([]);
            track("archive_cleared", {});
          }}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear Archive
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 950 }}>Viewing History</div>
          {!viewing.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No viewing events yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {viewing.slice(0, 30).map((v, i) => (
                <div key={`${v.id}_${i}`} style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)" }}>
                  <div style={{ fontWeight: 950, opacity: 0.94 }}>{v.title}</div>
                  <div style={{ opacity: 0.70, fontWeight: 900, fontSize: 12 }}>
                    {v.platformId ? platformById(v.platformId)?.label ?? v.platformId : "—"} {v.league ? `• ${v.league}` : ""} • {v.at}
                  </div>
                </div>
              ))}
              {viewing.length > 30 ? <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>Showing 30 of {viewing.length}.</div> : null}
            </div>
          )}
        </div>

        <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 950 }}>Attribution / Telemetry</div>
          {!attrib.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No attribution events yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {attrib.slice(0, 30).map((a, i) => (
                <div key={`${a.at}_${i}`} style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)" }}>
                  <div style={{ fontWeight: 950, opacity: 0.94 }}>{a.event}</div>
                  <div style={{ opacity: 0.70, fontWeight: 900, fontSize: 12 }}>
                    {a.at} • session {a.sessionId}
                  </div>
                  <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", opacity: 0.82, fontWeight: 900, fontSize: 12 }}>
                    {JSON.stringify(a.props, null, 2)}
                  </pre>
                </div>
              ))}
              {attrib.length > 30 ? <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>Showing 30 of {attrib.length}.</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AboutContent() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 950, fontSize: 18 }}>Control, Reimagined.</div>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        AMPÈRE is a concept demo for a unified TV experience: Genre across services, see what’s live, and launch content fast — from remote, voice, or personalized rails.
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Priority gap analysis</div>

        <div style={{ fontWeight: 950, opacity: 0.92 }}>P0 — Must fix (it’s broken)</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.86, fontWeight: 900, lineHeight: 1.5 }}>
          <li><b>Asset path resolution:</b> all public asset candidates now go through <code>assetPath()</code> for basePath/assetPrefix-safe deploys.</li>
          <li><b>Candidate coverage:</b> platform icon resolution now tries common filename variants (+, -plus, _plus, hyphen/underscore, etc.).</li>
          <li><b>No broken-image flashes:</b> SmartImg preloads candidates and only renders &lt;img&gt; after success.</li>
          <li><b>Profile dropdown:</b> closes on selection so modals don’t open behind it.</li>
          <li><b>Setup Wizard:</b> restored full Step 1–5 UI and persistence.</li>
        </ul>

        <div style={{ fontWeight: 950, opacity: 0.92, marginTop: 6 }}>P1 — Next (feature completeness)</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.86, fontWeight: 900, lineHeight: 1.5 }}>
          <li><b>Favorites editor:</b> now a functional modal (platforms/leagues/teams).</li>
          <li><b>Voice/Remote:</b> upgraded from placeholder to interactive demo (still not a real mic/TV integration).</li>
          <li><b>TV Connect:</b> requires native runtime or local hub for discovery/control (web UI alone can’t do it reliably).</li>
        </ul>
      </div>

      <div style={{ opacity: 0.78, fontWeight: 900 }}>
        Tip: set <code>NEXT_PUBLIC_ASSET_PREFIX</code> to match your deployment prefix if you’re serving under a basePath/assetPrefix.
      </div>
    </div>
  );
}

function VoiceCenter({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [cmd, setCmd] = useState("");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Demo voice UI: type a command and run it. (Hook up real SpeechRecognition here if you want.)
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 950 }}>Command</div>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommand(cmd);
          }}
          placeholder='Try: "search ufc", "go live", "home", "favs"'
          className="ampere-focus"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--stroke2)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
            fontWeight: 850,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => onCommand(cmd)}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.12)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Run
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => setCmd("")}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ opacity: 0.75, fontWeight: 900, fontSize: 13 }}>
        Quick actions:{" "}
        {["search nba", "search ufc", "go live", "home", "favs"].map((x) => (
          <button
            key={x}
            type="button"
            className="ampere-focus"
            onClick={() => {
              setCmd(x);
              onCommand(x);
            }}
            style={{
              marginLeft: 8,
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.22)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            {x}
          </button>
        ))}
      </div>
    </div>
  );
}

function RemotePad({ onAction }: { onAction: (a: string) => void }) {
  const Btn = ({ label, big }: { label: string; big?: boolean }) => (
    <button
      type="button"
      className="ampere-focus"
      onClick={() => onAction(label)}
      style={{
        padding: big ? "14px 14px" : "10px 12px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        fontWeight: 950,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Demo remote pad. In a real product this would map to CEC/TV OS APIs (or a local hub).
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, maxWidth: 520 }}>
        <div />
        <Btn label="UP" big />
        <div />
        <Btn label="LEFT" big />
        <Btn label="OK" big />
        <Btn label="RIGHT" big />
        <div />
        <Btn label="DOWN" big />
        <div />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn label="BACK" />
        <Btn label="HOME" />
        <Btn label="LIVE" />
        <Btn label="FAVS" />
        <Btn label="SEARCH" />
      </div>
    </div>
  );
}

function FavoritesEditor({
  isMobile,
  profile,
  onSave,
}: {
  isMobile: boolean;
  profile: ProfileState;
  onSave: (next: ProfileState) => void;
}) {
  const [pSearch, setPSearch] = useState("");
  const [tSearch, setTSearch] = useState("");

  const [favPlatforms, setFavPlatforms] = useState<PlatformId[]>(profile.favoritePlatformIds);
  const [favLeagues, setFavLeagues] = useState<string[]>(profile.favoriteLeagues);
  const [favTeams, setFavTeams] = useState<string[]>(profile.favoriteTeams);

  useEffect(() => {
    setFavPlatforms(profile.favoritePlatformIds);
    setFavLeagues(profile.favoriteLeagues);
    setFavTeams(profile.favoriteTeams);
    setPSearch("");
    setTSearch("");
  }, [profile]);

  const leaguesSelectable = LEAGUES.filter((l) => l !== "ALL");
  const platformsFiltered = useMemo(() => {
    const q = pSearch.trim().toLowerCase();
    const base = [...PLATFORMS].slice().sort((a, b) => a.label.localeCompare(b.label));
    if (!q) return base;
    return base.filter((p) => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [pSearch]);

  const teamsBySelectedLeagues = useMemo(() => {
    const selected = favLeagues.length ? favLeagues : [];
    const out: { league: string; teams: string[] }[] = [];
    for (const l of selected) {
      const canon = canonicalLeagueForTeams(l) ?? l;
      const all = TEAMS_BY_LEAGUE[canon] ?? [];
      out.push({ league: canon, teams: all });
    }
    return out;
  }, [favLeagues.join("|")]);

  const filteredTeamSections = useMemo(() => {
    const q = normalizeKey(tSearch);
    if (!q) return teamsBySelectedLeagues;
    return teamsBySelectedLeagues.map((s) => ({
      league: s.league,
      teams: s.teams.filter((t) => normalizeKey(t).includes(q)),
    }));
  }, [teamsBySelectedLeagues, tSearch]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Edit favorites (stored locally). These affect ranking + filters + notifications.
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950 }}>Favorite Platforms</div>
          <input
            value={pSearch}
            onChange={(e) => setPSearch(e.target.value)}
            placeholder="Filter platforms…"
            className="ampere-focus"
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 850,
              minWidth: 240,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {platformsFiltered.map((p) => (
            <PillButton
              key={`favplat_${p.id}`}
              label={p.label}
              iconSources={platformIconCandidates(p.id)}
              active={favPlatforms.includes(p.id)}
              onClick={() => setFavPlatforms((prev) => uniq(toggleInArray(prev, p.id) as PlatformId[]))}
              fullWidth
              multiline
            />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Favorite Leagues</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {leaguesSelectable.map((l) => (
            <PillButton
              key={`favleague_${l}`}
              label={l}
              active={favLeagues.includes(l)}
              onClick={() => setFavLeagues((prev) => uniq(toggleInArray(prev, l)))}
              fullWidth
            />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950 }}>Favorite Teams</div>
          <input
            value={tSearch}
            onChange={(e) => setTSearch(e.target.value)}
            placeholder="Filter teams…"
            className="ampere-focus"
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 850,
              minWidth: 240,
            }}
          />
        </div>

        {!favLeagues.length ? (
          <div style={{ opacity: 0.75, fontWeight: 900 }}>Select a league above to pick teams.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredTeamSections.map((sec) => (
              <div key={`teams_${sec.league}`} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950, opacity: 0.92 }}>{sec.league}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {sec.teams.slice(0, 24).map((t) => (
                    <PillButton
                      key={`${sec.league}_${t}`}
                      label={t}
                      active={favTeams.includes(t)}
                      onClick={() => setFavTeams((prev) => uniq(toggleInArray(prev, t)))}
                      fullWidth
                      multiline
                    />
                  ))}
                </div>
                {sec.teams.length > 24 ? <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>Showing 24 of {sec.teams.length}. Refine with search.</div> : null}
              </div>
            ))}
          </div>
        )}

        {favTeams.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {favTeams.slice(0, 18).map((t) => (
              <Chip key={`favteam_chip_${t}`} label={t} onRemove={() => setFavTeams((prev) => prev.filter((x) => x !== t))} />
            ))}
            {favTeams.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{favTeams.length - 18} more</div> : null}
          </div>
        ) : (
          <div style={{ opacity: 0.75, fontWeight: 900 }}>No teams selected (optional).</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => {
            setFavPlatforms([]);
            setFavLeagues([]);
            setFavTeams([]);
            track("favorites_clear", {});
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.28)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() =>
            onSave({
              ...profile,
              favoritePlatformIds: uniq(favPlatforms),
              favoriteLeagues: uniq(favLeagues),
              favoriteTeams: uniq(favTeams),
            })
          }
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.12)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Save Favorites
        </button>
      </div>
    </div>
  );
}

function SetupWizardContent({
  isMobile,
  setupStep,
  setSetupStep,
  draftName,
  setDraftName,
  draftPlatforms,
  setDraftPlatforms,
  draftLeagues,
  setDraftLeagues,
  draftTeams,
  setDraftTeams,
  wizShownByLeague,
  setWizShownByLeague,
  wizTeamSearch,
  setWizTeamSearch,
  canNext,
  onFinish,
  onStartOver,
}: {
  isMobile: boolean;
  setupStep: 1 | 2 | 3 | 4 | 5;
  setSetupStep: (s: 1 | 2 | 3 | 4 | 5) => void;
  draftName: string;
  setDraftName: (s: string) => void;
  draftPlatforms: PlatformId[];
  setDraftPlatforms: (x: PlatformId[]) => void;
  draftLeagues: string[];
  setDraftLeagues: (x: string[]) => void;
  draftTeams: string[];
  setDraftTeams: (x: string[]) => void;
  wizShownByLeague: Record<string, number>;
  setWizShownByLeague: (x: Record<string, number>) => void;
  wizTeamSearch: string;
  setWizTeamSearch: (s: string) => void;
  canNext: boolean;
  onFinish: () => void;
  onStartOver: () => void;
}) {
  const leaguesSelectable = LEAGUES.filter((l) => l !== "ALL");
  const sortedPlatforms = useMemo(() => [...PLATFORMS].slice().sort((a, b) => a.label.localeCompare(b.label)), []);

  const stepTitle =
    setupStep === 1 ? "Your Profile" : setupStep === 2 ? "Pick Platforms" : setupStep === 3 ? "Pick Leagues" : setupStep === 4 ? "Pick Teams" : "Review";

  const goNext = () => {
    if (!canNext) return;
    const n = Math.min(5, (setupStep + 1) as any) as any;
    setSetupStep(n);
    track("wizard_step_next", { from: setupStep, to: n });
  };

  const goBack = () => {
    const n = Math.max(1, (setupStep - 1) as any) as any;
    setSetupStep(n);
    track("wizard_step_back", { from: setupStep, to: n });
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{stepTitle}</div>
          <div style={{ opacity: 0.78, fontWeight: 900 }}>Progress: {setupStep}/5 • Autosaved</div>
        </div>

        <button
          type="button"
          className="ampere-focus"
          onClick={onStartOver}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.22)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Start over
        </button>
      </div>

      {/* STEP 1 */}
      {setupStep === 1 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Let’s personalize AMPÈRE. This controls ranking and defaults in the app.
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 950 }}>Name</div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Your name"
              className="ampere-focus"
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid var(--stroke2)",
                background: "rgba(0,0,0,0.35)",
                color: "white",
                outline: "none",
                fontWeight: 900,
              }}
            />
            <div style={{ opacity: 0.74, fontWeight: 900, fontSize: 12 }}>
              Tip: you can set avatar/header in Profile Settings.
            </div>
          </div>
        </div>
      ) : null}

      {/* STEP 2 */}
      {setupStep === 2 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Choose the services you use most. These become your Favorite Platforms.
          </div>

          {draftPlatforms.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {draftPlatforms.slice(0, 18).map((pid) => (
                <Chip key={`wiz_plat_${pid}`} label={platformById(pid)?.label ?? pid} onRemove={() => setDraftPlatforms((prev) => prev.filter((x) => x !== pid))} />
              ))}
              {draftPlatforms.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftPlatforms.length - 18} more</div> : null}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>Pick at least one platform.</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {sortedPlatforms.map((p) => (
              <PillButton
                key={`wiz_plat_${p.id}`}
                label={p.label}
                iconSources={platformIconCandidates(p.id)}
                active={draftPlatforms.includes(p.id)}
                onClick={() => setDraftPlatforms((prev) => uniq(toggleInArray(prev, p.id) as PlatformId[]))}
                fullWidth
                multiline
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* STEP 3 */}
      {setupStep === 3 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Pick leagues you care about (optional). This helps personalize “Live” and recommendations.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            {leaguesSelectable.map((l) => (
              <PillButton
                key={`wiz_league_${l}`}
                label={l}
                active={draftLeagues.includes(l)}
                onClick={() => setDraftLeagues((prev) => uniq(toggleInArray(prev, l)))}
                fullWidth
              />
            ))}
          </div>

          {draftLeagues.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {draftLeagues.map((l) => (
                <Chip key={`wiz_league_chip_${l}`} label={l} onRemove={() => setDraftLeagues((prev) => prev.filter((x) => x !== l))} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected (you can continue).</div>
          )}
        </div>
      ) : null}

      {/* STEP 4 */}
      {setupStep === 4 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Pick favorite teams (optional). Tip: use search to narrow.
          </div>

          <input
            value={wizTeamSearch}
            onChange={(e) => setWizTeamSearch(e.target.value)}
            placeholder="Search teams…"
            className="ampere-focus"
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 850,
            }}
          />

          {!draftLeagues.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected — teams are optional. Continue to Review.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {draftLeagues.map((l) => {
                const canon = canonicalLeagueForTeams(l) ?? l;
                const all = TEAMS_BY_LEAGUE[canon] ?? [];
                const q = normalizeKey(wizTeamSearch);
                const filtered = q ? all.filter((t) => normalizeKey(t).includes(q)) : all;

                const shown = wizShownByLeague[canon] ?? (isMobile ? 12 : 20);
                const slice = filtered.slice(0, shown);
                const more = shown < filtered.length;

                return (
                  <div
                    key={`wiz_team_${canon}`}
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 950, opacity: 0.92 }}>{canon}</div>
                      <div style={{ opacity: 0.75, fontWeight: 900, fontSize: 12 }}>
                        {draftTeams.length} team(s) selected
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                      {slice.map((t) => (
                        <PillButton
                          key={`${canon}_${t}`}
                          label={t}
                          active={draftTeams.includes(t)}
                          onClick={() => setDraftTeams((prev) => uniq(toggleInArray(prev, t)))}
                          fullWidth
                          multiline
                        />
                      ))}
                    </div>

                    {more ? (
                      <button
                        type="button"
                        className="ampere-focus"
                        onClick={() =>
                          setWizShownByLeague((prev) => ({
                            ...prev,
                            [canon]: Math.min(filtered.length, (prev[canon] ?? shown) + (isMobile ? 12 : 20)),
                          }))
                        }
                        style={{
                          padding: "10px 12px",
                          borderRadius: 14,
                          border: "1px solid rgba(58,167,255,0.22)",
                          background: "rgba(58,167,255,0.10)",
                          color: "white",
                          fontWeight: 950,
                          cursor: "pointer",
                          width: "fit-content",
                        }}
                      >
                        Load more ({slice.length}/{filtered.length})
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {draftTeams.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {draftTeams.slice(0, 18).map((t) => (
                <Chip key={`wiz_team_chip_${t}`} label={t} onRemove={() => setDraftTeams((prev) => prev.filter((x) => x !== t))} />
              ))}
              {draftTeams.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftTeams.length - 18} more</div> : null}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No teams selected (optional).</div>
          )}
        </div>
      ) : null}

      {/* STEP 5 */}
      {setupStep === 5 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Review your selections. Finish to apply them to your profile.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950 }}>Name</div>
              <div style={{ opacity: 0.9, fontWeight: 900 }}>{draftName.trim() || "—"}</div>
            </div>
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950 }}>Favorites</div>
              <div style={{ opacity: 0.9, fontWeight: 900 }}>
                {draftPlatforms.length} platform(s), {draftLeagues.length} league(s), {draftTeams.length} team(s)
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Platforms</div>
            {draftPlatforms.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {draftPlatforms.slice(0, 18).map((pid) => (
                  <Chip key={`rev_plat_${pid}`} label={platformById(pid)?.label ?? pid} />
                ))}
                {draftPlatforms.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftPlatforms.length - 18} more</div> : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75, fontWeight: 900 }}>No platforms selected.</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Leagues</div>
            {draftLeagues.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {draftLeagues.map((l) => (
                  <Chip key={`rev_league_${l}`} label={l} />
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected (ok).</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Teams</div>
            {draftTeams.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {draftTeams.slice(0, 18).map((t) => (
                  <Chip key={`rev_team_${t}`} label={t} />
                ))}
                {draftTeams.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftTeams.length - 18} more</div> : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75, fontWeight: 900 }}>No teams selected (ok).</div>
            )}
          </div>
        </div>
      ) : null}

      {/* NAV */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap", marginTop: 4 }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={goBack}
          disabled={setupStep === 1}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: setupStep === 1 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: setupStep === 1 ? "not-allowed" : "pointer",
            opacity: setupStep === 1 ? 0.55 : 1,
          }}
        >
          Back
        </button>

        {setupStep < 5 ? (
          <button
            type="button"
            className="ampere-focus"
            onClick={goNext}
            disabled={!canNext}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: canNext ? "rgba(58,167,255,0.12)" : "rgba(58,167,255,0.06)",
              color: "white",
              fontWeight: 950,
              cursor: canNext ? "pointer" : "not-allowed",
              opacity: canNext ? 1 : 0.6,
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="ampere-focus"
            onClick={() => {
              track("wizard_finish_click", {});
              onFinish();
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: "rgba(58,167,255,0.14)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            Finish
          </button>
        )}
      </div>

      {setupStep === 1 && !draftName.trim() ? (
        <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>Name is required to continue.</div>
      ) : null}
      {setupStep === 2 && draftPlatforms.length === 0 ? (
        <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>Pick at least one platform to continue.</div>
      ) : null}
    </div>
  );
}

/* =========================
   Image helper
   ========================= */

async function fileToResizedDataUrl(file: File, maxDim: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image_failed"));
    i.src = dataUrl;
  });

  const w = img.naturalWidth || img.width || 1;
  const h = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.9);
}