// ============================================================================
// AMPERE ASSET RESOLUTION SYSTEM
// File: lib/assetPath.ts
//
// Robust asset path resolution with support for:
// - basePath / assetPrefix compatibility
// - Multiple filename variants (hyphens, underscores, plus signs)
// - Multiple directory roots matching actual file locations
// - Exact filenames from the public/ directory
// ============================================================================

function getAssetPrefix(): string {
  const prefix =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ASSET_PREFIX) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_PATH) ||
    "";
  return prefix.replace(/\/$/, "");
}

export function assetPath(p: string): string {
  const prefix = getAssetPrefix();
  if (!prefix) return p;
  const cleanPath = p.startsWith("/") ? p : `/${p}`;
  return `${prefix}${cleanPath}`;
}

// ============================================================================
// FILENAME VARIANT GENERATION
// ============================================================================

export function generateFilenameVariants(name: string): string[] {
  const normalized = name.toLowerCase().trim();
  const variants = new Set<string>();

  variants.add(normalized);
  variants.add(normalized.replace(/\+/g, "plus"));
  variants.add(normalized.replace(/\+/g, "-plus"));
  variants.add(normalized.replace(/\+/g, "_plus"));
  variants.add(normalized.replace(/\s+/g, "-"));
  variants.add(normalized.replace(/\s+/g, "_"));
  variants.add(normalized.replace(/\s+/g, ""));
  variants.add(normalized.replace(/&/g, "and"));
  variants.add(normalized.replace(/&/g, "-and-"));
  variants.add(normalized.replace(/[^a-z0-9]/g, ""));
  // Preserve original casing variant
  variants.add(name.trim());
  // CamelCase / PascalCase
  const pascal = name.trim().replace(/\s+/g, "");
  variants.add(pascal);

  return Array.from(variants).filter(Boolean);
}

// ============================================================================
// KNOWN EXACT FILENAMES - maps platformId to actual file in public/assets/services/
// ============================================================================

