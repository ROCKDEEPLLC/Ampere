"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AMPÈRE — Demo that becomes Production-ready (Phase 1 implementation)
 *
 * Implemented in this update:
 * - Locked Header + Locked Footer, with vertical scrolling content area (no horizontal preview scrollbars)
 * - “Streaming Type” renamed to “Genre”
 * - “Services” renamed to “Streaming Platform”
 * - Platform pills support multi-line labels (2–3 rows) so words are readable
 * - Preview sections use responsive grids (no side/bottom sliders)
 * - Search submit fixed (no-op removed); results shown inline on Search screen
 * - Canonical IDs for platforms/providers (reduces naming bugs)
 * - Accessibility: modal aria, ESC close, focus management, visible focus ring, reduced motion support
 * - Demo catalog generation so each Genre + Platform has content (“true demo”)
 * - Header image upload (stored locally for demo)
 *
 * Notes:
 * - Accounts + DB are planned Phase 2 (Supabase recommended). This file remains dependency-free.
 */

// -------------------- Types --------------------

type TabKey = "home" | "live" | "favs" | "search";

type GenreKey =
  | "All"
  | "Basic Streaming"
  | "Premium Streaming"
  | "Premium Sports Streaming"
  | "Movie Streaming"
  | "Free Streaming"
  | "Indie and Arthouse Film"
  | "Horror / Cult"
  | "Documentaries"
  | "Anime / Asian cinema"
  | "Black culture & diaspora"
  | "LGBT";

type CardBadge = "LIVE" | "UPCOMING" | "FAV";

type Card = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: CardBadge;
  badgeRight?: string; // top-right label
  platformId?: PlatformId; // canonical
  platformLabel?: string; // display
  league?: string;
  genre?: GenreKey;
  thumb?: string;
  startTime?: string;
  timeRemaining?: string;
  metaLeft?: string;
  metaRight?: string;
};

type ProfileState = {
  name: string;
  profilePhoto?: string | null; // data URL
  headerPhoto?: string | null; // data URL
  favoritePlatformIds: PlatformId[];
  favoriteLeagues: string[];
  favoriteTeams: string[];
  connectedPlatformIds: Record<PlatformId, boolean>;
  notificationsEnabled: boolean;
};

type ViewingEvent = {
  id: string;
  title: string;
  platformId?: PlatformId;
  league?: string;
  at: string; // ISO
};

// -------------------- Helpers --------------------

function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]/g, "");
}

function safeNowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

// -------------------- Viewport / density --------------------

function useViewport() {
  const [vp, setVp] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const isMobile = vp.w < 720;
  const isTablet = vp.w >= 720 && vp.w < 1080;

  const density = useMemo(() => {
    const base = isMobile ? 0.9 : isTablet ? 0.96 : 1.0;
    return {
      base,
      pad: Math.round(14 * base),
      gap: Math.round(12 * base),
      h1: isMobile ? 24 : isTablet ? 28 : 32,
      h2: isMobile ? 16 : 18,
      small: isMobile ? 12 : 13,
      cardMinW: isMobile ? 210 : 240,
      heroH: isMobile ? 92 : 110,
      icon: isMobile ? 24 : 26,
    };
  }, [isMobile, isTablet]);

  return { ...vp, isMobile, isTablet, density };
}

// -------------------- Brand artwork candidates --------------------

function brandWideCandidates(): string[] {
  return [
    "/brand/AMPERE%20Long%20Logo.png",
    "/brand/AMPERE%20Short%20Logo.png",
    "/brand/ampere-long.png",
    "/brand/ampere-mark.png",
  ];
}
function brandMarkCandidates(): string[] {
  return [
    "/brand/AMPERE%20Short%20Logo.png",
    "/brand/AMPERE%20Long%20Logo.png",
    "/brand/ampere-mark.png",
    "/brand/ampere-long.png",
  ];
}
function safeBrandWide(): string {
  return brandWideCandidates()[0] ?? "/brand/AMPERE%20Long%20Logo.png";
}

// -------------------- Canonical Platforms --------------------

type PlatformId =
  | "all"
  | "livetv"
  | "netflix"
  | "hulu"
  | "primevideo"
  | "disneyplus"
  | "max"
  | "peacock"
  | "paramountplus"
  | "appletv"
  | "youtube"
  | "youtubetv"
  | "betplus"
  | "tubi"
  | "sling"
  | "twitch"
  | "fubotv"
  | "espn"
  | "espnplus"
  | "dazn"
  | "nflplus"
  | "nbaleaguepass"
  | "mlbtv"
  | "nhl"
  | "amcplus"
  | "starz"
  | "mgmplus"
  | "criterion"
  | "mubi"
  | "vudu"
  | "appletvstore"
  | "youtubemovies"
  | "moviesanywhere"
  | "plutotv"
  | "roku"
  | "freevee"
  | "xumo"
  | "plex"
  | "crackle"
  | "revry"
  | "ovid"
  | "fandor"
  | "kinocult"
  | "kanopy"
  | "shudder"
  | "screambox"
  | "arrow"
  | "curiositystream"
  | "magellantv"
  | "pbspassport"
  | "crunchyroll"
  | "hidive"
  | "viki"
  | "iqiyi"
  | "asiancrush"
  | "kwelitv"
  | "mansa"
  | "allblk"
  | "brownsugar"
  | "americanu"
  | "afrolandtv"
  | "urbanflixtv"
  | "blackstarnetwork"
  | "umc"
  | "blackmedia"
  | "hbcugo"
  | "hbcugosports";

type Platform = {
  id: PlatformId;
  label: string;
  kind?: "platform" | "bundle" | "channel";
};

const PLATFORMS: Platform[] = [
  { id: "all", label: "ALL" },
  { id: "livetv", label: "Live TV" },
  { id: "netflix", label: "Netflix" },
  { id: "hulu", label: "Hulu" },
  { id: "primevideo", label: "Prime Video" },
  { id: "disneyplus", label: "Disney+" },
  { id: "max", label: "Max" },
  { id: "peacock", label: "Peacock" },
  { id: "paramountplus", label: "Paramount+" },
  { id: "appletv", label: "Apple TV" },
  { id: "youtube", label: "YouTube" },
  { id: "youtubetv", label: "YouTube TV" },
  { id: "betplus", label: "BET+" },
  { id: "tubi", label: "Tubi" },
  { id: "sling", label: "Sling" },
  { id: "twitch", label: "Twitch" },
  { id: "fubotv", label: "FuboTV" },
  { id: "espn", label: "ESPN" },

  // Extended
  { id: "espnplus", label: "ESPN+" },
  { id: "dazn", label: "DAZN" },
  { id: "nflplus", label: "NFL+" },
  { id: "nbaleaguepass", label: "NBA League Pass" },
  { id: "mlbtv", label: "MLB.TV" },
  { id: "nhl", label: "NHL" },
  { id: "amcplus", label: "AMC+" },
  { id: "starz", label: "Starz" },
  { id: "mgmplus", label: "MGM+" },
  { id: "criterion", label: "The Criterion Channel" },
  { id: "mubi", label: "MUBI" },
  { id: "vudu", label: "Fandango at Home (Vudu)" },
  { id: "appletvstore", label: "Apple TV Store" },
  { id: "youtubemovies", label: "YouTube Movies / Google TV" },
  { id: "moviesanywhere", label: "Movies Anywhere" },
  { id: "plutotv", label: "Pluto TV" },
  { id: "roku", label: "The Roku Channel" },
  { id: "freevee", label: "Amazon Freevee" },
  { id: "xumo", label: "Xumo Play" },
  { id: "plex", label: "Plex" },
  { id: "crackle", label: "Crackle" },
  { id: "revry", label: "Revry" },
  { id: "ovid", label: "OVID.tv" },
  { id: "fandor", label: "Fandor" },
  { id: "kinocult", label: "Kino Cult" },
  { id: "kanopy", label: "Kanopy" },
  { id: "shudder", label: "Shudder" },
  { id: "screambox", label: "Screambox" },
  { id: "arrow", label: "Arrow Player" },
  { id: "curiositystream", label: "CuriosityStream" },
  { id: "magellantv", label: "MagellanTV" },
  { id: "pbspassport", label: "PBS Passport" },
  { id: "crunchyroll", label: "Crunchyroll" },
  { id: "hidive", label: "HIDIVE" },
  { id: "viki", label: "Viki" },
  { id: "iqiyi", label: "iQIYI" },
  { id: "asiancrush", label: "AsianCrush" },

  // Black culture & diaspora
  { id: "kwelitv", label: "KweliTV" },
  { id: "mansa", label: "MANSA" },
  { id: "allblk", label: "ALLBLK" },
  { id: "brownsugar", label: "Brown Sugar" },
  { id: "americanu", label: "America Nu" },
  { id: "afrolandtv", label: "AfroLandTV" },
  { id: "urbanflixtv", label: "UrbanFlixTV" },
  { id: "blackstarnetwork", label: "Black Star Network" },
  { id: "umc", label: "UMC (Urban Movie Channel)" },

  // Umbrella / HBCU
  { id: "blackmedia", label: "Black Media" },
  { id: "hbcugo", label: "HBCUGO" },
  { id: "hbcugosports", label: "HBCUGO Sports" },
];

