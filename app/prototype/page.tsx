/* =========================
   AMPÈRE — Updated Demo App
   PART 1/5
   ========================= */
"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

/**
 * Implemented in this update (Phase 1):
 * - Dropdown readability + ESC close
 * - Remove “All Platforms Preview”
 * - Remove ALL pills in Browse + Platforms (Reset returns to All)
 * - Rename Genre -> Browse, Streaming Platform -> Platforms
 * - Add Browse: Kids, Gaming, LiveTV
 * - Footer icons
 * - Fix Wizard Step 1 input losing focus (Modal effect no longer re-runs every keystroke)
 * - Load-more in heavy See All modals (later parts)
 * - Cap FAILED_IMG growth
 *
 * Notes:
 * - Still dependency-free, single-file.
 * - Phase 2 splits into /components + /lib and adds Supabase auth/data.
 */

// -------------------- Types --------------------

type TabKey = "home" | "live" | "favs" | "search";

type GenreKey =
  | "All"
  | "LiveTV"
  | "Kids"
  | "Gaming"
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
  badgeRight?: string;
  platformId?: PlatformId;
  platformLabel?: string;
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
  profilePhoto?: string | null;
  headerPhoto?: string | null;
  favoritePlatformIds: PlatformId[];
  favoriteLeagues: string[];
  favoriteTeams: string[];

  // demo flag
  connectedPlatformIds: Partial<Record<PlatformId, boolean>>;

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

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

// -------------------- Viewport / density --------------------

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function useViewport() {
  const [vp, setVp] = useState<{ w: number; h: number; ready: boolean }>({
    w: 0,
    h: 0,
    ready: false,
  });

  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const on = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight, ready: true });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const isMobile = vp.ready ? vp.w < 720 : false;
  const isTablet = vp.ready ? vp.w >= 720 && vp.w < 1080 : false;

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
      icon: isMobile ? 22 : 24,
    };
  }, [isMobile, isTablet]);

  return { w: vp.w, h: vp.h, ready: vp.ready, isMobile, isTablet, density };
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
  | "hbcugosports"
  // Kids collection (channels/apps)
  | "pbskids"
  | "noggin"
  | "kidoodletv"
  | "happykids"
  | "sensical"
  | "kabillion"
  | "toongoggles"
  | "yippee";

type Platform = {
  id: PlatformId;
  label: string;
  kind?: "platform" | "bundle" | "channel";
};

const PLATFORMS: Platform[] = [
  // Internal sentinels (NOT shown as pills in Platforms)
  { id: "all", label: "ALL", kind: "bundle" },
  { id: "livetv", label: "Live TV", kind: "bundle" },

  // Core
  { id: "netflix", label: "Netflix", kind: "platform" },
  { id: "hulu", label: "Hulu", kind: "platform" },
  { id: "primevideo", label: "Prime Video", kind: "platform" },
  { id: "disneyplus", label: "Disney+", kind: "platform" },
  { id: "max", label: "Max", kind: "platform" },
  { id: "peacock", label: "Peacock", kind: "platform" },
  { id: "paramountplus", label: "Paramount+", kind: "platform" },
  { id: "appletv", label: "Apple TV", kind: "platform" },
  { id: "youtube", label: "YouTube", kind: "platform" },
  { id: "youtubetv", label: "YouTube TV", kind: "platform" },
  { id: "betplus", label: "BET+", kind: "platform" },
  { id: "tubi", label: "Tubi", kind: "platform" },
  { id: "sling", label: "Sling", kind: "platform" },
  { id: "fubotv", label: "FuboTV", kind: "platform" },
  { id: "twitch", label: "Twitch", kind: "platform" },
  { id: "espn", label: "ESPN", kind: "platform" },

  // Extended
  { id: "espnplus", label: "ESPN+", kind: "platform" },
  { id: "dazn", label: "DAZN", kind: "platform" },
  { id: "nflplus", label: "NFL+", kind: "platform" },
  { id: "nbaleaguepass", label: "NBA League Pass", kind: "platform" },
  { id: "mlbtv", label: "MLB.TV", kind: "platform" },
  { id: "nhl", label: "NHL", kind: "platform" },
  { id: "amcplus", label: "AMC+", kind: "platform" },
  { id: "starz", label: "Starz", kind: "platform" },
  { id: "mgmplus", label: "MGM+", kind: "platform" },
  { id: "criterion", label: "The Criterion Channel", kind: "platform" },
  { id: "mubi", label: "MUBI", kind: "platform" },
  { id: "vudu", label: "Fandango at Home (Vudu)", kind: "platform" },
  { id: "appletvstore", label: "Apple TV Store", kind: "platform" },
  { id: "youtubemovies", label: "YouTube Movies / Google TV", kind: "platform" },
  { id: "moviesanywhere", label: "Movies Anywhere", kind: "platform" },
  { id: "plutotv", label: "Pluto TV", kind: "platform" },
  { id: "roku", label: "The Roku Channel", kind: "platform" },
  { id: "freevee", label: "Amazon Freevee", kind: "platform" },
  { id: "xumo", label: "Xumo Play", kind: "platform" },
  { id: "plex", label: "Plex", kind: "platform" },
  { id: "crackle", label: "Crackle", kind: "platform" },
  { id: "revry", label: "Revry", kind: "platform" },
  { id: "ovid", label: "OVID.tv", kind: "platform" },
  { id: "fandor", label: "Fandor", kind: "platform" },
  { id: "kinocult", label: "Kino Cult", kind: "platform" },
  { id: "kanopy", label: "Kanopy", kind: "platform" },
  { id: "shudder", label: "Shudder", kind: "platform" },
  { id: "screambox", label: "Screambox", kind: "platform" },
  { id: "arrow", label: "Arrow Player", kind: "platform" },
  { id: "curiositystream", label: "CuriosityStream", kind: "platform" },
  { id: "magellantv", label: "MagellanTV", kind: "platform" },
  { id: "pbspassport", label: "PBS Passport", kind: "platform" },
  { id: "crunchyroll", label: "Crunchyroll", kind: "platform" },
  { id: "hidive", label: "HIDIVE", kind: "platform" },
  { id: "viki", label: "Viki", kind: "platform" },
  { id: "iqiyi", label: "iQIYI", kind: "platform" },
  { id: "asiancrush", label: "AsianCrush", kind: "platform" },

  // Black culture & diaspora
  { id: "kwelitv", label: "KweliTV", kind: "platform" },
  { id: "mansa", label: "MANSA", kind: "platform" },
  { id: "allblk", label: "ALLBLK", kind: "platform" },
  { id: "brownsugar", label: "Brown Sugar", kind: "platform" },
  { id: "americanu", label: "America Nu", kind: "platform" },
  { id: "afrolandtv", label: "AfroLandTV", kind: "platform" },
  { id: "urbanflixtv", label: "UrbanFlixTV", kind: "platform" },
  { id: "blackstarnetwork", label: "Black Star Network", kind: "platform" },
  { id: "umc", label: "UMC (Urban Movie Channel)", kind: "platform" },

  // Umbrella / HBCU
  { id: "blackmedia", label: "Black Media", kind: "bundle" },
  { id: "hbcugo", label: "HBCUGO", kind: "platform" },
  { id: "hbcugosports", label: "HBCUGO Sports", kind: "platform" },

  // Kids collection (mix of popular + not-so-popular)
  { id: "pbskids", label: "PBS Kids", kind: "channel" },
  { id: "noggin", label: "Noggin", kind: "channel" },
  { id: "kidoodletv", label: "Kidoodle.TV", kind: "channel" },
  { id: "happykids", label: "HappyKids", kind: "channel" },
  { id: "sensical", label: "Sensical", kind: "channel" },
  { id: "kabillion", label: "Kabillion", kind: "channel" },
  { id: "toongoggles", label: "Toon Goggles", kind: "channel" },
  { id: "yippee", label: "Yippee TV", kind: "channel" },
];

function platformById(id: PlatformId) {
  return PLATFORMS.find((p) => p.id === id);
}

function platformIdFromLabel(label: string): PlatformId | null {
  const k = normalizeKey(label);
  const hit = PLATFORMS.find((p) => normalizeKey(p.label) === k);
  return hit?.id ?? null;
}

/* ===== END PART 1/5 ===== */
/* =========================
   AMPÈRE — Updated Demo App
   PART 2/5
   ========================= */

// -------------------- Browse (Genres) -> platform membership --------------------

// We keep "All" as the internal default state,
// but we will NOT render an "ALL" pill in the Browse UI (handled in Part 4).

const KIDS_COLLECTION_GROUPS: { key: string; platformIds: PlatformId[] }[] = [
  {
    key: "Popular Kids",
    platformIds: ["disneyplus", "netflix", "paramountplus", "pbskids", "noggin"],
  },
  {
    key: "Free Kids",
    platformIds: ["kidoodletv", "happykids", "sensical", "kabillion", "toongoggles", "youtube"],
  },
  {
    key: "Educational",
    platformIds: ["pbskids", "sensical", "youtube", "curiositystream"],
  },
  {
    key: "Faith & Family",
    platformIds: ["yippee"],
  },
];