const KNOWN_SERVICE_FILES: Record<string, string> = {
  // ---- Basic Streaming ----
  netflix: "netflix.png",
  hulu: "hulu.png",
  primevideo: "Primevideo.png",
  disneyplus: "disneyplus.png",
  max: "max.png",
  peacock: "peacock.png",
  paramountplus: "paramountplus.png",
  youtube: "youtube.png",
  youtubetv: "YouTubeTV.png",
  appletv: "AppleTV.png",
  // ---- Premium ----
  betplus: "bet+.png",
  amcplus: "amc.png",
  starz: "starz.png",
  mgmplus: "mgm+.png",
  // ---- Movies ----
  criterion: "criterion.png",
  mubi: "MUBI.png",
  fandango: "fandango.png",
  vudu: "Vudu-Logo.png",
  youtubemovies: "youtube.movies.png",
  moviesanywhere: "movies.anywhere.png",
  // ---- Documentaries ----
  pbspassport: "pbs-passport.png",
  curiositystream: "curiosity.png",
  magellantv: "MagellanTV-logo.png",
  // ---- Anime / Asian ----
  crunchyroll: "crunchyroll.png",
  hidive: "hidive.png",
  viki: "Viki.png",
  iqiyi: "iqiyi.png",
  asiancrush: "asiancrush.png",
  // ---- Kids ----
  "disneyplus-kids": "disneyplus.png",
  disneynow: "disneyplus.png",
  pbskids: "pbskids.png",
  youtubekids: "youtube.png",
  noggin: "noggin.png",
  cartoonnetwork: "all.png",
  nickelodeon: "noggin.png",
  kidoodletv: "kidoodletv.png",
  happykids: "happykids.png",
  boomerang: "all.png",
  babytv: "all.png",
  sensical: "all.png",
  gonoodle: "all.png",
  supersimple: "all.png",
  ryanfriends: "all.png",
  "bbc-cbeebies": "all.png",
  numberblocks: "all.png",
  babyjohn: "all.png",
  kartoon: "all.png",
  // ---- Live TV ----
  "hulu-livetv": "hulu.png",
  sling: "sling.png",
  fubotv: "FUBOTV.png",
  // ---- Sports ----
  espn: "ESPN.png",
  espnplus: "espn-plus.png",
  foxsports1: "all.png",
  dazn: "Dazn.png",
  nflplus: "NFL+.jpg",
  nbaleaguepass: "nbaleaguepass.png",
  mlbtv: "mlb.png",
  nhl: "nhl.png",
  hbcugosports: "HBCUGOSPORTS.png",
  yahoosports: "all.png",
  fanduelsports: "all.png",
  // ---- Gaming ----
  twitch: "twitch.png",
  kick: "all.png",
  xboxcloud: "all.png",
  geforcenow: "all.png",
  playstationplus: "all.png",
  steam: "all.png",
  // ---- Free ----
  tubi: "tubi.png",
  plutotv: "pluto-logo.png",
  rokuchannel: "RokuChannel.png",
  freevee: "FreeVee.jpg",
  xumo: "xumo.jpg",
  plex: "plex.png",
  crackle: "Crackle-Emblem.png",
  revry: "revry.png",
  // ---- Arthouse ----
  ovid: "ovid.png",
  fandor: "fandor.png",
  kinocult: "kino.png",
  kanopy: "kanopy.png",
  // ---- Horror / Cult ----
  shudder: "Shudder.png",
  screambox: "Screambox.png",
  arrow: "arrow.png",
  // ---- LGBT ----
  heretv: "HereTV.png",
  outtv: "OutTV.png",
  dekkoo: "dekkoo.png",
  // ---- Black Media ----
  kwelitv: "kwelitv.png",
  hbcugo: "hbcuGO.png",
  brownsugar: "BrownSugar.png",
  americanu: "NU.png",
  afrolandtv: "AfrolandTV.png",
  urbanflixtv: "UrbanflixTV.png",
  blackstarnetwork: "BlackStarNetwork.png",
  umc: "all.png",
  allblk: "ALLBLK.png",
  mansa: "Mansa.png",
  blackmedia: "blackmedia.png",
  // ---- Vistazo (Latino) ----
  vixpremium: "all.png",
  fubolatino: "FUBOTV.png",
  telemundodeportes: "all.png",
  slinglatino: "sling.png",
  espndeportes: "ESPN.png",
  directvdeportes: "all.png",
  xfinitynowlatino: "all.png",
  univision: "all.png",
  telemundo: "all.png",
  estrella: "all.png",
  cinelatinotv: "all.png",
  pantaya: "all.png",
};

// ============================================================================
// ASSET PATH CANDIDATE GENERATORS
// ============================================================================

export function platformIconCandidates(platformId: string): string[] {
  const paths: string[] = [];

  // First try the known exact filename
  const known = KNOWN_SERVICE_FILES[platformId];
  if (known) {
    paths.push(assetPath(`/assets/services/${known}`));
  }

  const variants = generateFilenameVariants(platformId);
  const directories = [
    "/assets/services",
    "/logos/services",
    "/icons/platforms",
    "/platforms",
    "/assets/platforms",
  ];
  const extensions = [".png", ".svg", ".webp", ".jpg"];

  for (const dir of directories) {
    for (const variant of variants) {
      for (const ext of extensions) {
        paths.push(assetPath(`${dir}/${variant}${ext}`));
      }
    }
  }

  return paths;
}

export function genreImageCandidates(genreKey: string): string[] {
  const paths: string[] = [];

  // Map genre keys to known filenames in /assets/genres/
  const KNOWN_GENRE_FILES: Record<string, string> = {
    All: "all.png",
    "Anime & AsianTV": "animeasiancinema.png",
    Arthouse: "indieandarthouse.png",
    Basic: "basicstreaming.png",
    "Black Media": "blackmedia.png",
    Documentaries: "documentary.png",
    Free: "Free.png",
    Gaming: "premiumsports.png",
    "Horror / Cult": "horrorcult.png",
    Kids: "kids.png",
    LGBT: "LGBT.png",
    LiveTV: "livetv.png",
    Movies: "moviestreaming.png",
    Premium: "premiummovies.png",
    Sports: "premiumsports.png",
    Vistazo: "all.png",
  };

  const known = KNOWN_GENRE_FILES[genreKey];
  if (known) {
    paths.push(assetPath(`/assets/genres/${known}`));
    paths.push(assetPath(`/assets/genre/${known}`));
    // Also try services folder as fallback for genre images
    paths.push(assetPath(`/assets/services/${known}`));
  }

  const variants = generateFilenameVariants(genreKey);
  const directories = ["/assets/genres", "/assets/genre", "/assets/services", "/images/genres", "/genres"];
  const extensions = [".png", ".jpg", ".webp", ".svg"];

  for (const dir of directories) {
    for (const variant of variants) {
      for (const ext of extensions) {
        paths.push(assetPath(`${dir}/${variant}${ext}`));
      }
    }
  }

  return paths;
}