function platformById(id: PlatformId) {
  return PLATFORMS.find((p) => p.id === id);
}

function platformIdFromLabel(label: string): PlatformId | null {
  const k = normalizeKey(label);
  const hit = PLATFORMS.find((p) => normalizeKey(p.label) === k);
  return hit?.id ?? null;
}

// -------------------- Genres -> platform membership --------------------

const GENRES: { key: GenreKey; platformIds: PlatformId[] }[] = [
  {
    key: "All",
    platformIds: [
      "all",
      "livetv",
      "netflix",
      "hulu",
      "primevideo",
      "disneyplus",
      "max",
      "peacock",
      "paramountplus",
      "appletv",
      "youtube",
      "youtubetv",
      "betplus",
      "tubi",
      "sling",
      "twitch",
      "fubotv",
      "espn",
      "blackmedia",
      "hbcugo",
      "hbcugosports",
    ],
  },
  { key: "Basic Streaming", platformIds: ["all", "netflix", "hulu", "primevideo", "disneyplus", "max", "peacock", "paramountplus", "appletv"] },
  { key: "Premium Streaming", platformIds: ["all", "betplus", "amcplus", "starz", "mgmplus"] },
  { key: "Premium Sports Streaming", platformIds: ["all", "espnplus", "dazn", "nflplus", "nbaleaguepass", "mlbtv", "nhl"] },
  { key: "Movie Streaming", platformIds: ["all", "criterion", "mubi", "vudu", "appletvstore", "youtubemovies", "moviesanywhere"] },
  { key: "Free Streaming", platformIds: ["all", "tubi", "plutotv", "roku", "freevee", "xumo", "plex", "crackle", "revry"] },
  { key: "Indie and Arthouse Film", platformIds: ["all", "criterion", "mubi", "ovid", "fandor", "kinocult", "kanopy"] },
  { key: "Horror / Cult", platformIds: ["all", "shudder", "screambox", "arrow"] },
  { key: "Documentaries", platformIds: ["all", "curiositystream", "magellantv", "pbspassport"] },
  { key: "Anime / Asian cinema", platformIds: ["all", "crunchyroll", "hidive", "viki", "iqiyi", "asiancrush"] },
  {
    key: "Black culture & diaspora",
    platformIds: ["all", "kwelitv", "hbcugo", "hbcugosports", "mansa", "allblk", "brownsugar", "americanu", "afrolandtv", "urbanflixtv", "blackstarnetwork", "umc"],
  },
  { key: "LGBT", platformIds: ["all", "revry"] },
];

function platformsForGenre(genre: GenreKey) {
  const found = GENRES.find((g) => g.key === genre);
  return found?.platformIds ?? ["all"];
}

const ALL_PLATFORM_IDS: PlatformId[] = uniq(
  GENRES.flatMap((g) => g.platformIds).filter((x) => x !== "all")
) as PlatformId[];

// -------------------- Icons & logos (fallback) --------------------

function leagueLogoCandidates(league?: string): string[] {
  if (!league) return [];
  const key = normalizeKey(league);
  const map: Record<string, string[]> = {
    ncaaf: ["/logos/leagues/NCAAF.png", "/logos/leagues/ncaaf.png"],
    nba: ["/logos/leagues/nba.png"],
    nfl: ["/logos/leagues/nfl.png"],
    mlb: ["/logos/leagues/mlb.png"],
    nhl: ["/logos/leagues/nhl.png"],
    soccer: ["/logos/leagues/soccer.png"],
    ufc: ["/logos/leagues/ufc.png"],
    hbcugosports: ["/logos/leagues/HBCUGOSPORTS.png", "/logos/services/BlackMedia/HBCUGO.png"],
    hbcugo: ["/logos/services/BlackMedia/HBCUGO.png", "/logos/services/blackmedia/HBCUGO.png"],
  };
  return map[key] ?? [`/logos/leagues/${league}.png`, `/logos/leagues/${key}.png`];
}

const PLATFORM_ICON_CANDIDATES: Partial<Record<PlatformId, string[]>> = {
  netflix: ["/logos/services/netflix.png", "/logos/services/Netflix.png"],
  hulu: ["/logos/services/hulu.png", "/logos/services/Hulu.png"],
  primevideo: ["/logos/services/primevideo.png", "/logos/services/Primevideo.png"],
  disneyplus: ["/logos/services/disneyplus.png", "/logos/services/Disney+.png", "/logos/services/Disneyplus.png"],
  max: ["/logos/services/max.png", "/logos/services/max.com.png", "/logos/services/HBO.png"],
  peacock: ["/logos/services/peacock.png", "/logos/services/Peacock.png"],
  paramountplus: ["/logos/services/paramountplus.png", "/logos/services/ParamountPlus.png", "/logos/services/Paramountplus.png"],
  youtube: ["/logos/services/youtube.png", "/logos/services/YouTube.png"],
  youtubetv: ["/logos/services/youtubetv.png", "/logos/services/YouTubeTV.png"],
  appletv: ["/logos/services/appletv.png", "/logos/services/AppleTV.png"],
  betplus: ["/logos/services/betplus.png", "/logos/services/BETPLUS.png"],
  tubi: ["/logos/services/tubi.png", "/logos/services/Tubi.png"],
  sling: ["/logos/services/sling.png", "/logos/services/Sling.png"],
  twitch: ["/logos/services/twitch.png", "/logos/services/Twitch.png"],
  fubotv: ["/logos/services/fubotv.png", "/logos/services/FuboTV.png", "/logos/services/FUBOTV.png"],
  espn: ["/logos/services/espn.png", "/logos/services/ESPN.png"],

  blackmedia: ["/logos/services/BlackMedia/BlackMedia.png", "/logos/services/BlackMedia.png", "/logos/services/BLACKOWNED.png"],
  hbcugo: ["/logos/services/BlackMedia/HBCUGO.png", "/logos/services/HBCUGO.png"],
  hbcugosports: ["/logos/leagues/HBCUGOSPORTS.png", "/logos/services/BlackMedia/HBCUGO.png"],

  allblk: ["/logos/services/BlackMedia/ALLBLK.png", "/logos/services/blackmedia/ALLBLK.png"],
  kwelitv: ["/logos/services/BlackMedia/kwelitv.png", "/logos/services/BlackMedia/KweliTV.png"],
  mansa: ["/logos/services/BlackMedia/MANSA.png", "/logos/services/BlackMedia/Mansa.png"],
  brownsugar: ["/logos/services/BlackMedia/BrownSugar.png"],
  americanu: ["/logos/services/BlackMedia/americanu.png", "/logos/services/BlackMedia/AmericaNu.png"],
};

function platformIconCandidates(id?: PlatformId): string[] {
  if (!id) return [];
  return PLATFORM_ICON_CANDIDATES[id] ?? [`/logos/services/${id}.png`];
}

// -------------------- Inline Icons --------------------

function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 14a3.5 3.5 0 0 0 3.5-3.5V6.3A3.5 3.5 0 1 0 8.5 6.3v4.2A3.5 3.5 0 0 0 12 14Z"
        stroke="white"
        strokeOpacity="0.95"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="white" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke="white" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconRemote() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4h6a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 9h4" stroke="white" strokeOpacity="0.65" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 13h2" stroke="white" strokeOpacity="0.65" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 13h.5" stroke="white" strokeOpacity="0.65" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="white" strokeOpacity="0.95" strokeWidth="2" />
      <path
        d="M19.4 15a7.97 7.97 0 0 0 .1-1 7.97 7.97 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8.4 8.4 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a8.4 8.4 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.97 7.97 0 0 0-.1 1c0 .34.03.67.1 1l-2 1.5 2 3.5 2.4-1c.53.42 1.1.76 1.7 1l.3 2.6h4l.3-2.6c.6-.24 1.17-.58 1.7-1l2.4 1 2-3.5-2-1.5Z"
        stroke="white"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 9.5 12 15l5.5-5.5"
        stroke="white"
        strokeOpacity="0.75"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7.5v9l8-4.5-8-4.5Z" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// -------------------- SmartImg (w/ global failure cache to reduce 404 spam) --------------------

const FAILED_IMG = new Set<string>();

function SmartImg({
  sources,
  alt = "",
  size,
  rounded = 12,
  border = true,
  fit = "cover",
}: {
  sources: string[];
  alt?: string;
  size: number;
  rounded?: number;
  border?: boolean;
  fit?: "cover" | "contain";
}) {
  const cleaned = useMemo(() => sources.filter(Boolean).filter((s) => !FAILED_IMG.has(s)), [sources]);
  const [idx, setIdx] = useState(0);
  const src = cleaned[idx];

  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: rounded,
          background: "rgba(255,255,255,0.10)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
        }}
      >
        •
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => {
        FAILED_IMG.add(src);
        setIdx((n) => n + 1);
      }}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        objectFit: fit,
        display: "block",
        border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
        background: "rgba(255,255,255,0.06)",
      }}
    />
  );
}

// -------------------- Local storage --------------------

const STORAGE_KEY = "ampere_profile_v3";
const VIEWING_KEY = "ampere_viewing_v2";