const GENRES: { key: GenreKey; platformIds: PlatformId[] }[] = [
  // Internal “All” (default filter state)
  {
    key: "All",
    platformIds: [
      // Keep this “curated” so the main Platforms grid doesn’t become enormous.
      // Full list is always available in Favorites/Wizard via ALL_PLATFORM_IDS.
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
      "tubi",
      "sling",
      "fubotv",
      "twitch",
      "espn",
      "blackmedia",
      "hbcugo",
      "hbcugosports",
      // Kids signals
      "pbskids",
      "kidoodletv",
    ],
  },

  // NEW: LiveTV browse lens
  {
    key: "LiveTV",
    platformIds: ["youtubetv", "sling", "fubotv", "espn", "peacock"],
  },

  // NEW: Kids browse lens (includes the curated kids collection + mainstream “has kids” platforms)
  {
    key: "Kids",
    platformIds: uniq([
      "disneyplus",
      "netflix",
      "paramountplus",
      "youtube",
      ...KIDS_COLLECTION_GROUPS.flatMap((g) => g.platformIds),
    ]) as PlatformId[],
  },

  // NEW: Gaming browse lens (puts Twitch where it belongs)
  {
    key: "Gaming",
    platformIds: ["twitch", "youtube"],
  },

  // Existing genres
  {
    key: "Basic Streaming",
    platformIds: ["netflix", "hulu", "primevideo", "disneyplus", "max", "peacock", "paramountplus", "appletv"],
  },
  { key: "Premium Streaming", platformIds: ["betplus", "amcplus", "starz", "mgmplus"] },
  { key: "Premium Sports Streaming", platformIds: ["espnplus", "dazn", "nflplus", "nbaleaguepass", "mlbtv", "nhl"] },
  { key: "Movie Streaming", platformIds: ["criterion", "mubi", "vudu", "appletvstore", "youtubemovies", "moviesanywhere"] },
  { key: "Free Streaming", platformIds: ["tubi", "plutotv", "roku", "freevee", "xumo", "plex", "crackle", "revry"] },
  { key: "Indie and Arthouse Film", platformIds: ["criterion", "mubi", "ovid", "fandor", "kinocult", "kanopy"] },
  { key: "Horror / Cult", platformIds: ["shudder", "screambox", "arrow"] },
  { key: "Documentaries", platformIds: ["curiositystream", "magellantv", "pbspassport"] },
  { key: "Anime / Asian cinema", platformIds: ["crunchyroll", "hidive", "viki", "iqiyi", "asiancrush"] },
  {
    key: "Black culture & diaspora",
    platformIds: ["kwelitv", "hbcugo", "hbcugosports", "mansa", "allblk", "brownsugar", "americanu", "afrolandtv", "urbanflixtv", "blackstarnetwork", "umc"],
  },
  { key: "LGBT", platformIds: ["revry"] },
];

function platformsForGenre(genre: GenreKey) {
  const found = GENRES.find((g) => g.key === genre);
  return found?.platformIds ?? [];
}

// We exclude these from “Platforms” pills (UI), but they can exist internally.
const PLATFORM_PILL_EXCLUDE = new Set<PlatformId>(["all", "livetv"]);

// Used for Favorites / Wizard platform selection (full catalog, excluding sentinels)
const ALL_PLATFORM_IDS: PlatformId[] = PLATFORMS.map((p) => p.id).filter((id) => !PLATFORM_PILL_EXCLUDE.has(id));

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

  // Kids icons (optional: you can add these files later)
  pbskids: ["/assets/platforms/pbskids.png", "/logos/services/PBSKids.png"],
  noggin: ["/assets/platforms/noggin.png"],
  kidoodletv: ["/assets/platforms/kidoodletv.png"],
  happykids: ["/assets/platforms/happykids.png"],
  sensical: ["/assets/platforms/sensical.png"],
  kabillion: ["/assets/platforms/kabillion.png"],
  toongoggles: ["/assets/platforms/toongoggles.png"],
  yippee: ["/assets/platforms/yippee.png"],
};

function platformIconCandidates(id?: PlatformId): string[] {
  if (!id) return [];
  return PLATFORM_ICON_CANDIDATES[id] ?? [`/logos/services/${id}.png`, `/assets/platforms/${id}.png`];
}

// Browse pill icons (optional overrides)
const BROWSE_ICON_CANDIDATES: Partial<Record<GenreKey, string[]>> = {
  Kids: ["/assets/browse/kids.png"],
  Gaming: ["/assets/browse/gaming.png"],
  LiveTV: ["/assets/browse/livetv.png"],
};

// Footer icons (optional overrides)
const FOOTER_ICON_CANDIDATES: Partial<Record<TabKey, string[]>> = {
  home: ["/assets/icons/footer/home.png"],
  live: ["/assets/icons/footer/live.png"],
  favs: ["/assets/icons/footer/favs.png"],
  search: ["/assets/icons/footer/search.png"],
};

// -------------------- Inline Icons (fallback if you don’t have image assets yet) --------------------

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5" stroke="white" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.8 10.8V20h10.4v-9.2" stroke="white" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function IconLive() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 12a5 5 0 0 1 10 0" stroke="white" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.5 12a7.5 7.5 0 0 1 15 0" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="white" strokeOpacity="0.9" strokeWidth="2" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.2-9C1 8.2 3.2 5.5 6.3 5.2c1.8-.2 3.5.7 4.5 2 1-1.3 2.7-2.2 4.5-2 3.1.3 5.3 3 3.5 6.8C19 16.4 12 21 12 21Z"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.8 18.2a7.4 7.4 0 1 0 0-14.8 7.4 7.4 0 0 0 0 14.8Z" stroke="white" strokeOpacity="0.85" strokeWidth="2" />
      <path d="M20.5 20.5l-4-4" stroke="white" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// -------------------- SmartImg (capped failure cache + optional fill) --------------------

const FAILED_IMG = new Set<string>();
const FAILED_IMG_QUEUE: string[] = [];
const FAILED_IMG_MAX = 300;

function rememberFailed(src: string) {
  if (!src) return;
  if (FAILED_IMG.has(src)) return;
  FAILED_IMG.add(src);
  FAILED_IMG_QUEUE.push(src);
  if (FAILED_IMG_QUEUE.length > FAILED_IMG_MAX) {
    const oldest = FAILED_IMG_QUEUE.shift();
    if (oldest) FAILED_IMG.delete(oldest);
  }
}

function SmartImg({
  sources,
  alt = "",
  size = 24,
  rounded = 12,
  border = true,
  fit = "cover",
  fill = false,
}: {
  sources: string[];
  alt?: string;
  size?: number;
  rounded?: number;
  border?: boolean;
  fit?: "cover" | "contain";
  fill?: boolean; // if true, image fills parent box
}) {
  const cleaned = useMemo(
    () => sources.filter(Boolean).filter((s) => !FAILED_IMG.has(s)),
    [sources]
  );
  const [idx, setIdx] = useState(0);
  const src = cleaned[idx];

  if (!src) {
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
      width={fill ? undefined : size}
      height={fill ? undefined : size}
      onError={() => {
        rememberFailed(src);
        setIdx((n) => n + 1);
      }}
      style={{
        width: fill ? "100%" : size,
        height: fill ? "100%" : size,
        borderRadius: rounded,
        objectFit: fit,
        display: "block",
        border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
        background: "rgba(255,255,255,0.06)",
      }}
    />
  );
}

/* ===== END PART 2/5 ===== */
/* =========================
   AMPÈRE — Updated Demo App
   PART 3/5
   (Local storage + provider links + full teams + logo placeholders)
   ========================= */

// -------------------- Local storage --------------------

const STORAGE_KEY = "ampere_profile_v4";
const VIEWING_KEY = "ampere_viewing_v3";

// (Optional) small helper for Phase 1 demo: consistent localStorage patterns
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
    favoritePlatformIds: ["netflix", "espn", "blackmedia"],
    favoriteLeagues: ["NFL", "NBA", "NCAAF"],
    favoriteTeams: ["Los Angeles Lakers", "Boston Celtics", "Kansas City Chiefs"],
    connectedPlatformIds: {} as Partial<Record<PlatformId, boolean>>,
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
      : ({} as Partial<Record<PlatformId, boolean>>);

  return {
    ...d,
    ...p,
    favoritePlatformIds,
    favoriteLeagues,
    favoriteTeams,
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
    // cap to last 300
    window.localStorage.setItem(VIEWING_KEY, JSON.stringify(events.slice(-300)));
  } catch {}
}

// -------------------- Provider links (safe allowlist client-side) --------------------