export function headerIconCandidates(iconName: string): string[] {
  const paths: string[] = [];
  // Known files: Settings.png, Voice.png in both /assets/icons/header/ and /icons/header/
  const variants = [iconName, iconName.toLowerCase(), iconName.charAt(0).toUpperCase() + iconName.slice(1).toLowerCase()];
  const dirs = ["/assets/icons/header", "/icons/header"];
  const exts = [".png", ".svg", ".webp"];

  for (const dir of dirs) {
    for (const v of variants) {
      for (const ext of exts) {
        paths.push(assetPath(`${dir}/${v}${ext}`));
      }
    }
  }
  return paths;
}

export function footerIconCandidates(iconName: string): string[] {
  const paths: string[] = [];
  // Known files: home.png, favs.png, livetv.png, search.png in /assets/icons/footer/
  // Also: Home.png, Favs.png, etc in /icons/footer/
  const variants = [iconName, iconName.toLowerCase(), iconName.charAt(0).toUpperCase() + iconName.slice(1).toLowerCase()];
  const dirs = ["/assets/icons/footer", "/icons/footer"];
  const exts = [".png", ".svg", ".webp"];

  for (const dir of dirs) {
    for (const v of variants) {
      for (const ext of exts) {
        paths.push(assetPath(`${dir}/${v}${ext}`));
      }
    }
  }
  return paths;
}

export function brandWideCandidates(): string[] {
  return [
    assetPath("/assets/brand/ampere-long.png"),
    assetPath("/brand/ampere-long.png"),
    assetPath("/assets/brand/ampere-wide.svg"),
    assetPath("/assets/brand/ampere-wide.png"),
    assetPath("/brand/ampere-wide.svg"),
    assetPath("/brand/ampere-wide.png"),
  ];
}

export function brandMarkCandidates(): string[] {
  return [
    assetPath("/assets/brand/ampere-short.png"),
    assetPath("/brand/ampere-short- logo.png"),
    assetPath("/brand/ampere-short.png"),
    assetPath("/assets/brand/ampere-mark.svg"),
    assetPath("/assets/brand/ampere-mark.png"),
    assetPath("/brand/ampere-mark.svg"),
    assetPath("/brand/ampere-icon.svg"),
  ];
}

export function voiceIconCandidates(): string[] {
  return [
    assetPath("/assets/icons/header/Voice.png"),
    assetPath("/icons/header/Voice.png"),
    assetPath("/icons/voice.svg"),
    assetPath("/icons/voice.png"),
  ];
}

export function settingsIconCandidates(): string[] {
  return [
    assetPath("/assets/icons/header/Settings.png"),
    assetPath("/icons/header/Settings.png"),
    assetPath("/icons/settings.svg"),
    assetPath("/icons/settings.png"),
  ];
}

export function powerIconCandidates(): string[] {
  return [
    assetPath("/icons/header/power.png"),
    assetPath("/assets/icons/header/power.png"),
    assetPath("/icons/power.svg"),
  ];
}

export function leagueLogoCandidates(league?: string): string[] {
  if (!league) return [];
  const k = league.toLowerCase().replace(/[^a-z0-9]/g, "");
  const original = league.toLowerCase();
  return [
    assetPath(`/assets/leagues/${k}.png`),
    assetPath(`/assets/leagues/${k}.svg`),
    assetPath(`/assets/leagues/teams/${league}/${k}.png`),
    assetPath(`/assets/teams/${original}/${k}.png`),
    assetPath(`/logos/leagues/${k}.png`),
  ];
}