function defaultProfile(): ProfileState {
  return {
    name: "Demo User",
    profilePhoto: null,
    headerPhoto: null,
    favoritePlatformIds: ["netflix", "espn", "blackmedia"],
    favoriteLeagues: ["NFL", "NBA", "NCAAF"],
    favoriteTeams: ["Lakers", "Celtics", "Chiefs"],
    connectedPlatformIds: {} as any,
    notificationsEnabled: true,
  };
}

function loadProfile(): ProfileState {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw) as Partial<ProfileState>;
    return {
      ...defaultProfile(),
      ...p,
      favoritePlatformIds: Array.isArray(p.favoritePlatformIds) ? (p.favoritePlatformIds as PlatformId[]) : defaultProfile().favoritePlatformIds,
      favoriteLeagues: Array.isArray(p.favoriteLeagues) ? p.favoriteLeagues : defaultProfile().favoriteLeagues,
      favoriteTeams: Array.isArray(p.favoriteTeams) ? p.favoriteTeams : defaultProfile().favoriteTeams,
      connectedPlatformIds: (p.connectedPlatformIds ?? {}) as any,
      notificationsEnabled: typeof p.notificationsEnabled === "boolean" ? p.notificationsEnabled : defaultProfile().notificationsEnabled,
    };
  } catch {
    return defaultProfile();
  }
}

function saveProfile(p: ProfileState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function loadViewing(): ViewingEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VIEWING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ViewingEvent[]) : [];
  } catch {
    return [];
  }
}

function saveViewing(events: ViewingEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VIEWING_KEY, JSON.stringify(events.slice(-300)));
}

// -------------------- Tracking (demo) --------------------

function track(action: string, payload: any) {
  try {
    const record = { action, payload, at: safeNowISO() };
    // eslint-disable-next-line no-console
    console.log("[AMPÈRE]", record);
    if (typeof window !== "undefined") window.localStorage.setItem("ampere_last_action", JSON.stringify(record));
  } catch {}
}

// -------------------- “AI” For You (MVP heuristic) --------------------

function scoreForYou(card: Card, profile: ProfileState, viewing: ViewingEvent[]) {
  const pid = card.platformId ?? platformIdFromLabel(card.platformLabel ?? "") ?? null;
  const leagueKey = normalizeKey(card.league ?? "");

  const favPlatformBoost = pid && profile.favoritePlatformIds.includes(pid) ? 3.0 : 0;
  const favLeagueBoost = profile.favoriteLeagues.some((l) => normalizeKey(l) === leagueKey) ? 2.0 : 0;

  const now = Date.now();
  let habit = 0;
  for (const v of viewing) {
    const ageHrs = Math.max(0, (now - new Date(v.at).getTime()) / 36e5);
    const decay = Math.exp(-ageHrs / 72);
    if (pid && v.platformId === pid) habit += 1.2 * decay;
    if (leagueKey && normalizeKey(v.league ?? "") === leagueKey) habit += 0.8 * decay;
  }

  const urgency = card.badge === "LIVE" ? 1.5 : card.badge === "UPCOMING" ? 0.6 : 0.2;
  const last = viewing[viewing.length - 1];
  const variety = last && normalizeKey(last.title) === normalizeKey(card.title) ? -0.6 : 0;

  return favPlatformBoost + favLeagueBoost + habit + urgency + variety;
}

function rankForYou(cards: Card[], profile: ProfileState, viewing: ViewingEvent[]) {
  return [...cards]
    .map((c) => ({ c, s: scoreForYou(c, profile, viewing) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}

function logViewing(card: Card) {
  if (typeof window === "undefined") return;
  const prev = loadViewing();
  const evt: ViewingEvent = {
    id: String(card.id ?? Math.random()),
    title: String(card.title ?? "Untitled"),
    platformId: card.platformId,
    league: card.league,
    at: safeNowISO(),
  };
  saveViewing([...prev, evt]);
  track("view_log", { title: evt.title, platformId: evt.platformId, league: evt.league });
}

// -------------------- Provider links (safe allowlist client-side) --------------------

type ProviderLink = { openBase: string; subscribe?: string; search?: (q: string) => string };

const PROVIDER_LINKS: Partial<Record<PlatformId, ProviderLink>> = {
  netflix: { openBase: "https://www.netflix.com/browse", subscribe: "https://www.netflix.com/signup", search: (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}` },
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
  tubi: { openBase: "https://tubitv.com", subscribe: "https://tubitv.com" },
  twitch: { openBase: "https://www.twitch.tv", search: (q) => `https://www.twitch.tv/search?term=${encodeURIComponent(q)}` },
  hbcugo: { openBase: "https://hbcugo.tv", subscribe: "https://hbcugo.tv" },
  hbcugosports: { openBase: "https://hbcugo.tv/Sports", subscribe: "https://hbcugo.tv/Sports" },
  blackmedia: { openBase: "https://www.google.com/search?q=black+media+streaming" },
  livetv: { openBase: "https://www.google.com/search?q=live+tv+provider" },
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

// -------------------- Teams by league (wizard + notifications) --------------------

const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  NFL: ["Chiefs", "Bills", "Cowboys", "49ers", "Eagles", "Dolphins", "Jets", "Giants"],
  NBA: ["Lakers", "Celtics", "Warriors", "Heat", "Bulls", "Knicks", "Nuggets", "Suns"],
  MLB: ["Yankees", "Red Sox", "Dodgers", "Cubs", "Braves", "Mets", "Astros", "Phillies"],
  NHL: ["Rangers", "Bruins", "Maple Leafs", "Blackhawks", "Oilers", "Lightning", "Avalanche", "Golden Knights"],
  NCAAF: ["Alabama", "Georgia", "Michigan", "USC", "Texas", "Ohio State", "Florida State", "LSU"],
  Soccer: ["Arsenal", "Chelsea", "Barcelona", "Real Madrid", "Inter Miami", "Manchester City", "Liverpool", "PSG"],
  UFC: ["Fight Night", "Title Card", "PPV Main Event"],
  HBCUGOSPORTS: ["HBCU Showcase", "Game of the Week", "Classic Rivalry"],
  HBCUGO: ["Campus Stories", "HBCU Spotlight", "Student Athletes"],
};

const LEAGUES = ["ALL", "NFL", "NBA", "MLB", "NHL", "NCAAF", "Soccer", "UFC", "HBCUGOSPORTS", "HBCUGO"] as const;

// -------------------- Image upload helpers --------------------

async function fileToResizedDataUrl(file: File, maxSize = 720): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image load failed"));
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.86);
}

// -------------------- Modal (a11y + focus + ESC) --------------------

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
  const titleId = useMemo(() => `modal_${normalizeKey(title)}_${Math.random().toString(16).slice(2)}`, [title]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Focus first focusable
    setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus?.();
    }, 0);

    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.60)",
        backdropFilter: "blur(8px)",
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: `min(${maxWidth}px, 100%)`,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(18,18,18,0.95)",
          boxShadow: "0 20px 90px rgba(0,0,0,0.65)",
          overflow: "hidden",
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
          }}
        >
          <div id={titleId} style={{ fontSize: 18, fontWeight: 950, color: "white" }}>
            {title}
          </div>
          <button
            onClick={onClose}
            className="ampere-focus"
            aria-label="Close modal"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
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

// -------------------- Buttons / dropdown --------------------

function PillButton({
  label,
  iconSources,
  iconNode,
  active,
  onClick,
  fullWidth,
  multiline,
  ariaLabel,
}: {
  label: string;
  iconSources?: string[];
  iconNode?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  multiline?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="ampere-focus"
      aria-label={ariaLabel ?? label}
      style={{
        width: fullWidth ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
        color: "white",
        cursor: "pointer",
        fontWeight: 950,
        userSelect: "none",
        minWidth: 0,
        textAlign: "left",
      }}
    >
      {iconNode ? (
        <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{iconNode}</span>
      ) : iconSources && iconSources.length ? (
        <SmartImg sources={iconSources} size={24} rounded={9} fit="contain" />
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
          }}
        >
          •
        </span>
      )}
      <span
        style={{
          opacity: 0.95,
          whiteSpace: multiline ? "normal" : "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: multiline ? 1.15 : 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function Dropdown({
  label,
  iconLeft,
  children,
  minWidth = 260,
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
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="ampere-focus"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.10)",
          background: open ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
          color: "white",
          cursor: "pointer",
          fontWeight: 950,
          whiteSpace: "nowrap",
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {iconLeft ? <span style={{ display: "inline-flex" }}>{iconLeft}</span> : null}
        <span style={{ opacity: 0.95 }}>{label}</span>
        <IconChevronDown />
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            minWidth,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(18,18,18,0.98)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
            overflow: "hidden",
            zIndex: 60,
          }}
        >
          <div style={{ padding: 10, display: "grid", gap: 8 }}>{children}</div>
        </div>
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
  return (
    <button
      onClick={onClick}
      className="ampere-focus"
      role="menuitem"
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
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
        <div style={{ fontWeight: 950, opacity: 0.92 }}>{title}</div>
        {subtitle ? <div style={{ marginTop: 4, fontWeight: 850, opacity: 0.65, fontSize: 12 }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ opacity: 0.85 }}>{right}</div> : null}
    </button>
  );
}