type ProviderLink = {
  openBase: string;
  subscribe?: string;
  search?: (q: string) => string;
};

const PROVIDER_LINKS: Partial<Record<PlatformId, ProviderLink>> = {
  netflix: {
    openBase: "https://www.netflix.com/browse",
    subscribe: "https://www.netflix.com/signup",
    search: (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
  },
  hulu: {
    openBase: "https://www.hulu.com/hub/home",
    subscribe: "https://www.hulu.com/welcome",
    search: (q) => `https://www.hulu.com/search?q=${encodeURIComponent(q)}`,
  },
  primevideo: {
    openBase: "https://www.primevideo.com",
    subscribe: "https://www.primevideo.com",
    search: (q) => `https://www.primevideo.com/search/ref=atv_nb_sug?phrase=${encodeURIComponent(q)}`,
  },
  disneyplus: {
    openBase: "https://www.disneyplus.com/home",
    subscribe: "https://www.disneyplus.com",
    search: (q) => `https://www.disneyplus.com/search/${encodeURIComponent(q)}`,
  },
  max: { openBase: "https://play.max.com", subscribe: "https://www.max.com" },
  peacock: {
    openBase: "https://www.peacocktv.com/watch/home",
    subscribe: "https://www.peacocktv.com/plans/all-monthly",
    search: (q) => `https://www.peacocktv.com/search?q=${encodeURIComponent(q)}`,
  },
  paramountplus: {
    openBase: "https://www.paramountplus.com",
    subscribe: "https://www.paramountplus.com/account/signup/",
    search: (q) => `https://www.paramountplus.com/search/${encodeURIComponent(q)}`,
  },
  youtube: {
    openBase: "https://www.youtube.com",
    subscribe: "https://www.youtube.com/premium",
    search: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  },
  youtubetv: { openBase: "https://tv.youtube.com", subscribe: "https://tv.youtube.com/welcome/" },
  appletv: {
    openBase: "https://tv.apple.com",
    subscribe: "https://tv.apple.com",
    search: (q) => `https://tv.apple.com/search?term=${encodeURIComponent(q)}`,
  },
  espn: {
    openBase: "https://www.espn.com/watch/",
    subscribe: "https://plus.espn.com",
    search: (q) => `https://www.espn.com/search/results?q=${encodeURIComponent(q)}`,
  },
  tubi: { openBase: "https://tubitv.com", subscribe: "https://tubitv.com" },
  twitch: { openBase: "https://www.twitch.tv", search: (q) => `https://www.twitch.tv/search?term=${encodeURIComponent(q)}` },
  sling: { openBase: "https://www.sling.com", subscribe: "https://www.sling.com" },
  fubotv: { openBase: "https://www.fubo.tv/welcome", subscribe: "https://www.fubo.tv/welcome" },

  // Kids (fallbacks; safe + stable)
  pbskids: { openBase: "https://pbskids.org" },
  noggin: { openBase: "https://www.nick.com/apps/noggin", subscribe: "https://www.nick.com/apps/noggin" },
  kidoodletv: { openBase: "https://www.kidoodle.tv" },
  happykids: { openBase: "https://happykids.tv" },
  sensical: { openBase: "https://sensical.tv" },
  kabillion: { openBase: "https://kabillion.com" },
  toongoggles: { openBase: "https://www.toongoggles.com" },
  yippee: { openBase: "https://www.yippee.tv", subscribe: "https://www.yippee.tv" },

  hbcugo: { openBase: "https://hbcugo.tv", subscribe: "https://hbcugo.tv" },
  hbcugosports: { openBase: "https://hbcugo.tv/Sports", subscribe: "https://hbcugo.tv/Sports" },

  // “umbrella” / fallbacks
  blackmedia: { openBase: "https://www.google.com/search?q=black+media+streaming" },
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

// Phase 2 safety pattern: DO NOT log full URLs in prod
function redactUrl(u: string) {
  try {
    const x = new URL(u);
    return `${x.origin}${x.pathname}${x.search ? "?…" : ""}`;
  } catch {
    return u ? "url" : "";
  }
}

// -------------------- Team logo placeholders --------------------

function teamLogoCandidates(league: string, team: string): string[] {
  const l = normalizeKey(league);
  const t = normalizeKey(team);
  // You will add real assets later in these folders (see Part 5 directory plan)
  return [
    `/assets/teams/${l}/${t}.png`,
    `/assets/teams/${l}/${t}.svg`,
    `/logos/teams/${l}/${t}.png`,
  ];
}

// -------------------- Teams by league (Wizard + Notifications) --------------------

const LEAGUES = ["ALL", "NFL", "NBA", "MLB", "NHL", "NCAAF", "Soccer", "UFC", "HBCUGOSPORTS", "HBCUGO"] as const;

// Full team lists (pro leagues complete; NCAAF is curated FBS-ish “starter” list for demo)
// You can expand/replace in Phase 2 with a DB table and official IDs.
const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  NFL: [
    "Arizona Cardinals",
    "Atlanta Falcons",
    "Baltimore Ravens",
    "Buffalo Bills",
    "Carolina Panthers",
    "Chicago Bears",
    "Cincinnati Bengals",
    "Cleveland Browns",
    "Dallas Cowboys",
    "Denver Broncos",
    "Detroit Lions",
    "Green Bay Packers",
    "Houston Texans",
    "Indianapolis Colts",
    "Jacksonville Jaguars",
    "Kansas City Chiefs",
    "Las Vegas Raiders",
    "Los Angeles Chargers",
    "Los Angeles Rams",
    "Miami Dolphins",
    "Minnesota Vikings",
    "New England Patriots",
    "New Orleans Saints",
    "New York Giants",
    "New York Jets",
    "Philadelphia Eagles",
    "Pittsburgh Steelers",
    "San Francisco 49ers",
    "Seattle Seahawks",
    "Tampa Bay Buccaneers",
    "Tennessee Titans",
    "Washington Commanders",
  ],
  NBA: [
    "Atlanta Hawks",
    "Boston Celtics",
    "Brooklyn Nets",
    "Charlotte Hornets",
    "Chicago Bulls",
    "Cleveland Cavaliers",
    "Dallas Mavericks",
    "Denver Nuggets",
    "Detroit Pistons",
    "Golden State Warriors",
    "Houston Rockets",
    "Indiana Pacers",
    "LA Clippers",
    "Los Angeles Lakers",
    "Memphis Grizzlies",
    "Miami Heat",
    "Milwaukee Bucks",
    "Minnesota Timberwolves",
    "New Orleans Pelicans",
    "New York Knicks",
    "Oklahoma City Thunder",
    "Orlando Magic",
    "Philadelphia 76ers",
    "Phoenix Suns",
    "Portland Trail Blazers",
    "Sacramento Kings",
    "San Antonio Spurs",
    "Toronto Raptors",
    "Utah Jazz",
    "Washington Wizards",
  ],
  MLB: [
    "Arizona Diamondbacks",
    "Atlanta Braves",
    "Baltimore Orioles",
    "Boston Red Sox",
    "Chicago Cubs",
    "Chicago White Sox",
    "Cincinnati Reds",
    "Cleveland Guardians",
    "Colorado Rockies",
    "Detroit Tigers",
    "Houston Astros",
    "Kansas City Royals",
    "Los Angeles Angels",
    "Los Angeles Dodgers",
    "Miami Marlins",
    "Milwaukee Brewers",
    "Minnesota Twins",
    "New York Mets",
    "New York Yankees",
    "Oakland Athletics",
    "Philadelphia Phillies",
    "Pittsburgh Pirates",
    "San Diego Padres",
    "San Francisco Giants",
    "Seattle Mariners",
    "St. Louis Cardinals",
    "Tampa Bay Rays",
    "Texas Rangers",
    "Toronto Blue Jays",
    "Washington Nationals",
  ],
  NHL: [
    "Anaheim Ducks",
    "Arizona Coyotes",
    "Boston Bruins",
    "Buffalo Sabres",
    "Calgary Flames",
    "Carolina Hurricanes",
    "Chicago Blackhawks",
    "Colorado Avalanche",
    "Columbus Blue Jackets",
    "Dallas Stars",
    "Detroit Red Wings",
    "Edmonton Oilers",
    "Florida Panthers",
    "Los Angeles Kings",
    "Minnesota Wild",
    "Montreal Canadiens",
    "Nashville Predators",
    "New Jersey Devils",
    "New York Islanders",
    "New York Rangers",
    "Ottawa Senators",
    "Philadelphia Flyers",
    "Pittsburgh Penguins",
    "San Jose Sharks",
    "Seattle Kraken",
    "St. Louis Blues",
    "Tampa Bay Lightning",
    "Toronto Maple Leafs",
    "Vancouver Canucks",
    "Vegas Golden Knights",
    "Washington Capitals",
    "Winnipeg Jets",
  ],

  // Curated college list (expand in Phase 2 by conference tables + official IDs)
  NCAAF: [
    "Alabama Crimson Tide",
    "Arizona Wildcats",
    "Arizona State Sun Devils",
    "Arkansas Razorbacks",
    "Auburn Tigers",
    "Baylor Bears",
    "Boise State Broncos",
    "Boston College Eagles",
    "BYU Cougars",
    "California Golden Bears",
    "Clemson Tigers",
    "Colorado Buffaloes",
    "Duke Blue Devils",
    "Florida Gators",
    "Florida State Seminoles",
    "Georgia Bulldogs",
    "Georgia Tech Yellow Jackets",
    "Illinois Fighting Illini",
    "Indiana Hoosiers",
    "Iowa Hawkeyes",
    "Iowa State Cyclones",
    "Kansas Jayhawks",
    "Kansas State Wildcats",
    "Kentucky Wildcats",
    "LSU Tigers",
    "Louisville Cardinals",
    "Maryland Terrapins",
    "Miami Hurricanes",
    "Michigan Wolverines",
    "Michigan State Spartans",
    "Minnesota Golden Gophers",
    "Mississippi State Bulldogs",
    "Missouri Tigers",
    "Nebraska Cornhuskers",
    "North Carolina Tar Heels",
    "NC State Wolfpack",
    "Notre Dame Fighting Irish",
    "Ohio State Buckeyes",
    "Oklahoma Sooners",
    "Oklahoma State Cowboys",
    "Ole Miss Rebels",
    "Oregon Ducks",
    "Oregon State Beavers",
    "Penn State Nittany Lions",
    "Pittsburgh Panthers",
    "Purdue Boilermakers",
    "Rutgers Scarlet Knights",
    "South Carolina Gamecocks",
    "Stanford Cardinal",
    "Syracuse Orange",
    "TCU Horned Frogs",
    "Tennessee Volunteers",
    "Texas Longhorns",
    "Texas A&M Aggies",
    "Texas Tech Red Raiders",
    "UCLA Bruins",
    "USC Trojans",
    "Utah Utes",
    "Vanderbilt Commodores",
    "Virginia Cavaliers",
    "Virginia Tech Hokies",
    "Wake Forest Demon Deacons",
    "Washington Huskies",
    "West Virginia Mountaineers",
    "Wisconsin Badgers",
  ],

  Soccer: [
    // Demo set (expand later to MLS / EPL / UEFA etc. with official IDs)
    "Inter Miami CF",
    "LA Galaxy",
    "New York City FC",
    "Seattle Sounders",
    "Atlanta United",
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Manchester City",
    "Manchester United",
    "Tottenham Hotspur",
    "Barcelona",
    "Real Madrid",
    "Bayern Munich",
    "PSG",
    "Juventus",
    "Inter Milan",
    "AC Milan",
  ],

  UFC: ["UFC Fight Night", "UFC Main Card", "UFC PPV Main Event"],

  HBCUGOSPORTS: ["HBCU Showcase", "HBCU Game of the Week", "Classic Rivalry"],
  HBCUGO: ["Campus Stories", "HBCU Spotlight", "Student Athletes"],
};

/* ===== END PART 3/5 ===== */
/* =========================
   AMPÈRE — Updated Demo App
   PART 4/5
   (Design tokens + dropdown readability/ESC close + filter accordions/chips + footer icons
    + wizard focus fix via Modal onClose stabilization + Browse/Platforms labels + remove All/Preview UI)
   ========================= */

// -------------------- Design tokens + global CSS --------------------

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

// -------------------- Inline Icons (missing set) --------------------

function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.35-5.65"
        stroke="white"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 4v6h-6"
        stroke="white"
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
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
        strokeOpacity="0.78"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="2"
      />
      <path
        d="M7 11a5 5 0 0 0 10 0"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 16v4"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 20h6"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRemote() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4h8a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 8h4" stroke="white" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 12h4" stroke="white" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 16h4" stroke="white" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a8.5 8.5 0 0 0 .1-2l2-1.2-2-3.5-2.3.7a8.4 8.4 0 0 0-1.7-1l-.3-2.4H10.8l-.3 2.4a8.4 8.4 0 0 0-1.7 1l-2.3-.7-2 3.5 2 1.2a8.5 8.5 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.7c.5.4 1.1.7 1.7 1l.3 2.4h4.4l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.7 2-3.5-2-1.2Z"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -------------------- Modal (focus trap + stable onClose ref; fixes wizard input blur) --------------------

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

  const titleId = useMemo(
    () => `modal_${normalizeKey(title)}_${Math.random().toString(16).slice(2)}`,
    [title]
  );

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = (document.activeElement as HTMLElement) ?? null;

    prevBodyOverflowRef.current = document.body.style.overflow ?? "";
    document.body.style.overflow = "hidden";

    const getFocusable = (root: HTMLElement) => {
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
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
            background:
              "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 60%), rgba(0,0,0,0.35)",
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

// -------------------- Pills / chips / dropdown --------------------

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
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
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
        textAlign: "left",
        boxShadow: active ? "0 0 0 1px rgba(58,167,255,0.10) inset" : undefined,
      }}
    >
      {iconNode ? (
        <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {iconNode}
        </span>
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

      {active ? (
        <span
          aria-hidden="true"
          style={{
            marginLeft: "auto",
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "rgba(58,167,255,0.95)",
            boxShadow: "0 0 0 4px rgba(58,167,255,0.14)",
            flex: "0 0 auto",
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
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            minWidth,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.14)",
            background:
              "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 55%), rgba(10,10,10,0.98)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            zIndex: 90,
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
      type="button"
      onClick={onClick}
      className="ampere-focus"
      role="menuitem"
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
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

// -------------------- Filter UI: mobile accordions + selected chips + reset --------------------

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

// -------------------- Cards + grids (adds lightweight "Load more" for heavy modals) --------------------

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

  const heroCandidates = card.thumb
    ? [card.thumb, ...brandWideCandidates(), ...brandMarkCandidates()]
    : [...brandWideCandidates(), ...brandMarkCandidates()];

  const platformIcon = card.platformId ? platformIconCandidates(card.platformId) : [];
  const leagueSources = leagueLogoCandidates(card.league);

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
        <div style={{ position: "absolute", inset: 0, opacity: 0.22 }}>
          <SmartImg sources={heroCandidates} size={900} rounded={0} border={false} fit="cover" fill />
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
          {leagueSources.length ? <SmartImg sources={leagueSources} size={26} rounded={10} fit="contain" /> : null}
          {platformIcon.length ? <SmartImg sources={platformIcon} size={26} rounded={10} fit="contain" /> : null}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ color: "white", fontWeight: 950, fontSize: 15, lineHeight: 1.15 }}>{card.title}</div>

        {card.subtitle ? (
          <div style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, fontWeight: 850, fontSize: 12 }}>{card.subtitle}</div>
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
   MAIN COMPONENT START
   (Part 4 covers Header + Filters + Footer + Rails)
   Part 5 finishes modals + wizard + data/demo helpers
   ========================= */

export default function AmpereApp() {
  const { isMobile, density } = useViewport();

  const [activeTab, setActiveTab] = useState<TabKey>("home");

  // “Browse” — internal default is "All", but we do NOT render an "All" pill.
  const [activeGenre, setActiveGenre] = useState<GenreKey>("All");

  // Platforms — internal default "all", but we do NOT render an "ALL" pill.
  const [activePlatform, setActivePlatform] = useState<PlatformId>("all");

  // Live league filter
  const [activeLeague, setActiveLeague] = useState<string>("ALL");

  const [profile, setProfile] = useState<ProfileState>(() => loadProfile());

  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [openSeeAll, setOpenSeeAll] = useState<
    null | "browse" | "platforms" | "for-you" | "live-now" | "continue" | "trending"
  >(null);

  const [openVoice, setOpenVoice] = useState(false);
  const [openRemote, setOpenRemote] = useState(false);
  const [openFavorites, setOpenFavorites] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openConnect, setOpenConnect] = useState(false);
  const [openSetup, setOpenSetup] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [openProfileSettings, setOpenProfileSettings] = useState(false);

  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftPlatforms, setDraftPlatforms] = useState<PlatformId[]>(profile.favoritePlatformIds);
  const [draftLeagues, setDraftLeagues] = useState<string[]>(profile.favoriteLeagues);
  const [draftTeams, setDraftTeams] = useState<string[]>(profile.favoriteTeams);

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

  useEffect(() => {
    setDraftName(profile.name);
    setDraftPlatforms(profile.favoritePlatformIds);
    setDraftLeagues(profile.favoriteLeagues);
    setDraftTeams(profile.favoriteTeams);
  }, [profile]);

  // Keep activePlatform valid for selected Browse category
  useEffect(() => {
    const visible = platformsForGenre(activeGenre);
    const ok = activePlatform === "all" || visible.includes(activePlatform);
    if (!ok) setActivePlatform("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre]);

  const viewing = useMemo(() => (typeof window === "undefined" ? [] : loadViewing()), [openCard]);
  const forYouRanked = useMemo(() => rankForYou(demo.forYou, profile, viewing), [demo.forYou, profile, viewing]);

  const visiblePlatformIds = useMemo(() => platformsForGenre(activeGenre), [activeGenre]);

  // Platforms shown in UI: hide internal sentinels and Live TV pill (requested)
  const visiblePlatforms = useMemo(() => {
    const ids = visiblePlatformIds
      .filter((id) => id !== "all" && id !== "livetv")
      .map((id) => platformById(id))
      .filter(Boolean) as Platform[];
    return ids;
  }, [visiblePlatformIds]);

  const matchesPlatform = (c: Card) => (activePlatform === "all" ? true : c.platformId === activePlatform);
  const matchesGenre = (c: Card) => (activeGenre === "All" ? true : c.genre ? c.genre === activeGenre : true);
  const matchesLeague = (c: Card) =>
    activeLeague === "ALL" ? true : normalizeKey(c.league ?? "") === normalizeKey(activeLeague);

  const forYou = useMemo(() => forYouRanked.filter(matchesGenre).filter(matchesPlatform), [forYouRanked, activeGenre, activePlatform]);
  const liveNow = useMemo(
    () => demo.liveNow.filter(matchesGenre).filter(matchesPlatform).filter(matchesLeague),
    [demo.liveNow, activeGenre, activePlatform, activeLeague]
  );
  const continueWatching = useMemo(
    () => demo.continueWatching.filter(matchesGenre).filter(matchesPlatform),
    [demo.continueWatching, activeGenre, activePlatform]
  );
  const trending = useMemo(
    () => demo.trending.filter(matchesGenre).filter(matchesPlatform),
    [demo.trending, activeGenre, activePlatform]
  );
  const blackMediaCards = useMemo(
    () => demo.blackMediaCards.filter(matchesGenre).filter(matchesPlatform),
    [demo.blackMediaCards, activeGenre, activePlatform]
  );

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
    if (openSeeAll === "for-you") return forYou;
    if (openSeeAll === "live-now") return liveNow;
    if (openSeeAll === "continue") return activeTab === "favs" ? blackMediaCards : continueWatching;
    if (openSeeAll === "trending") return activeTab === "search" ? searchResults : trending;
    return [];
  }, [openSeeAll, forYou, liveNow, continueWatching, trending, activeTab, blackMediaCards, searchResults]);

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
    openProfileSettings;

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

  const resetFilters = () => {
    setActiveGenre("All");
    setActivePlatform("all");
    setActiveLeague("ALL");
    track("filters_reset", {});
  };

  const selectedChips: { label: string; onRemove: () => void }[] = [];
  if (activeGenre !== "All") selectedChips.push({ label: `Browse: ${activeGenre}`, onRemove: () => setActiveGenre("All") });
  if (activePlatform !== "all")
    selectedChips.push({
      label: `Platform: ${platformById(activePlatform)?.label ?? activePlatform}`,
      onRemove: () => setActivePlatform("all"),
    });
  if (activeTab === "live" && activeLeague !== "ALL")
    selectedChips.push({ label: `League: ${activeLeague}`, onRemove: () => setActiveLeague("ALL") });

  const isRailSeeAll = !!openSeeAll && openSeeAll !== "browse" && openSeeAll !== "platforms";

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

      {/* Hidden uploads */}
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
            background:
              "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 55%), rgba(0,0,0,0.36)",
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
              <SmartImg sources={brandMarkCandidates()} size={isMobile ? 44 : 52} rounded={18} border={false} fit="contain" />
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  opacity: 0.94,
                  fontWeight: 950,
                  fontSize: isMobile ? 14 : 15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                CONTROL, REIMAGINED.
              </div>
              <div style={{ opacity: 0.72, fontWeight: 900, fontSize: density.small, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
              <MenuItem title="Connect Platforms" subtitle="Mark platforms as connected (demo)" onClick={() => setOpenConnect(true)} right="›" />
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
                subtitle="Re-run onboarding"
                onClick={() => {
                  setOpenSetup(true);
                  setSetupStep(1);
                }}
                right="›"
              />
              <MenuItem title="About AMPÈRE" subtitle="Backstory + inventors + tech map" onClick={() => setOpenAbout(true)} right="›" />
              <MenuItem title="Change Photo" subtitle="Upload a profile picture" onClick={() => avatarInputRef.current?.click()} right="⬆" />
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
          {/* Selected chips + reset */}
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
              No active filters. <span style={{ opacity: 0.85 }}>Use Browse + Platforms (and League on Live) to narrow.</span>
            </div>
          )}

          {/* Browse — remove “All” pill */}
          <FilterAccordion
            title="Browse"
            isMobile={isMobile}
            defaultOpen={!isMobile}
            right={<span>{activeGenre === "All" ? "Any" : activeGenre}</span>}
          >
            <Section title="" rightText="See all" onRightClick={() => setOpenSeeAll("browse")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                {GENRES.filter((g) => g.key !== "All").map((g) => (
                  <PillButton
                    key={g.key}
                    label={g.key}
                    iconSources={BROWSE_ICON_CANDIDATES[g.key] ?? []}
                    active={activeGenre === g.key}
                    onClick={() => setActiveGenre(g.key)}
                    fullWidth
                  />
                ))}
              </div>
            </Section>
          </FilterAccordion>

          {/* Platforms — remove ALL + remove Live TV pill */}
          <FilterAccordion
            title="Platforms"
            isMobile={isMobile}
            defaultOpen={!isMobile}
            right={<span>{activePlatform === "all" ? "Any" : platformById(activePlatform)?.label ?? activePlatform}</span>}
          >
            <Section title="" rightText="See all" onRightClick={() => setOpenSeeAll("platforms")}>
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
              {/* Removed: “All Platforms Preview” */}
            </Section>
          </FilterAccordion>

          {/* League (only on Live tab) */}
          {activeTab === "live" ? (
            <FilterAccordion
              title="League"
              isMobile={isMobile}
              defaultOpen={!isMobile}
              right={<span>{activeLeague === "ALL" ? "Any" : activeLeague}</span>}
            >
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
            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.filter((c) => c.genre === "Premium Sports Streaming").slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
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

      {/* FOOTER (icons are the inline SVGs from Part 2) */}
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
         MODALS (Part 4 only includes Rails “See All”)
         Part 5 adds: Browse/Platforms modals + Card modal + Voice/Remote/etc + Wizard
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
            : "See All — Trending"
        }
        onClose={() => setOpenSeeAll(null)}
      >
        <PagedCardGrid cards={seeAllItems} cardMinW={density.cardMinW} heroH={Math.max(100, density.heroH + 12)} onOpen={openCardAndLog} />
      </Modal>

            {/* =========================
         PART 5/5 — ALL REMAINING MODALS
         (Browse/Platforms See All + Card + Voice/Remote/Favorites/Notifications/Connect/About/Profile + Wizard)
         ========================= */}

      {/* SEE ALL — BROWSE */}
      <Modal open={openSeeAll === "browse"} title="See All — Browse" onClose={() => setOpenSeeAll(null)} maxWidth={920}>
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
            {GENRES.filter((g) => g.key !== "All").map((g) => (
              <PillButton
                key={g.key}
                label={g.key}
                iconSources={BROWSE_ICON_CANDIDATES[g.key] ?? []}
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

      {/* SEE ALL — PLATFORMS */}
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

      {/* CARD DETAILS */}
      <Modal
        open={!!openCard}
        title={openCard ? openCard.title : "Details"}
        onClose={() => setOpenCard(null)}
        maxWidth={980}
      >
        {openCard ? (
          (() => {
            const pid = openCard.platformId ?? platformIdFromLabel(openCard.platformLabel ?? "") ?? null;
            const platform = pid ? platformById(pid) : null;
            const league = openCard.league ?? "";
            const isFavPlatform = pid ? profile.favoritePlatformIds.includes(pid) : false;
            const isConnected = pid ? !!profile.connectedPlatformIds?.[pid] : false;

            const hero = openCard.thumb
              ? [openCard.thumb, ...brandWideCandidates(), ...brandMarkCandidates()]
              : [...brandWideCandidates(), ...brandMarkCandidates()];

            return (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid var(--stroke)",
                    background:
                      "radial-gradient(900px 260px at 30% 0%, rgba(58,167,255,0.18), rgba(0,0,0,0) 60%), rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ position: "relative", height: isMobile ? 160 : 220 }}>
                    <div style={{ position: "absolute", inset: 0, opacity: 0.28 }}>
                      <SmartImg sources={hero} size={1200} rounded={0} border={false} fit="cover" fill />
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
                      {league ? <SmartImg sources={leagueLogoCandidates(league)} size={32} rounded={12} fit="contain" /> : null}
                      {pid ? <SmartImg sources={platformIconCandidates(pid)} size={32} rounded={12} fit="contain" /> : null}
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

                    {(openCard.metaLeft || openCard.metaRight || openCard.startTime || openCard.timeRemaining) ? (
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
                              const nextFavs = exists
                                ? prev.favoritePlatformIds.filter((x) => x !== pid)
                                : uniq([...prev.favoritePlatformIds, pid]) as PlatformId[];

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

      {/* VOICE */}
      <Modal open={openVoice} title="Voice" onClose={() => setOpenVoice(false)} maxWidth={760}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Try commands like:</div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              "“Play the Lakers game.”",
              "“Open Netflix.”",
              "“Show me kids shows.”",
              "“What’s live right now?”",
              "“Search for documentaries about space.”",
            ].map((t) => (
              <div key={t} style={{ padding: 12, borderRadius: 14, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.05)", fontWeight: 900, opacity: 0.9 }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ opacity: 0.72, fontWeight: 900 }}>
            Demo-only UI. Phase 2 would connect to STT + intent routing.
          </div>
        </div>
      </Modal>

      {/* REMOTE */}
      <Modal open={openRemote} title="Remote" onClose={() => setOpenRemote(false)} maxWidth={760}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.78, fontWeight: 900 }}>
            Demo remote — mapped controls would drive the TV/OS in Phase 2.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>Navigation</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {["↑", "OK", "⟲", "←", "↓", "→"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="ampere-focus"
                    onClick={() => track("remote_press", { key: k })}
                    style={{
                      padding: "14px 0",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.28)",
                      color: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>Playback</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {["Play/Pause", "Back", "Rewind", "Fast-forward", "Vol -", "Vol +"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="ampere-focus"
                    onClick={() => track("remote_press", { key: k })}
                    style={{
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.28)",
                      color: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* FAVORITES */}
      <Modal
        open={openFavorites}
        title="Favorites"
        onClose={() => {
          setOpenFavorites(false);
          setDraftPlatforms(profile.favoritePlatformIds);
          setDraftLeagues(profile.favoriteLeagues);
          setDraftTeams(profile.favoriteTeams);
        }}
        maxWidth={980}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ opacity: 0.78, fontWeight: 900 }}>
            Edit favorites used to boost “For You” and personalize alerts.
          </div>

          <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Favorite Platforms</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
              {ALL_PLATFORM_IDS.map((pid) => {
                const p = platformById(pid);
                const on = draftPlatforms.includes(pid);
                return (
                  <PillButton
                    key={`favp_${pid}`}
                    label={p?.label ?? pid}
                    iconSources={platformIconCandidates(pid)}
                    active={on}
                    onClick={() => {
                      setDraftPlatforms((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : (uniq([...prev, pid]) as PlatformId[])));
                    }}
                    fullWidth
                    multiline
                  />
                );
              })}
            </div>
          </div>

          <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Favorite Leagues</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
              {LEAGUES.filter((l) => l !== "ALL").map((l) => {
                const on = draftLeagues.map(normalizeKey).includes(normalizeKey(l));
                return (
                  <PillButton
                    key={`favl_${l}`}
                    label={l}
                    active={on}
                    onClick={() => {
                      setDraftLeagues((prev) => {
                        const has = prev.map(normalizeKey).includes(normalizeKey(l));
                        return has ? prev.filter((x) => normalizeKey(x) !== normalizeKey(l)) : uniq([...prev, l]);
                      });
                    }}
                    fullWidth
                  />
                );
              })}
            </div>
          </div>

          <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Favorite Teams / Shows (by League)</div>
            {!draftLeagues.length ? (
              <div style={{ opacity: 0.78, fontWeight: 900 }}>Pick at least one league above to choose teams/shows.</div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {draftLeagues.map((l) => {
                  const teams = TEAMS_BY_LEAGUE[l] ?? [];
                  if (!teams.length) return null;
                  return (
                    <div key={`teams_${l}`} style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 950 }}>{l}</div>
                        <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>
                          Selected: {draftTeams.filter((t) => teams.includes(t)).length}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        {teams.slice(0, 48).map((team) => {
                          const on = draftTeams.includes(team);
                          return (
                            <PillButton
                              key={`t_${l}_${team}`}
                              label={team}
                              iconSources={teamLogoCandidates(l, team)}
                              active={on}
                              onClick={() => setDraftTeams((prev) => (prev.includes(team) ? prev.filter((x) => x !== team) : uniq([...prev, team])))}
                              fullWidth
                              multiline
                            />
                          );
                        })}
                      </div>

                      {teams.length > 48 ? (
                        <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>
                          Showing 48 of {teams.length} (demo). Phase 2 adds search + full paging.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setDraftPlatforms(profile.favoritePlatformIds);
                setDraftLeagues(profile.favoriteLeagues);
                setDraftTeams(profile.favoriteTeams);
              }}
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
              Reset
            </button>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setProfile((prev) => {
                  const next: ProfileState = {
                    ...prev,
                    favoritePlatformIds: draftPlatforms,
                    favoriteLeagues: draftLeagues,
                    favoriteTeams: draftTeams,
                  };
                  saveProfile(next);
                  track("favorites_save", {
                    platforms: draftPlatforms.length,
                    leagues: draftLeagues.length,
                    teams: draftTeams.length,
                  });
                  return next;
                });
                setOpenFavorites(false);
              }}
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
      </Modal>

      {/* NOTIFICATIONS */}
      <Modal open={openNotifications} title="Notifications" onClose={() => setOpenNotifications(false)} maxWidth={900}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Alerts</div>
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
              }}
            >
              {profile.notificationsEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div style={{ opacity: 0.75, fontWeight: 900 }}>
            Demo: we would generate reminders when your favorites are LIVE or UPCOMING.
          </div>

          <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Your Favorites</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {profile.favoriteLeagues.slice(0, 8).map((l) => (
                <Chip key={`nl_${l}`} label={l} />
              ))}
              {profile.favoriteTeams.slice(0, 10).map((t) => (
                <Chip key={`nt_${t}`} label={t} />
              ))}
              {!profile.favoriteLeagues.length && !profile.favoriteTeams.length ? (
                <div style={{ opacity: 0.78, fontWeight: 900 }}>No favorites set yet. Add some in Favorites.</div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      {/* CONNECT PLATFORMS */}
      <Modal open={openConnect} title="Connect Platforms" onClose={() => setOpenConnect(false)} maxWidth={980}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.78, fontWeight: 900 }}>
            Demo toggles to simulate “connected” provider accounts.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
            {ALL_PLATFORM_IDS.map((pid) => {
              const p = platformById(pid);
              const on = !!profile.connectedPlatformIds?.[pid];
              return (
                <PillButton
                  key={`conn_${pid}`}
                  label={p?.label ?? pid}
                  iconSources={platformIconCandidates(pid)}
                  active={on}
                  onClick={() => toggleConnected(pid)}
                  fullWidth
                  multiline
                />
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ABOUT */}
      <Modal open={openAbout} title="About AMPÈRE" onClose={() => setOpenAbout(false)} maxWidth={980}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Control, Reimagined.</div>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            AMPÈRE is a concept demo for a unified TV experience: browse across services, see what’s live, and launch content fast —
            from remote, voice, or personalized rails.
          </div>

          <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Phase 2 Directory Plan (suggested)</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 900, opacity: 0.85, fontSize: 13, lineHeight: 1.45 }}>
{`/app
  /ampere
    page.tsx
/components
  /ampere
    CardGrid.tsx
    Filters.tsx
    Header.tsx
    Footer.tsx
    Modals.tsx
/lib
  catalog.ts
  providers.ts
  storage.ts
  ranking.ts
  teams.ts
  tracking.ts`}
            </pre>
            <div style={{ opacity: 0.75, fontWeight: 900 }}>
              This demo is intentionally single-file and dependency-free.
            </div>
          </div>
        </div>
      </Modal>

      {/* PROFILE SETTINGS */}
      <Modal open={openProfileSettings} title="Profile Settings" onClose={() => setOpenProfileSettings(false)} maxWidth={820}>
        <ProfileSettingsContent
          profile={profile}
          onSave={(next) => {
            setProfile(next);
            saveProfile(next);
            track("profile_save", {});
            setOpenProfileSettings(false);
          }}
          onPickAvatar={() => avatarInputRef.current?.click()}
          onPickHeader={() => headerInputRef.current?.click()}
        />
      </Modal>

      {/* SET-UP WIZARD */}
      <Modal
        open={openSetup}
        title={`Set-Up Wizard — Step ${setupStep} of 5`}
        onClose={() => {
          setOpenSetup(false);
          setSetupStep(1);
          setDraftName(profile.name);
          setDraftPlatforms(profile.favoritePlatformIds);
          setDraftLeagues(profile.favoriteLeagues);
          setDraftTeams(profile.favoriteTeams);
        }}
        maxWidth={980}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {/* Step body */}
          {setupStep === 1 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Welcome. What should we call you?</div>
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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="ampere-focus"
                  onClick={() => avatarInputRef.current?.click()}
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
                  onClick={() => headerInputRef.current?.click()}
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
              </div>
              <div style={{ opacity: 0.75, fontWeight: 900 }}>
                Tip: step 1 should not lose focus while typing (Modal focus stabilized).
              </div>
            </div>
          ) : null}

          {setupStep === 2 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Pick favorite platforms</div>
              <div style={{ opacity: 0.78, fontWeight: 900 }}>These boost “For You” and Favs tab.</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10 }}>
                {ALL_PLATFORM_IDS.map((pid) => {
                  const p = platformById(pid);
                  const on = draftPlatforms.includes(pid);
                  return (
                    <PillButton
                      key={`wizp_${pid}`}
                      label={p?.label ?? pid}
                      iconSources={platformIconCandidates(pid)}
                      active={on}
                      onClick={() => setDraftPlatforms((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : (uniq([...prev, pid]) as PlatformId[])))}
                      fullWidth
                      multiline
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {setupStep === 3 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Pick favorite leagues</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                {LEAGUES.filter((l) => l !== "ALL").map((l) => {
                  const on = draftLeagues.map(normalizeKey).includes(normalizeKey(l));
                  return (
                    <PillButton
                      key={`wizl_${l}`}
                      label={l}
                      active={on}
                      onClick={() => {
                        setDraftLeagues((prev) => {
                          const has = prev.map(normalizeKey).includes(normalizeKey(l));
                          return has ? prev.filter((x) => normalizeKey(x) !== normalizeKey(l)) : uniq([...prev, l]);
                        });
                      }}
                      fullWidth
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {setupStep === 4 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Pick favorite teams / shows</div>
              {!draftLeagues.length ? (
                <div style={{ opacity: 0.78, fontWeight: 900 }}>Select leagues first (Step 3).</div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {draftLeagues.map((l) => {
                    const teams = TEAMS_BY_LEAGUE[l] ?? [];
                    if (!teams.length) return null;
                    return (
                      <div key={`wizteams_${l}`} style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 950 }}>{l}</div>
                          <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>
                            Selected: {draftTeams.filter((t) => teams.includes(t)).length}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                          {teams.slice(0, 64).map((team) => {
                            const on = draftTeams.includes(team);
                            return (
                              <PillButton
                                key={`wizt_${l}_${team}`}
                                label={team}
                                iconSources={teamLogoCandidates(l, team)}
                                active={on}
                                onClick={() => setDraftTeams((prev) => (prev.includes(team) ? prev.filter((x) => x !== team) : uniq([...prev, team])))}
                                fullWidth
                                multiline
                              />
                            );
                          })}
                        </div>

                        {teams.length > 64 ? (
                          <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>
                            Showing 64 of {teams.length} (demo). Phase 2 adds search + paging.
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {setupStep === 5 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Review</div>

              <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950 }}>
                  Name: <span style={{ opacity: 0.9 }}>{draftName || "Demo User"}</span>
                </div>
                <div style={{ fontWeight: 950, opacity: 0.9 }}>Platforms: {draftPlatforms.length}</div>
                <div style={{ fontWeight: 950, opacity: 0.9 }}>Leagues: {draftLeagues.length}</div>
                <div style={{ fontWeight: 950, opacity: 0.9 }}>Teams: {draftTeams.length}</div>
              </div>

              <div style={{ opacity: 0.78, fontWeight: 900 }}>
                Saving updates your Home rails and notification preferences.
              </div>
            </div>
          ) : null}

          {/* Step nav */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => setSetupStep((s) => (s > 1 ? ((s - 1) as any) : s))}
              disabled={setupStep === 1}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontWeight: 950,
                cursor: setupStep === 1 ? "not-allowed" : "pointer",
                opacity: setupStep === 1 ? 0.55 : 1,
              }}
            >
              ← Back
            </button>

            {setupStep < 5 ? (
              <button
                type="button"
                className="ampere-focus"
                onClick={() => setSetupStep((s) => ((s + 1) as any))}
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
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="ampere-focus"
                onClick={() => {
                  setProfile((prev) => {
                    const next: ProfileState = {
                      ...prev,
                      name: draftName?.trim() ? draftName.trim() : prev.name,
                      favoritePlatformIds: draftPlatforms,
                      favoriteLeagues: draftLeagues,
                      favoriteTeams: draftTeams,
                    };
                    saveProfile(next);
                    track("wizard_save", {
                      platforms: draftPlatforms.length,
                      leagues: draftLeagues.length,
                      teams: draftTeams.length,
                    });
                    return next;
                  });
                  setOpenSetup(false);
                  setSetupStep(1);
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(58,167,255,0.22)",
                  background: "rgba(58,167,255,0.16)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Save & Finish
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* ===== END PART 5/5 MODALS ===== */}


    </div>
  );
}

/* ===== END PART 4/5 ===== */
/* =========================
   AMPÈRE — Updated Demo App
   PART 5/5
   (Helpers + demo catalog + ranking + tracking + image resize + profile settings content)
   ========================= */

// -------------------- Tracking (demo) --------------------

function track(event: string, payload: Record<string, any>) {
  try {
    // eslint-disable-next-line no-console
    console.log(`[ampere] ${event}`, payload);
  } catch {}
}

// -------------------- Viewing log --------------------

function logViewing(card: Card) {
  const ev: ViewingEvent = {
    id: card.id,
    title: card.title,
    platformId: card.platformId,
    league: card.league,
    at: safeNowISO(),
  };
  const prev = loadViewing();
  saveViewing([...prev, ev]);
  track("viewing_log", { id: card.id, platformId: card.platformId, league: card.league });
}

// -------------------- Image resize helper (uploads) --------------------

function fileToResizedDataUrl(file: File, maxW: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => {
      const raw = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.width || 1;
          const h = img.height || 1;
          const scale = Math.min(1, maxW / w);
          const outW = Math.max(1, Math.round(w * scale));
          const outH = Math.max(1, Math.round(h * scale));

          const canvas = document.createElement("canvas");
          canvas.width = outW;
          canvas.height = outH;

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas_failed"));

          ctx.drawImage(img, 0, 0, outW, outH);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("image_decode_failed"));
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

// -------------------- Catalog + ranking helpers --------------------

function cardKey(c: Card) {
  const t = normalizeKey(c.title);
  const p = c.platformId ? c.platformId : normalizeKey(c.platformLabel ?? "");
  return `${t}|${p}|${normalizeKey(c.league ?? "")}|${normalizeKey(c.genre ?? "")}`;
}

function uniqByCardKey(cards: Card[]) {
  const m = new Map<string, Card>();
  for (const c of cards) {
    const k = cardKey(c);
    if (!m.has(k)) m.set(k, c);
  }
  return Array.from(m.values());
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rankForYou(cards: Card[], profile: ProfileState, viewing: ViewingEvent[]) {
  const favP = new Set(profile.favoritePlatformIds);
  const favL = new Set(profile.favoriteLeagues.map(normalizeKey));
  const recent = viewing.slice(-60);

  const score = (c: Card) => {
    let s = 0;

    if (c.platformId && favP.has(c.platformId)) s += 4;
    if (c.league && favL.has(normalizeKey(c.league))) s += 3;

    if (c.platformId && profile.connectedPlatformIds?.[c.platformId]) s += 1;

    const seenSamePlatform = c.platformId ? recent.some((r) => r.platformId === c.platformId) : false;
    const seenSameLeague = c.league ? recent.some((r) => normalizeKey(r.league ?? "") === normalizeKey(c.league ?? "")) : false;

    if (seenSamePlatform) s += 0.6;
    if (seenSameLeague) s += 0.6;

    // Live gets a slight boost
    if (c.badge === "LIVE") s += 0.8;

    // stable tie-break
    s += (hashStr(c.id) % 1000) / 100000;

    return s;
  };

  return [...cards].sort((a, b) => score(b) - score(a));
}

// -------------------- Demo catalog --------------------

type DemoCatalog = {
  forYou: Card[];
  liveNow: Card[];
  continueWatching: Card[];
  trending: Card[];
  blackMediaCards: Card[];
};

function buildDemoCatalog(): DemoCatalog {
  const mk = (x: Partial<Card> & { id: string; title: string }): Card => ({
    id: x.id,
    title: x.title,
    subtitle: x.subtitle,
    badge: x.badge,
    badgeRight: x.badgeRight,
    platformId: x.platformId,
    platformLabel: x.platformLabel ?? (x.platformId ? platformById(x.platformId)?.label : undefined),
    league: x.league,
    genre: x.genre,
    thumb: x.thumb ?? safeBrandWide(),
    startTime: x.startTime,
    timeRemaining: x.timeRemaining,
    metaLeft: x.metaLeft,
    metaRight: x.metaRight,
  });

  // Live Now (sports + live TV vibe)
  const liveNow: Card[] = [
    mk({
      id: "live_1",
      title: "NFL Sunday Showdown",
      subtitle: "Chiefs vs. Bills",
      badge: "LIVE",
      league: "NFL",
      platformId: "espn",
      genre: "Premium Sports Streaming",
      timeRemaining: "Q3 • 8:41",
      metaLeft: "Sports",
      metaRight: "HD",
      thumb: "/assets/demo/live/nfl.png",
    }),
    mk({
      id: "live_2",
      title: "NBA Tip-Off Live",
      subtitle: "Lakers vs. Celtics",
      badge: "LIVE",
      league: "NBA",
      platformId: "youtubetv",
      genre: "LiveTV",
      timeRemaining: "Q2 • 3:12",
      metaLeft: "Sports",
      metaRight: "Live",
      thumb: "/assets/demo/live/nba.png",
    }),
    mk({
      id: "live_3",
      title: "HBCU Game of the Week",
      subtitle: "Classic Rivalry",
      badge: "LIVE",
      league: "HBCUGOSPORTS",
      platformId: "hbcugosports",
      genre: "Premium Sports Streaming",
      timeRemaining: "2nd • 11:05",
      metaLeft: "Sports",
      metaRight: "Live",
      thumb: "/assets/demo/live/hbcu.png",
    }),
    mk({
      id: "live_4",
      title: "MLB Nightcap",
      subtitle: "Dodgers vs. Yankees",
      badge: "LIVE",
      league: "MLB",
      platformId: "mlbtv",
      genre: "Premium Sports Streaming",
      timeRemaining: "7th • 0 Outs",
      metaLeft: "Sports",
      metaRight: "Live",
      thumb: "/assets/demo/live/mlb.png",
    }),
    mk({
      id: "live_5",
      title: "UFC Fight Night",
      subtitle: "Main Card",
      badge: "LIVE",
      league: "UFC",
      platformId: "espnplus",
      genre: "Premium Sports Streaming",
      timeRemaining: "Round 2",
      metaLeft: "Combat",
      metaRight: "Live",
      thumb: "/assets/demo/live/ufc.png",
    }),
  ];

  const continueWatching: Card[] = [
    mk({
      id: "cw_1",
      title: "The Last Frontier",
      subtitle: "Episode 3 • 18m left",
      platformId: "netflix",
      genre: "Basic Streaming",
      metaLeft: "Series",
      metaRight: "Continue",
      thumb: "/assets/demo/cw/1.png",
    }),
    mk({
      id: "cw_2",
      title: "Kitchen Wars",
      subtitle: "Episode 7 • 9m left",
      platformId: "hulu",
      genre: "Basic Streaming",
      metaLeft: "Reality",
      metaRight: "Continue",
      thumb: "/assets/demo/cw/2.png",
    }),
    mk({
      id: "cw_3",
      title: "Planet: Deep Space",
      subtitle: "Documentary • 22m left",
      platformId: "curiositystream",
      genre: "Documentaries",
      metaLeft: "Doc",
      metaRight: "Continue",
      thumb: "/assets/demo/cw/3.png",
    }),
    mk({
      id: "cw_4",
      title: "Cartoon Galaxy",
      subtitle: "Kids • 12m left",
      platformId: "disneyplus",
      genre: "Kids",
      metaLeft: "Kids",
      metaRight: "Continue",
      thumb: "/assets/demo/cw/4.png",
    }),
  ];

  const trending: Card[] = [
    mk({
      id: "tr_1",
      title: "Midnight Cult Classics",
      subtitle: "Trending in Horror",
      platformId: "shudder",
      genre: "Horror / Cult",
      metaLeft: "Horror",
      metaRight: "Trending",
      thumb: "/assets/demo/trending/1.png",
    }),
    mk({
      id: "tr_2",
      title: "Arthouse Spotlight",
      subtitle: "Festival favorites",
      platformId: "mubi",
      genre: "Indie and Arthouse Film",
      metaLeft: "Film",
      metaRight: "Trending",
      thumb: "/assets/demo/trending/2.png",
    }),
    mk({
      id: "tr_3",
      title: "Live Sports: The Breakdown",
      subtitle: "Top plays this week",
      platformId: "espn",
      genre: "Premium Sports Streaming",
      metaLeft: "Sports",
      metaRight: "Trending",
      thumb: "/assets/demo/trending/3.png",
    }),
    mk({
      id: "tr_4",
      title: "Free Movie Night",
      subtitle: "Top picks on Tubi",
      platformId: "tubi",
      genre: "Free Streaming",
      metaLeft: "Free",
      metaRight: "Trending",
      thumb: "/assets/demo/trending/4.png",
    }),
    mk({
      id: "tr_5",
      title: "Anime Weekly",
      subtitle: "New episodes",
      platformId: "crunchyroll",
      genre: "Anime / Asian cinema",
      metaLeft: "Anime",
      metaRight: "Trending",
      thumb: "/assets/demo/trending/5.png",
    }),
    mk({
      id: "tr_6",
      title: "Big Game Energy",
      subtitle: "Must-watch matchups",
      platformId: "youtubetv",
      genre: "LiveTV",
      metaLeft: "Live TV",
      metaRight: "Trending",
      thumb: "/assets/demo/trending/6.png",
    }),
  ];

  const blackMediaCards: Card[] = [
    mk({
      id: "bm_1",
      title: "Black Media Spotlight",
      subtitle: "New voices, new stories",
      platformId: "blackmedia",
      genre: "Black culture & diaspora",
      metaLeft: "Curated",
      metaRight: "Preview",
      thumb: "/assets/demo/blackmedia/1.png",
    }),
    mk({
      id: "bm_2",
      title: "HBCUGO Originals",
      subtitle: "Campus Stories",
      platformId: "hbcugo",
      league: "HBCUGO",
      genre: "Black culture & diaspora",
      metaLeft: "Originals",
      metaRight: "New",
      thumb: "/assets/demo/blackmedia/2.png",
    }),
    mk({
      id: "bm_3",
      title: "KweliTV Feature",
      subtitle: "Festival-ready films",
      platformId: "kwelitv",
      genre: "Black culture & diaspora",
      metaLeft: "Film",
      metaRight: "Featured",
      thumb: "/assets/demo/blackmedia/3.png",
    }),
    mk({
      id: "bm_4",
      title: "ALLBLK Series",
      subtitle: "Binge-worthy drama",
      platformId: "allblk",
      genre: "Black culture & diaspora",
      metaLeft: "Series",
      metaRight: "Trending",
      thumb: "/assets/demo/blackmedia/4.png",
    }),
  ];

  // For You (mix)
  const forYou: Card[] = [
    ...trending,
    ...continueWatching,
    ...blackMediaCards,
    ...liveNow.map((c) => ({ ...c, id: `fy_${c.id}` })),
    mk({ id: "fy_1", title: "Family Movie Night", subtitle: "Kids picks", platformId: "pbskids", genre: "Kids", metaLeft: "Kids", metaRight: "For You" }),
    mk({ id: "fy_2", title: "Gaming Spotlight", subtitle: "Live streams and highlights", platformId: "twitch", genre: "Gaming", metaLeft: "Gaming", metaRight: "For You" }),
    mk({ id: "fy_3", title: "Documentary Deep Dive", subtitle: "Science & tech", platformId: "magellantv", genre: "Documentaries", metaLeft: "Doc", metaRight: "For You" }),
    mk({ id: "fy_4", title: "Weekend Movie Picks", subtitle: "Top rentals", platformId: "appletvstore", genre: "Movie Streaming", metaLeft: "Rent/Buy", metaRight: "For You" }),
    mk({ id: "fy_5", title: "Premium Drama Night", subtitle: "New episodes", platformId: "starz", genre: "Premium Streaming", metaLeft: "Drama", metaRight: "For You" }),
  ];

  return { forYou, liveNow, continueWatching, trending, blackMediaCards };
}

// -------------------- Profile Settings Content --------------------

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
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, overflow: "hidden", border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.06)" }}>
          <SmartImg sources={profile.profilePhoto ? [profile.profilePhoto] : brandMarkCandidates()} size={56} rounded={18} border={false} fit="cover" />
        </div>
        <div style={{ minWidth: 240, flex: "1 1 280px" }}>
          <div style={{ fontWeight: 950, opacity: 0.9 }}>Display name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ampere-focus"
            placeholder="Your name"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 900,
              marginTop: 8,
            }}
          />
        </div>
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
          Change Photo
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
          Change Header
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

/* ===== END PART 5/5 ===== */