export function teamLogoCandidates(league: string, team: string): string[] {
  const l = league.toLowerCase().replace(/[^a-z0-9]/g, "");
  const leagueLower = league.toLowerCase();
  const t = team.toLowerCase().replace(/[^a-z0-9]/g, "");
  const teamSlug = team.toLowerCase().replace(/\s+/g, "-");
  const teamWords = team.toLowerCase().replace(/\s+/g, " ");

  // Extract just the team name (last word or mascot) for partial matching
  const parts = team.split(" ");
  const lastWord = parts[parts.length - 1].toLowerCase();
  const lastWordSlug = lastWord.replace(/[^a-z0-9]/g, "");

  // For EFL teams, also check "england football league" directory
  const eflDir = "england football league";

  const paths = [
    // Exact slug match
    assetPath(`/assets/teams/${leagueLower}/${teamSlug}.png`),
    assetPath(`/assets/teams/${l}/${teamSlug}.png`),
    // Slug with -logo suffix (common pattern in NFL/NBA/etc)
    assetPath(`/assets/teams/${l}/${teamSlug}-logo.png`),
    // League-prefixed (common pattern: nba-team-name-logo-480x480.png)
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo-480x480.png`),
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo.png`),
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo-2020-480x480.png`),
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo-2022-480x480.png`),
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo-2024-480x480.png`),
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo-2018-480x480.png`),
    assetPath(`/assets/teams/${l}/${l}-${teamSlug}-logo-300x300.png`),
    // Slug with @3x suffix
    assetPath(`/assets/teams/${l}/${teamSlug}-logo@3x.png`),
    assetPath(`/assets/teams/${l}/${teamSlug}-logo@2x.png`),
    assetPath(`/assets/teams/${l}/${teamSlug}-logo@4x.png`),
    // Stripped alphanumeric
    assetPath(`/assets/teams/${l}/${t}.png`),
    assetPath(`/assets/teams/${l}/${t}.svg`),
    assetPath(`/assets/teams/${leagueLower}/${t}.png`),
    assetPath(`/assets/teams/${leagueLower}/${teamWords}.png`),
    // Underscore-separated (brandlogos pattern: team_name_fc-logo...)
    assetPath(`/assets/teams/${l}/${teamSlug.replace(/-/g, "_")}-logo_brandlogos.net_.png`),
    // EFL teams in "england football league" directory
    assetPath(`/assets/teams/${eflDir}/${teamSlug}.png`),
    assetPath(`/assets/teams/${eflDir}/${teamSlug}-logo.png`),
    assetPath(`/assets/teams/${eflDir}/${teamSlug.replace(/-/g, "_")}-logo_brandlogos.net_.png`),
    assetPath(`/assets/teams/${eflDir}/${teamSlug.replace(/-/g, "_")}-logo-brandlogos.net_-768x768.png`),
    assetPath(`/assets/teams/${eflDir}/${teamSlug.replace(/-/g, "_")}_fc-logo_brandlogos.net_.png`),
    // Premier League teams in "premier league" and "england football league" directories
    assetPath(`/assets/teams/premier league/${teamSlug}.png`),
    assetPath(`/assets/teams/premier league/${teamSlug}-logo.png`),
    assetPath(`/assets/teams/${eflDir}/${teamSlug}-fc-logo-768x768.png`),
    assetPath(`/assets/teams/${eflDir}/${lastWordSlug}.png`),
    // UEFA teams
    assetPath(`/assets/teams/uefa champions league/${teamSlug}.png`),
    // Legacy paths
    assetPath(`/assets/leagues/teams/${league}/${team}.png`),
    assetPath(`/assets/leagues/teams/${l}/${t}.png`),
    assetPath(`/logos/teams/${l}/${t}.png`),
  ];

  return paths;
}

// ============================================================================
// PRELOAD UTILITIES
// ============================================================================

export function preloadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

export async function preloadFirstAvailable(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      const loaded = await preloadImage(candidate);
      return loaded;
    } catch {
      continue;
    }
  }
  return null;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const imageCache = new Map<string, string | null>();

export function getCachedImage(cacheKey: string): string | null | undefined {
  return imageCache.get(cacheKey);
}

export function cacheImage(cacheKey: string, imagePath: string | null): void {
  imageCache.set(cacheKey, imagePath);
}

export function clearImageCache(): void {
  imageCache.clear();
}