// -------------------- Cards (grid preview) --------------------

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

  const heroCandidates = card.thumb ? [card.thumb, ...brandWideCandidates(), ...brandMarkCandidates()] : [...brandWideCandidates(), ...brandMarkCandidates()];
  const platformIcon = card.platformId ? platformIconCandidates(card.platformId) : [];

  const leagueSources = leagueLogoCandidates(card.league);

  return (
    <button
      onClick={() => onOpen(card)}
      className="ampere-focus"
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.10)",
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
            "radial-gradient(1000px 280px at 30% 0%, rgba(255,255,255,0.14), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.20))",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.22 }}>
          <SmartImg sources={heroCandidates} size={900} rounded={0} border={false} fit="cover" />
        </div>

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
                      ? "rgba(90,170,255,0.20)"
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
                background: "rgba(0,0,0,0.35)",
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
          {leagueSources.length ? <SmartImg sources={leagueSources} size={26} rounded={10} fit="contain" /> : null}
          {platformIcon.length ? <SmartImg sources={platformIcon} size={26} rounded={10} fit="contain" /> : null}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ color: "white", fontWeight: 950, fontSize: 15, lineHeight: 1.15 }}>{card.title}</div>

        {card.subtitle ? (
          <div style={{ color: "rgba(255,255,255,0.70)", marginTop: 4, fontWeight: 850, fontSize: 12 }}>{card.subtitle}</div>
        ) : null}

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
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 950, color: "white" }}>{title}</div>
        {rightText ? (
          <button
            onClick={onRightClick}
            className="ampere-focus"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.70)",
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
              border: "1px solid rgba(255,255,255,0.10)",
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

// -------------------- About content blocks (text only; no portraits) --------------------

function RowKV({ left, right }: { left: string; right: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(160px, 260px) 1fr",
        gap: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.18)",
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 950, opacity: 0.9 }}>{left}</div>
      <div style={{ opacity: 0.88 }}>{right}</div>
    </div>
  );
}

function StackBlock({
  title,
  subtitle,
  person,
  role,
  descendants,
  why,
}: {
  title: string;
  subtitle: string;
  person: string;
  role: string[];
  descendants: string[];
  why: string;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
      <div style={{ opacity: 0.75, marginTop: 4 }}>{subtitle}</div>
      <div style={{ marginTop: 10, fontWeight: 950, opacity: 0.92 }}>{person}</div>

      <div style={{ marginTop: 10, fontWeight: 950, opacity: 0.9 }}>Role in the stack</div>
      <ul style={{ marginTop: 6, paddingLeft: 18, opacity: 0.88 }}>
        {role.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>

      <div style={{ marginTop: 10, fontWeight: 950, opacity: 0.9 }}>Modern descendants</div>
      <ul style={{ marginTop: 6, paddingLeft: 18, opacity: 0.88 }}>
        {descendants.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>

      <div style={{ marginTop: 10, opacity: 0.88 }}>
        <span style={{ fontWeight: 950 }}>Why it matters:</span> {why}
      </div>
    </div>
  );
}

// -------------------- Demo data generation (“true demo” coverage) --------------------

const DEMO_TITLES = [
  "Top Pick",
  "New Release",
  "Critics’ Choice",
  "Community Favorite",
  "Late Night Watch",
  "Weekend Binge",
  "Hidden Gem",
  "Just Added",
  "Award Winner",
  "Trending Now",
];

const DEMO_SUBS = ["Now", "Tonight", "New Season", "Live", "Premiere", "Featured", "Recommended", "Exclusive"];
const DEMO_LEAGUE_EVENTS: { league: string; match: string; pid: PlatformId; badge: CardBadge }[] = [
  { league: "NBA", match: "Celtics vs Lakers", pid: "espn", badge: "LIVE" },
  { league: "NFL", match: "Chiefs vs Bills", pid: "livetv", badge: "LIVE" },
  { league: "MLB", match: "Yankees vs Red Sox", pid: "livetv", badge: "UPCOMING" },
  { league: "NHL", match: "Rangers vs Bruins", pid: "livetv", badge: "UPCOMING" },
  { league: "UFC", match: "UFC Main Event", pid: "espn", badge: "UPCOMING" },
  { league: "Soccer", match: "Premier Clash", pid: "peacock", badge: "UPCOMING" },
  { league: "HBCUGOSPORTS", match: "HBCU Game of the Week", pid: "hbcugosports", badge: "LIVE" },
  { league: "HBCUGO", match: "Campus Stories Spotlight", pid: "hbcugo", badge: "UPCOMING" },
];

function buildDemoCatalog(): {
  forYou: Card[];
  liveNow: Card[];
  continueWatching: Card[];
  trending: Card[];
  blackMediaCards: Card[];
} {
  // Build many platform+genre items so every Genre/Platform has something
  const allGenreKeys = GENRES.map((g) => g.key);
  const platformPool = ALL_PLATFORM_IDS.slice(0, 22); // keep sane size; still broad

  const mk = (seed: number, pid: PlatformId, genre: GenreKey, badge?: CardBadge): Card => {
    const p = platformById(pid);
    const t = DEMO_TITLES[seed % DEMO_TITLES.length];
    const s = DEMO_SUBS[(seed + 3) % DEMO_SUBS.length];
    return {
      id: `${pid}_${normalizeKey(genre)}_${seed}`,
      title: `${t} • ${p?.label ?? pid}`,
      subtitle: `${genre} • ${s}`,
      badge,
      badgeRight: p?.label,
      platformId: pid,
      platformLabel: p?.label,
      genre,
      thumb: safeBrandWide(),
      startTime: seed % 3 === 0 ? "Tonight" : "Now",
      timeRemaining: badge === "LIVE" ? "Q3 • 8:42" : "—",
    };
  };

  const forYou: Card[] = [];
  const continueWatching: Card[] = [];
  const trending: Card[] = [];

  let seed = 1;
  for (const genre of allGenreKeys) {
    const members = platformsForGenre(genre).filter((x) => x !== "all");
    const pick = members.length ? members : platformPool;
    for (const pid of pick.slice(0, 6)) {
      forYou.push(mk(seed++, pid, genre, seed % 5 === 0 ? "UPCOMING" : undefined));
      trending.push(mk(seed++, pid, genre, seed % 6 === 0 ? "LIVE" : "UPCOMING"));
      continueWatching.push({
        ...mk(seed++, pid, genre, "UPCOMING"),
        title: `Continue • ${platformById(pid)?.label ?? pid}`,
        subtitle: `${genre} • Resume`,
        timeRemaining: `${(seed % 17) + 3}m left`,
      });
    }
  }

  const liveNow: Card[] = DEMO_LEAGUE_EVENTS.map((e, i) => ({
    id: `live_${i}_${normalizeKey(e.league)}`,
    title: e.match,
    subtitle: e.badge === "LIVE" ? "Live" : "Upcoming",
    badge: e.badge,
    badgeRight: platformById(e.pid)?.label,
    platformId: e.pid,
    platformLabel: platformById(e.pid)?.label,
    league: e.league,
    genre: "Premium Sports Streaming",
    thumb: leagueLogoCandidates(e.league)[0] ?? safeBrandWide(),
    startTime: e.badge === "LIVE" ? "Now" : "Tonight",
    timeRemaining: e.badge === "LIVE" ? "Q2 • 4:11" : "Starts soon",
  })).concat(
    // Additional sports-like filler across more platforms
    platformPool.slice(0, 8).map((pid, i) => ({
      id: `sports_${pid}_${i}`,
      title: `Sports Center Live • ${platformById(pid)?.label ?? pid}`,
      subtitle: "Live",
      badge: "LIVE",
      badgeRight: platformById(pid)?.label,
      platformId: pid,
      platformLabel: platformById(pid)?.label,
      league: "NBA",
      genre: "Premium Sports Streaming",
      thumb: "/logos/leagues/nba.png",
      startTime: "Now",
      timeRemaining: "Q1 • 11:02",
    }))
  );

  const blackMediaCards: Card[] = [
    { pid: "allblk" as PlatformId, title: "ALLBLK • Original Series Spotlight" },
    { pid: "kwelitv" as PlatformId, title: "KweliTV • Indie Film Showcase" },
    { pid: "mansa" as PlatformId, title: "MANSA • Featured Movie Night" },
    { pid: "brownsugar" as PlatformId, title: "Brown Sugar • Classic Black Cinema" },
    { pid: "americanu" as PlatformId, title: "America Nu • News & Culture Weekly" },
    { pid: "hbcugo" as PlatformId, title: "HBCUGO • Campus Stories" },
    { pid: "hbcugosports" as PlatformId, title: "HBCUGO Sports • Game of the Week" },
  ].map((x, i) => ({
    id: `bm_${i}_${x.pid}`,
    title: x.title,
    subtitle: "Black culture & diaspora • Preview",
    badge: "UPCOMING",
    badgeRight: platformById(x.pid)?.label,
    platformId: x.pid,
    platformLabel: platformById(x.pid)?.label,
    genre: "Black culture & diaspora",
    thumb: platformIconCandidates("blackmedia")[0] ?? safeBrandWide(),
    startTime: "—",
    timeRemaining: "—",
  }));

  return {
    forYou: forYou.slice(0, 60),
    liveNow: liveNow.slice(0, 30),
    continueWatching: continueWatching.slice(0, 60),
    trending: trending.slice(0, 60),
    blackMediaCards,
  };
}

// -------------------- Main Component --------------------

export default function AmpereApp() {
  const { isMobile, density } = useViewport();

  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // Filters
  const [activeGenre, setActiveGenre] = useState<GenreKey>("All");
  const [activePlatform, setActivePlatform] = useState<PlatformId>("all");
  const [activeLeague, setActiveLeague] = useState<string>("ALL");

  // Profile + setup
  const [profile, setProfile] = useState<ProfileState>(() => loadProfile());

  // Modals
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [openSeeAll, setOpenSeeAll] = useState<null | "genres" | "platforms" | "for-you" | "live-now" | "continue" | "trending">(null);
  const [openVoice, setOpenVoice] = useState(false);
  const [openRemote, setOpenRemote] = useState(false);
  const [openFavorites, setOpenFavorites] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openConnect, setOpenConnect] = useState(false);
  const [openSetup, setOpenSetup] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [openProfileSettings, setOpenProfileSettings] = useState(false);

  // Setup wizard state
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPlatforms, setDraftPlatforms] = useState<PlatformId[]>(profile.favoritePlatformIds);
  const [draftLeagues, setDraftLeagues] = useState<string[]>(profile.favoriteLeagues);
  const [draftTeams, setDraftTeams] = useState<string[]>(profile.favoriteTeams);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Demo data (generated)
  const demo = useMemo(() => buildDemoCatalog(), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "AMPÈRE";
  }, []);

  useEffect(() => {
    // Fake loading to show skeleton; replace with real fetch in Phase 2
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  // Keep drafts synced
  useEffect(() => {
    setDraftName(profile.name);
    setDraftPlatforms(profile.favoritePlatformIds);
    setDraftLeagues(profile.favoriteLeagues);
    setDraftTeams(profile.favoriteTeams);
  }, [profile]);

  // Reset platform when switching genre if platform is not inside genre
  useEffect(() => {
    const visible = platformsForGenre(activeGenre);
    const ok = activePlatform === "all" || visible.includes(activePlatform);
    if (!ok) setActivePlatform("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre]);

  // Viewing history
  const viewing = useMemo(() => (typeof window === "undefined" ? [] : loadViewing()), [openCard]);

  // Ranked For You
  const forYouRanked = useMemo(() => rankForYou(demo.forYou, profile, viewing), [demo.forYou, profile, viewing]);

  // Platform lists
  const visiblePlatformIds = useMemo(() => platformsForGenre(activeGenre), [activeGenre]);
  const visiblePlatforms = useMemo(
    () => visiblePlatformIds.map((id) => platformById(id)).filter(Boolean) as Platform[],
    [visiblePlatformIds]
  );

  // Filtering helpers
  const matchesPlatform = (c: Card) => {
    if (activePlatform === "all") return true;
    return c.platformId === activePlatform;
  };
  const matchesGenre = (c: Card) => {
    if (activeGenre === "All") return true;
    return c.genre ? c.genre === activeGenre : true;
  };
  const matchesLeague = (c: Card) => {
    if (activeLeague === "ALL") return true;
    return normalizeKey(c.league ?? "") === normalizeKey(activeLeague);
  };

  // Section datasets (filtered)
  const forYou = useMemo(() => forYouRanked.filter(matchesGenre).filter(matchesPlatform), [forYouRanked, activeGenre, activePlatform]);
  const liveNow = useMemo(() => demo.liveNow.filter(matchesGenre).filter(matchesPlatform).filter(matchesLeague), [demo.liveNow, activeGenre, activePlatform, activeLeague]);
  const continueWatching = useMemo(() => demo.continueWatching.filter(matchesGenre).filter(matchesPlatform), [demo.continueWatching, activeGenre, activePlatform]);
  const trending = useMemo(() => demo.trending.filter(matchesGenre).filter(matchesPlatform), [demo.trending, activeGenre, activePlatform]);

  const blackMediaCards = useMemo(() => demo.blackMediaCards.filter(matchesGenre).filter(matchesPlatform), [demo.blackMediaCards, activeGenre, activePlatform]);

  // Search dataset
  const allSearchCards = useMemo(() => uniqByCardKey([...demo.forYou, ...demo.liveNow, ...demo.continueWatching, ...demo.trending, ...demo.blackMediaCards]), [demo]);
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = allSearchCards.filter(matchesGenre).filter(matchesPlatform);
    if (!q) return base.slice(0, 36);
    return base
      .filter((c) => `${c.title} ${c.subtitle ?? ""} ${c.platformLabel ?? ""} ${c.league ?? ""} ${c.genre ?? ""}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [searchQuery, allSearchCards, activeGenre, activePlatform]);

  // “See all” modal dataset
  const seeAllItems = useMemo(() => {
    if (!openSeeAll) return [];
    if (openSeeAll === "for-you") return forYou;
    if (openSeeAll === "live-now") return liveNow;
    if (openSeeAll === "continue") return activeTab === "favs" ? blackMediaCards : continueWatching;
    if (openSeeAll === "trending") return activeTab === "search" ? searchResults : trending;
    return [];
  }, [openSeeAll, forYou, liveNow, continueWatching, trending, activeTab, blackMediaCards, searchResults]);

  // Actions
  const openCardAndLog = (c: Card) => {
    logViewing(c);
    setOpenCard(c);
  };

  const toggleConnected = (pid: PlatformId) => {
    setProfile((prev) => {
      const next: ProfileState = {
        ...prev,
        connectedPlatformIds: { ...prev.connectedPlatformIds, [pid]: !prev.connectedPlatformIds?.[pid] },
      };
      saveProfile(next);
      track("connected_toggle", { platformId: pid, on: !!next.connectedPlatformIds[pid] });
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
    track("handoff_open", { platformId: pid, title: card.title, url });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const subscribeProvider = (card: Card) => {
    if (typeof window === "undefined") return;
    const pid = card.platformId ?? platformIdFromLabel(card.platformLabel ?? "") ?? null;
    const url = providerUrlSubscribe(pid);
    track("handoff_subscribe", { platformId: pid, url });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Avatar + header image upload
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const headerInputRef = useRef<HTMLInputElement | null>(null);

  const avatarSources = profile.profilePhoto ? [profile.profilePhoto] : [...brandMarkCandidates()];
  const headerBg = profile.headerPhoto
    ? `linear-gradient(135deg, rgba(0,0,0,0.62), rgba(0,0,0,0.82)), url(${profile.headerPhoto}) center/cover no-repeat`
    : "linear-gradient(135deg, #050505 0%, #151515 55%, #070707 100%)";

  // Global “show back” (modal navigation)
  const showBack = !!openCard || !!openSeeAll || openVoice || openRemote || openFavorites || openNotifications || openConnect || openSetup || openAbout || openProfileSettings;
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
  };

  // -------------------- Render --------------------

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #050505 0%, #161616 55%, #070707 100%)",
        color: "white",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      {/* Global styles for focus + reduced motion */}
      <style>{`
        .ampere-focus:focus-visible {
          outline: 2px solid rgba(255,255,255,0.85);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.55);
        }
        @media (prefers-reduced-motion: reduce) {
          * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
        }
      `}</style>

      {/* Hidden file inputs */}
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

      {/* HEADER (locked) */}
      <header
        style={{
          padding: density.pad,
          background: headerBg,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          style={{
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.35)",
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
                onClick={onBack}
                className="ampere-focus"
                aria-label="Back"
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
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
              <SmartImg sources={brandMarkCandidates()} size={isMobile ? 44 : 52} rounded={18} border={false} fit="contain" />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ opacity: 0.92, fontWeight: 950, fontSize: isMobile ? 14 : 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                CONTROL, REIMAGINED.
              </div>
              <div style={{ opacity: 0.70, fontWeight: 900, fontSize: density.small, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Profile: <span style={{ color: "white", opacity: 0.92 }}>{profile.name}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <PillButton label="Voice" iconNode={<IconMic />} onClick={() => setOpenVoice(true)} ariaLabel="Voice" />
            <PillButton label="Remote" iconNode={<IconRemote />} onClick={() => setOpenRemote(true)} ariaLabel="Remote" />

            <Dropdown label="Settings" iconLeft={<IconGear />}>
              <MenuItem title="Favorites" subtitle="Edit favorite platforms / leagues / teams" onClick={() => setOpenFavorites(true)} right="›" />
              <MenuItem title="Notifications" subtitle="Enable alerts when favorite teams play" onClick={() => setOpenNotifications(true)} right="›" />
              <MenuItem title="Connect Platforms" subtitle="Mark platforms as connected (demo flag)" onClick={() => setOpenConnect(true)} right="›" />
              <MenuItem title="Change Header Image" subtitle="Upload a header background" onClick={() => headerInputRef.current?.click()} right="⬆" />
            </Dropdown>

            <Dropdown
              label="Profile"
              iconLeft={
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <SmartImg sources={avatarSources} size={22} rounded={9} border={true} fit="cover" />
                </span>
              }
            >
              <MenuItem title="Profile Settings" subtitle="Name, avatar, header image" onClick={() => setOpenProfileSettings(true)} right="›" />
              <MenuItem
                title="Set-Up Wizard"
                subtitle="Re-run onboarding choices"
                onClick={() => {
                  setOpenSetup(true);
                  setSetupStep(1);
                }}
                right="›"
              />
              <MenuItem title="About AMPÈRE" subtitle="Backstory + inventors + tech stack map" onClick={() => setOpenAbout(true)} right="›" />
              <MenuItem title="Change Photo" subtitle="Upload a profile picture" onClick={() => avatarInputRef.current?.click()} right="⬆" />
            </Dropdown>
          </div>
        </div>
      </header>

      {/* MAIN (scrollable vertical; no horizontal preview scrollbars) */}
      <main
        style={{
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: density.pad,
          display: "grid",
          gap: density.gap,
        }}
      >
        {/* Filters panel (wrap; no horizontal scrolling) */}
        <div
          style={{
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: density.h2, fontWeight: 950 }}>Filters</div>
            <div style={{ opacity: 0.7, fontWeight: 900, fontSize: density.small }}>
              Genre: <span style={{ opacity: 0.95 }}>{activeGenre}</span> • Platform:{" "}
              <span style={{ opacity: 0.95 }}>{platformById(activePlatform)?.label ?? "ALL"}</span>
            </div>
          </div>

          {/* GENRE */}
          <Section title="Genre" rightText="See all" onRightClick={() => setOpenSeeAll("genres")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
              {GENRES.map((g) => (
                <PillButton
                  key={g.key}
                  label={g.key}
                  active={activeGenre === g.key}
                  onClick={() => setActiveGenre(g.key)}
                  fullWidth
                />
              ))}
            </div>
          </Section>

          {/* STREAMING PLATFORM */}
          <Section title="Streaming Platform" rightText="See all" onRightClick={() => setOpenSeeAll("platforms")}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {visiblePlatforms.map((p) => (
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
            </div>

            {/* Bonus “All Platforms” preview to satisfy “true demo” */}
            <div style={{ marginTop: 12, opacity: 0.85, fontWeight: 950, fontSize: 14 }}>All Platforms Preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
              {ALL_PLATFORM_IDS.slice(0, 20).map((pid) => (
                <PillButton
                  key={`all_${pid}`}
                  label={platformById(pid)?.label ?? pid}
                  iconSources={platformIconCandidates(pid)}
                  active={activePlatform === pid}
                  onClick={() => setActivePlatform(pid)}
                  fullWidth
                  multiline
                />
              ))}
            </div>
          </Section>

          {/* LIVE league filter only when Live tab */}
          {activeTab === "live" ? (
            <Section title="League">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                {LEAGUES.map((l) => (
                  <PillButton
                    key={l}
                    label={l}
                    active={normalizeKey(activeLeague) === normalizeKey(l)}
                    onClick={() => setActiveLeague(l)}
                    fullWidth
                  />
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        {/* Screen title */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: density.h1, fontWeight: 950 }}>
            {activeTab === "home" ? "Home" : activeTab === "live" ? "Live" : activeTab === "favs" ? "Favs" : "Search"}
          </div>

          {/* Search controls only on Search tab */}
          {activeTab === "search" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
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
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  outline: "none",
                  fontWeight: 850,
                  minWidth: 240,
                }}
              />
              <button
                onClick={submitSearch}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.10)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Search
              </button>
              <button
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
            </div>
          ) : null}
        </div>

        {/* CONTENT SECTIONS (grid; no horizontal sliders) */}
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
            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.filter((c) => c.genre === "Premium Sports Streaming").slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueWatching.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
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

            <Section title="Black Media Preview" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={blackMediaCards} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="For You" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYou.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}

        {activeTab === "search" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title={searchQuery ? `Results for “${searchQuery}”` : "Search Preview"} rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={searchResults} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending (search context)" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="For You" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYou.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}
      </main>

      {/* FOOTER (locked nav) */}
      <footer style={{ padding: density.pad, borderTop: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)" }}>
        <div
          style={{
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <PillButton label="HOME" active={activeTab === "home"} onClick={() => setActiveTab("home")} fullWidth ariaLabel="Home tab" />
          <PillButton label="LIVE" active={activeTab === "live"} onClick={() => setActiveTab("live")} fullWidth ariaLabel="Live tab" />
          <PillButton label="FAVS" active={activeTab === "favs"} onClick={() => setActiveTab("favs")} fullWidth ariaLabel="Favorites tab" />
          <PillButton label="SEARCH" active={activeTab === "search"} onClick={() => setActiveTab("search")} fullWidth ariaLabel="Search tab" />
        </div>
      </footer>

      {/* -------------------- MODALS -------------------- */}

      {/* See All (cards) */}
      <Modal
        open={!!openSeeAll && !["genres", "platforms"].includes(openSeeAll ?? "")}
        title={
          openSeeAll === "for-you"
            ? "See All — For You"
            : openSeeAll === "live-now"
              ? "See All — Live Now"
              : openSeeAll === "continue"
                ? "See All — Continue"
                : "See All — Trending"
        }
        onClose={() => setOpenSeeAll(null)}
      >
        <CardGrid cards={seeAllItems} cardMinW={density.cardMinW} heroH={Math.max(100, density.heroH + 12)} onOpen={openCardAndLog} />
      </Modal>

      {/* See All — Genres */}
      <Modal open={openSeeAll === "genres"} title="See All — Genres" onClose={() => setOpenSeeAll(null)} maxWidth={980}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.8, fontWeight: 900 }}>Tap a genre to filter the whole app.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
            {GENRES.map((g) => (
              <PillButton
                key={g.key}
                label={g.key}
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

      {/* See All — Platforms */}
      <Modal open={openSeeAll === "platforms"} title="See All — Streaming Platforms" onClose={() => setOpenSeeAll(null)} maxWidth={980}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.8, fontWeight: 900 }}>
            Showing platforms for <span style={{ color: "white" }}>{activeGenre}</span>.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {visiblePlatforms.map((p) => (
              <PillButton
                key={p.id}
                label={p.label}
                iconSources={platformIconCandidates(p.id)}
                active={activePlatform === p.id}
                onClick={() => {
                  setActivePlatform(p.id);
                  setOpenSeeAll(null);
                }}
                fullWidth
                multiline
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Remote */}
      <Modal open={openRemote} title="Remote Preview" onClose={() => setOpenRemote(false)} maxWidth={860}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 950 }}>
          Active platform: <span style={{ opacity: 0.95 }}>{platformById(activePlatform)?.label ?? "ALL"}</span>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {["⏪ Back", "⏯ Play/Pause", "⏩ Forward", "⬆ Up", "OK", "⬇ Down", "⬅ Left", "Home", "➡ Right"].map((b) => (
            <button
              key={b}
              className="ampere-focus"
              style={{
                padding: "14px 12px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
              onClick={() => track("remote_click", { button: b })}
            >
              {b}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, opacity: 0.7, fontWeight: 900 }}>(Phase 3) Map these to real devices / deep links / casting.</div>
      </Modal>

      {/* Voice */}
      <Modal open={openVoice} title="Voice Command (Demo)" onClose={() => setOpenVoice(false)} maxWidth={860}>
        <div style={{ color: "rgba(255,255,255,0.88)", fontWeight: 900, lineHeight: 1.8 }}>
          <div style={{ opacity: 0.9 }}>
            Voice is demo-only in this build. (Phase 3: command palette + confirmations + device mapping)
          </div>
          <div style={{ marginTop: 12, opacity: 0.85 }}>Suggested commands:</div>
          <ul style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.9 }}>
            <li>“Go Home”</li>
            <li>“Open Live”</li>
            <li>“Search Netflix”</li>
            <li>“Show NBA”</li>
          </ul>
        </div>
      </Modal>

      {/* Favorites */}
      <Modal open={openFavorites} title="Favorites" onClose={() => setOpenFavorites(false)} maxWidth={980}>
        <div style={{ display: "grid", gap: 14, color: "rgba(255,255,255,0.92)", fontWeight: 900 }}>
          <div style={{ opacity: 0.8 }}>
            Favorites are stored locally (demo) and influence “For You”.
          </div>

          <div>
            <div style={{ fontWeight: 950, marginBottom: 8, opacity: 0.9 }}>Favorite Streaming Platforms</div>
            <PillGridMultiPlatform
              items={ALL_PLATFORM_IDS}
              selected={profile.favoritePlatformIds}
              onChange={(next) => {
                setProfile((prev) => {
                  const p = { ...prev, favoritePlatformIds: next };
                  saveProfile(p);
                  track("fav_platforms_update", { next });
                  return p;
                });
              }}
            />
          </div>

          <div>
            <div style={{ fontWeight: 950, marginBottom: 8, opacity: 0.9 }}>Favorite Leagues</div>
            <PillGridMultiText
              items={LEAGUES.filter((l) => l !== "ALL") as any}
              selected={profile.favoriteLeagues}
              iconFor={(l) => leagueLogoCandidates(l)}
              onChange={(next) => {
                setProfile((prev) => {
                  const p = { ...prev, favoriteLeagues: next };
                  saveProfile(p);
                  track("fav_leagues_update", { next });
                  return p;
                });
              }}
            />
          </div>

          <div>
            <div style={{ fontWeight: 950, marginBottom: 8, opacity: 0.9 }}>Favorite Teams</div>
            <TeamPickerByLeague
              leagues={profile.favoriteLeagues}
              selectedTeams={profile.favoriteTeams}
              onChange={(nextTeams) => {
                setProfile((prev) => {
                  const p = { ...prev, favoriteTeams: nextTeams };
                  saveProfile(p);
                  track("fav_teams_update", { nextTeams });
                  return p;
                });
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Notifications */}
      <Modal open={openNotifications} title="Notifications" onClose={() => setOpenNotifications(false)} maxWidth={860}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, lineHeight: 1.7 }}>
          <div style={{ opacity: 0.85, marginBottom: 12 }}>
            Demo: stores your preference + teams. Phase 3 adds real scheduling + push notifications.
          </div>

          <MenuItem
            title={profile.notificationsEnabled ? "Notifications: ON" : "Notifications: OFF"}
            subtitle="When a favorite team plays (future push integration)"
            onClick={() => {
              setProfile((prev) => {
                const next = { ...prev, notificationsEnabled: !prev.notificationsEnabled };
                saveProfile(next);
                track("notifications_toggle", { on: next.notificationsEnabled });
                return next;
              });
            }}
            right={profile.notificationsEnabled ? "✓" : "—"}
          />

          <div style={{ marginTop: 12, opacity: 0.75, fontWeight: 900 }}>
            Teams tracked: <span style={{ color: "white" }}>{profile.favoriteTeams.join(", ") || "None"}</span>
          </div>
        </div>
      </Modal>

      {/* Connect Platforms */}
      <Modal open={openConnect} title="Connect Platforms (Demo Flags)" onClose={() => setOpenConnect(false)} maxWidth={980}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, lineHeight: 1.7 }}>
          <div style={{ opacity: 0.85, marginBottom: 10 }}>
            Demo behavior: we store only a Connected yes/no flag. Phase 2 adds OAuth/device-link + verification.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {platformsForGenre("All")
              .filter((pid) => pid !== "all" && pid !== "blackmedia")
              .map((pid) => {
                const p = platformById(pid);
                const connected = !!profile.connectedPlatformIds?.[pid];
                return (
                  <button
                    key={pid}
                    onClick={() => toggleConnected(pid)}
                    className="ampere-focus"
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: connected ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
                      padding: 14,
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      justifyContent: "space-between",
                      fontWeight: 950,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <SmartImg sources={platformIconCandidates(pid)} size={26} rounded={10} fit="contain" />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p?.label ?? pid}</span>
                    </div>
                    <span style={{ opacity: 0.85 }}>{connected ? "Connected" : "Connect"}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* Profile Settings */}
      <Modal open={openProfileSettings} title="Profile Settings" onClose={() => setOpenProfileSettings(false)} maxWidth={860}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, lineHeight: 1.7 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <SmartImg sources={avatarSources} size={72} rounded={22} border={true} fit="cover" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{profile.name}</div>
              <div style={{ opacity: 0.75, fontWeight: 900, fontSize: 13 }}>
                Favorites: {profile.favoritePlatformIds.length} platforms • {profile.favoriteLeagues.length} leagues • {profile.favoriteTeams.length} teams
              </div>
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              className="ampere-focus"
              style={{
                marginLeft: "auto",
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Change Photo
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ opacity: 0.85, marginBottom: 10 }}>Name</div>
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => {
                  const next = { ...prev, name: e.target.value };
                  saveProfile(next);
                  return next;
                })
              }
              className="ampere-focus"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.35)",
                color: "white",
                outline: "none",
                fontWeight: 850,
              }}
              placeholder="Your name"
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ opacity: 0.85, marginBottom: 10 }}>Header Image</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => headerInputRef.current?.click()}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Upload Header Image
              </button>
              <button
                onClick={() => {
                  setProfile((prev) => {
                    const next = { ...prev, headerPhoto: null };
                    saveProfile(next);
                    track("header_image_clear", {});
                    return next;
                  });
                }}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Clear Header Image
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, opacity: 0.72, fontWeight: 900 }}>
            “For You” uses favorites + viewing habits (local history) to rank content.
          </div>
        </div>
      </Modal>

      {/* Setup Wizard */}
      <Modal open={openSetup} title={`Set-Up Wizard — Step ${setupStep}/5`} onClose={() => setOpenSetup(false)} maxWidth={980}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, lineHeight: 1.7 }}>
          {setupStep === 1 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 8 }}>Create your profile</div>
              <div style={{ opacity: 0.85, marginBottom: 10 }}>Name</div>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="ampere-focus"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  outline: "none",
                  fontWeight: 850,
                }}
                placeholder="Your name"
              />
            </>
          ) : null}

          {setupStep === 2 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 8 }}>Select Streaming Platforms</div>
              <div style={{ opacity: 0.75, marginBottom: 10 }}>Tap to toggle</div>

              <PillGridMultiPlatform items={ALL_PLATFORM_IDS} selected={draftPlatforms} onChange={setDraftPlatforms} />
            </>
          ) : null}

          {setupStep === 3 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 8 }}>Pick leagues</div>
              <div style={{ opacity: 0.75, marginBottom: 10 }}>Tap to toggle</div>

              <PillGridMultiText
                items={LEAGUES.filter((l) => l !== "ALL") as any}
                selected={draftLeagues}
                iconFor={(l) => leagueLogoCandidates(l)}
                onChange={setDraftLeagues}
              />
            </>
          ) : null}

          {setupStep === 4 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 8 }}>Pick teams (for notifications)</div>
              <div style={{ opacity: 0.75, marginBottom: 10 }}>Teams shown based on the leagues you selected.</div>

              <TeamPickerByLeague leagues={draftLeagues} selectedTeams={draftTeams} onChange={setDraftTeams} />
            </>
          ) : null}

          {setupStep === 5 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 950, marginBottom: 8 }}>Finish</div>
              <div style={{ opacity: 0.85 }}>
                Profile: <span style={{ color: "white" }}>{draftName || "User"}</span>
              </div>
              <div style={{ opacity: 0.85, marginTop: 8 }}>
                Platforms:{" "}
                <span style={{ color: "white" }}>
                  {draftPlatforms.map((pid) => platformById(pid)?.label ?? pid).join(", ") || "None"}
                </span>
              </div>
              <div style={{ opacity: 0.85, marginTop: 8 }}>
                Leagues: <span style={{ color: "white" }}>{draftLeagues.join(", ") || "None"}</span>
              </div>
              <div style={{ opacity: 0.85, marginTop: 8 }}>
                Teams: <span style={{ color: "white" }}>{draftTeams.join(", ") || "None"}</span>
              </div>
              <div style={{ marginTop: 12, opacity: 0.75 }}>
                Stored locally for demo. Phase 2: accounts + DB sync across devices.
              </div>
            </>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => setSetupStep((s) => (s > 1 ? ((s - 1) as any) : s))}
              className="ampere-focus"
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Back
            </button>

            {setupStep < 5 ? (
              <button
                onClick={() => setSetupStep((s) => (s < 5 ? ((s + 1) as any) : s))}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                  const next: ProfileState = {
                    ...profile,
                    name: draftName.trim() || "User",
                    favoritePlatformIds: [...draftPlatforms],
                    favoriteLeagues: [...draftLeagues],
                    favoriteTeams: [...draftTeams],
                  };
                  setProfile(next);
                  saveProfile(next);
                  track("wizard_save", { name: next.name, platforms: next.favoritePlatformIds, leagues: next.favoriteLeagues, teams: next.favoriteTeams });
                  setOpenSetup(false);
                  setSetupStep(1);
                }}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.14)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            )}

            <button
              onClick={() => {
                setOpenSetup(false);
                setSetupStep(1);
              }}
              className="ampere-focus"
              style={{
                marginLeft: "auto",
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.20)",
                color: "rgba(255,255,255,0.88)",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* About AMPÈRE (text only; no portraits/images) */}
      <Modal open={openAbout} title="About AMPÈRE" onClose={() => setOpenAbout(false)} maxWidth={1020}>
        <div style={{ display: "grid", gap: 14, color: "rgba(255,255,255,0.9)", fontWeight: 900, lineHeight: 1.7 }}>
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              padding: 14,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950 }}>The Backstory</div>
            <div style={{ opacity: 0.85, marginTop: 10 }}>
              AMPÈRE is named after the force that made modern control possible — the invisible current that turns intention into action.
            </div>

            <div style={{ fontSize: 16, fontWeight: 950, marginTop: 14 }}>Who Ampère Was</div>
            <div style={{ opacity: 0.9, marginTop: 8 }}>
              <span style={{ fontWeight: 950 }}>André-Marie Ampère (1775–1836)</span> helped establish the foundations of electrodynamics.
              His work formalized how electric currents produce magnetic forces — the basis of motors, relays, signals, and modern control systems.
            </div>
            <ul style={{ marginTop: 10, paddingLeft: 18, opacity: 0.88 }}>
              <li>Developed core laws describing electromagnetism</li>
              <li>Showed how current can create force at a distance</li>
              <li>Helped enable: electric signals → automation → wireless control → modern electronics</li>
            </ul>
            <div style={{ marginTop: 10, opacity: 0.9 }}>
              The ampere (amp) — the unit of electric current — is named after him.
            </div>
            <div style={{ marginTop: 8, opacity: 0.85 }}>
              <em>Without Ampère, remote control as a concept does not exist.</em>
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              padding: 14,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 950 }}>Black innovation as control infrastructure</div>
            <div style={{ opacity: 0.85, marginTop: 8 }}>
              <em>“Builders of the control infrastructure that modern wireless life depends on.”</em>
            </div>

            <div style={{ marginTop: 12, fontWeight: 950 }}>Wireless → Control → IoT / Smart Devices</div>
            <div style={{ opacity: 0.88, marginTop: 10 }}>
              This mapping shows where foundational work lives inside today’s technology stack (not symbolic credit):
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <StackBlock
                title="A. Wireless Communication & Signaling Layer"
                subtitle="(Precursor to remote control, radio, IoT connectivity)"
                person="Granville T. Woods (1856–1910) — Scientist & Inventor"
                role={["Wireless signaling between moving objects (trains)", "Collision avoidance via communication"]}
                descendants={["Wireless telemetry", "Radio-based control systems", "Vehicle-to-infrastructure (V2I) communication", "Foundations of remote signaling logic"]}
                why="Remote control requires reliable signal transmission + interpretation. Woods solved that problem in hostile, moving environments."
              />

              <StackBlock
                title="B. Control Systems & Automation Layer"
                subtitle="(Devices that change state without physical presence)"
                person="Garrett Morgan (1877–1963) — Inventor"
                role={["Automated traffic control logic", "Multi-state system behavior (stop / warn / go)"]}
                descendants={["Control logic in remotes", "State machines in software", "Automation rules in smart devices"]}
                why="Remote control is meaningless without structured control logic."
              />

              <StackBlock
                title="C. Remote Monitoring & Actuation (Smart Home Core)"
                subtitle="(Functional remote control of physical systems)"
                person="Marie Van Brittan Brown (1922–1999) — Inventor"
                role={["Remote video monitoring", "Remote door unlocking", "Two-way communication"]}
                descendants={["Smart doorbells", "Home security apps", "Remote access systems", "Smartphone-controlled homes"]}
                why="She built remote monitoring + control decades before “IoT” existed."
              />

              <StackBlock
                title="D. Electronic Control Components"
                subtitle="(Invisible but essential)"
                person="Otis Boykin (1920–1982) — Scientist & Inventor"
                role={["Precision electrical control via resistors"]}
                descendants={["Signal regulation in remotes", "Power management in wireless devices", "Control electronics reliability (medical + aerospace)"]}
                why="Remote systems fail without stable, predictable control components."
              />
            </div>

            <div style={{ marginTop: 14, fontWeight: 950 }}>Stack Summary</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8, opacity: 0.9 }}>
              <RowKV left="Wireless signaling" right="Granville T. Woods — Moving wireless communication" />
              <RowKV left="Control logic" right="Garrett Morgan — Automated multi-state control" />
              <RowKV left="Remote systems" right="Marie Van Brittan Brown — Remote monitoring & actuation" />
              <RowKV left="Electronics" right="Otis Boykin — Precision control components" />
            </div>

            <div style={{ marginTop: 14, fontWeight: 950 }}>Timeline (Black scientists/inventors only)</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8, opacity: 0.9 }}>
              <RowKV left="1850s–1900s" right="Granville T. Woods — Wireless induction telegraph → foundation for wireless control & telemetry" />
              <RowKV left="1920s" right="Garrett Morgan — Automated traffic control systems → control logic & safety automation" />
              <RowKV left="1950s–1960s" right="Otis Boykin — Precision resistors → reliability in remote & wireless systems" />
              <RowKV left="1966" right="Marie Van Brittan Brown — Home security system (remote video + door control + two-way audio) → ancestor of smart homes" />
            </div>

            <div style={{ marginTop: 14, opacity: 0.88 }}>
              Resulting impact today: smart locks • home cameras • remote monitoring apps • wireless automation systems
            </div>
          </div>
        </div>
      </Modal>

      {/* Card detail */}
      <Modal open={!!openCard} title={openCard?.title ?? "Details"} onClose={() => setOpenCard(null)} maxWidth={980}>
        {openCard ? (
          <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, lineHeight: 1.8 }}>
            <div>
              <span style={{ opacity: 0.7 }}>Subtitle:</span> <span style={{ color: "white" }}>{openCard.subtitle ?? "-"}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Platform:</span>{" "}
              <span style={{ color: "white" }}>{platformById(openCard.platformId ?? "all")?.label ?? openCard.platformLabel ?? "-"}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>League:</span> <span style={{ color: "white" }}>{openCard.league ?? "-"}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Genre:</span> <span style={{ color: "white" }}>{openCard.genre ?? "-"}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Start:</span> <span style={{ color: "white" }}>{openCard.startTime ?? "-"}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Time remaining:</span> <span style={{ color: "white" }}>{openCard.timeRemaining ?? "-"}</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => openProviderForCard(openCard)}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.10)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <IconPlay /> Open
              </button>

              <button
                onClick={() => subscribeProvider(openCard)}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Subscribe
              </button>

              <button
                onClick={() => setOpenCard(null)}
                className="ampere-focus"
                style={{
                  marginLeft: "auto",
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.20)",
                  color: "rgba(255,255,255,0.88)",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Return to AMPÈRE
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// -------------------- Helper: dedupe cards --------------------

function uniqByCardKey(cards: Card[]) {
  const seen = new Set<string>();
  const out: Card[] = [];
  for (const c of cards) {
    const k = `${normalizeKey(c.title)}|${c.platformId ?? ""}|${normalizeKey(c.league ?? "")}|${normalizeKey(c.genre ?? "")}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

// -------------------- Multi-select grids --------------------

function PillGridMultiPlatform({
  items,
  selected,
  onChange,
}: {
  items: PlatformId[];
  selected: PlatformId[];
  onChange: (next: PlatformId[]) => void;
}) {
  const toggle = (pid: PlatformId) => {
    const on = selected.includes(pid);
    if (on) onChange(selected.filter((x) => x !== pid));
    else onChange([...selected, pid]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
      {items.map((pid) => {
        const p = platformById(pid);
        const on = selected.includes(pid);
        return (
          <PillButton
            key={pid}
            label={p?.label ?? pid}
            iconSources={platformIconCandidates(pid)}
            active={on}
            onClick={() => toggle(pid)}
            fullWidth
            multiline
          />
        );
      })}
    </div>
  );
}

function PillGridMultiText({
  items,
  selected,
  iconFor,
  onChange,
}: {
  items: string[];
  selected: string[];
  iconFor: (x: string) => string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (x: string) => {
    const on = selected.some((s) => normalizeKey(s) === normalizeKey(x));
    if (on) onChange(selected.filter((s) => normalizeKey(s) !== normalizeKey(x)));
    else onChange([...selected, x]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
      {items.map((x) => {
        const on = selected.some((s) => normalizeKey(s) === normalizeKey(x));
        return (
          <PillButton key={x} label={x} iconSources={iconFor(x)} active={on} onClick={() => toggle(x)} fullWidth />
        );
      })}
    </div>
  );
}

// -------------------- Team picker --------------------

function TeamPickerByLeague({
  leagues,
  selectedTeams,
  onChange,
}: {
  leagues: string[];
  selectedTeams: string[];
  onChange: (next: string[]) => void;
}) {
  const [filter, setFilter] = useState("");

  const toggleTeam = (t: string) => {
    const on = selectedTeams.some((x) => normalizeKey(x) === normalizeKey(t));
    if (on) onChange(selectedTeams.filter((x) => normalizeKey(x) !== normalizeKey(t)));
    else onChange([...selectedTeams, t]);
  };

  const leagueBlocks = useMemo(() => {
    const useLeagues = (leagues ?? []).filter(Boolean);
    return useLeagues.map((l) => {
      const key = TEAMS_BY_LEAGUE[l] ? l : l.toUpperCase();
      return { league: l, teams: TEAMS_BY_LEAGUE[key] ?? [] };
    });
  }, [leagues]);

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ opacity: 0.9, fontWeight: 950 }}>Teams</div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter teams…"
          className="ampere-focus"
          style={{
            flex: "1 1 240px",
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
            fontWeight: 850,
          }}
        />
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {leagueBlocks.length ? (
          leagueBlocks.map((b) => (
            <div key={b.league} style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 950, opacity: 0.9 }}>{b.league}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {(b.teams ?? [])
                  .filter((t) => (filter.trim() ? t.toLowerCase().includes(filter.trim().toLowerCase()) : true))
                  .map((t) => {
                    const on = selectedTeams.some((x) => normalizeKey(x) === normalizeKey(t));
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTeam(t)}
                        className="ampere-focus"
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: on ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.25)",
                          color: "white",
                          fontWeight: 950,
                          cursor: "pointer",
                        }}
                        title={on ? "Selected" : "Select"}
                      >
                        {t} <span style={{ opacity: 0.7 }}>{on ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                {!b.teams?.length ? <div style={{ opacity: 0.75, fontWeight: 900 }}>No team list configured for this league yet.</div> : null}
              </div>
            </div>
          ))
        ) : (
          <div style={{ opacity: 0.75, fontWeight: 900 }}>Select leagues first to see teams.</div>
        )}
      </div>

      <div style={{ marginTop: 12, opacity: 0.75, fontWeight: 900 }}>
        Selected: <span style={{ color: "white" }}>{selectedTeams.join(", ") || "None"}</span>
      </div>
    </div>
  );
}


