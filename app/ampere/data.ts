import { assetPath, normalizeKey, uniq } from "./lib/utils";
import type { GenreKey, Platform, PlatformId, TVBrandId, TVConnectPlanId } from "./types";

/* =========================
   Genres (Browse -> Genre)
   ========================= */

export const GENRES: { key: GenreKey }[] = [
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
];

/* =========================
   Platforms (expanded)
   ========================= */

export const PLATFORMS: Platform[] = [
  // core streaming
  { id: "netflix", label: "Netflix", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming", "Documentaries"] },
  { id: "hulu", label: "Hulu", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "primevideo", label: "Prime Video", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "disneyplus", label: "Disney+", kind: "streaming", genres: ["Basic Streaming", "Kids"] },
  { id: "max", label: "Max", kind: "streaming", genres: ["Movie Streaming", "Basic Streaming"] },
  { id: "peacock", label: "Peacock", kind: "streaming", genres: ["Basic Streaming", "LiveTV"] },
  { id: "paramountplus", label: "Paramount+", kind: "streaming", genres: ["Basic Streaming", "LiveTV"] },
  { id: "appletv", label: "Apple TV", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },

  // missing-but-common adds
  { id: "plutotv", label: "Pluto TV", kind: "fast", genres: ["Free Streaming", "LiveTV"] },
  { id: "therokuchannel", label: "The Roku Channel", kind: "fast", genres: ["Free Streaming", "LiveTV"] },
  { id: "plex", label: "Plex", kind: "fast", genres: ["Free Streaming", "LiveTV"] },
  { id: "crackle", label: "Crackle", kind: "fast", genres: ["Free Streaming"] },
  { id: "showtime", label: "Showtime", kind: "streaming", genres: ["Movie Streaming", "Basic Streaming"] },
  { id: "starz", label: "STARZ", kind: "streaming", genres: ["Movie Streaming"] },

  // video / creators
  { id: "youtube", label: "YouTube", kind: "streaming", genres: ["Gaming", "Documentaries", "Free Streaming"] },
  { id: "youtubetv", label: "YouTube TV", kind: "livetv", genres: ["LiveTV", "Premium Sports Streaming"] },
  { id: "twitch", label: "Twitch", kind: "gaming", genres: ["Gaming"] },

  // live tv bundles
  { id: "sling", label: "Sling", kind: "livetv", genres: ["LiveTV"] },
  { id: "fubotv", label: "Fubo", kind: "livetv", genres: ["LiveTV", "Premium Sports Streaming"] },

  // sports
  { id: "espn", label: "ESPN", kind: "sports", genres: ["Premium Sports Streaming", "LiveTV"] },
  { id: "espnplus", label: "ESPN+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "dazn", label: "DAZN", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nflplus", label: "NFL+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nbaleaguepass", label: "NBA League Pass", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "mlbtv", label: "MLB.TV", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nhl", label: "NHL", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "foxsports1", label: "FOX Sports 1", kind: "sports", genres: ["LiveTV", "Premium Sports Streaming"] },

  // kids
  { id: "pbskids", label: "PBS Kids", kind: "kids", genres: ["Kids"] },
  { id: "pbspassport", label: "PBS Passport", kind: "streaming", genres: ["Documentaries"] },
  { id: "noggin", label: "Noggin", kind: "kids", genres: ["Kids"] },
  { id: "kidoodletv", label: "Kidoodle.TV", kind: "kids", genres: ["Kids"] },
  { id: "happykids", label: "HappyKids", kind: "kids", genres: ["Kids"] },
  { id: "sensical", label: "Sensical", kind: "kids", genres: ["Kids"] },

  // niche
  { id: "heretv", label: "HERE TV", kind: "niche", genres: ["LGBT"] },
  { id: "outtv", label: "OUTtv", kind: "niche", genres: ["LGBT"] },
  { id: "dekkoo", label: "Dekkoo", kind: "niche", genres: ["LGBT"] },

  { id: "mubi", label: "MUBI", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "criterion", label: "Criterion", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "crunchyroll", label: "Crunchyroll", kind: "niche", genres: ["Anime / Asian cinema"] },
  { id: "shudder", label: "Shudder", kind: "niche", genres: ["Horror / Cult"] },

  // gaming cloud
  { id: "xboxcloud", label: "Xbox Cloud", kind: "gaming", genres: ["Gaming"] },
  { id: "geforcenow", label: "GeForce NOW", kind: "gaming", genres: ["Gaming"] },
  { id: "playstationplus", label: "PlayStation Plus", kind: "gaming", genres: ["Gaming"] },
  { id: "steam", label: "Steam", kind: "gaming", genres: ["Gaming"] },

  // black culture & diaspora / HBCU
  { id: "hbcugo", label: "HBCUGO", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "hbcugosports", label: "HBCUGO Sports", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "blackstarnetwork", label: "Black Star Network", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "mansa", label: "MANSA", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "allblk", label: "ALLBLK", kind: "niche", genres: ["Black culture & diaspora"] },
];

export const ALL_PLATFORM_IDS = PLATFORMS.map((p) => p.id);

export function platformById(id: PlatformId) {
  return PLATFORMS.find((p) => p.id === id) ?? null;
}

export function platformIdFromLabel(label: string): PlatformId | null {
  const k = normalizeKey(label);
  if (!k) return null;
  const exact = PLATFORMS.find((p) => normalizeKey(p.label) === k);
  if (exact) return exact.id;
  const includes = PLATFORMS.find((p) => normalizeKey(p.label).includes(k) || k.includes(normalizeKey(p.label)));
  return includes?.id ?? null;
}

export function platformsForGenre(genre: GenreKey): PlatformId[] {
  if (genre === "All") return ["all", ...ALL_PLATFORM_IDS, "livetv"];
  const ids = PLATFORMS.filter((p) => (p.genres ?? []).includes(genre)).map((p) => p.id);
  return ["all", ...uniq(ids), "livetv"];
}

/* =========================
   Brand assets
   ========================= */

export function brandWideCandidates() {
  return [
    assetPath("/brand/ampere-wide.svg"),
    assetPath("/brand/ampere-wide.png"),
    assetPath("/assets/brand/ampere-wide.svg"),
    assetPath("/assets/brand/ampere-wide.png"),
    assetPath("/brand/ampere-wordmark.svg"),
    assetPath("/brand/ampere-long.svg"),
  ];
}

export function brandMarkCandidates() {
  return [
    assetPath("/brand/ampere-mark.svg"),
    assetPath("/brand/ampere-mark.png"),
    assetPath("/assets/brand/ampere-mark.svg"),
    assetPath("/assets/brand/ampere-mark.png"),
    assetPath("/brand/ampere-icon.svg"),
    assetPath("/brand/ampere-short.svg"),
  ];
}

/* =========================
   Icon candidate helpers
   ========================= */

export function platformIconCandidates(pid: PlatformId) {
  const raw = String(pid ?? "");
  const base = normalizeKey(raw);

  const variants = uniq(
    [
      base,
      raw.toLowerCase(),
      raw.toLowerCase().replace(/\s+/g, ""),
      raw.toLowerCase().replace(/\s+/g, "-"),
      raw.toLowerCase().replace(/\s+/g, "_"),
      base.endsWith("plus") ? `${base.slice(0, -4)}+` : null,
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

export function leagueLogoCandidates(league?: string) {
  const k = normalizeKey(league ?? "");
  if (!k) return [];
  return [
    assetPath(`/logos/leagues/${k}.png`),
    assetPath(`/logos/leagues/${k}.svg`),
    assetPath(`/assets/leagues/${k}.png`),
    assetPath(`/assets/leagues/${k}.svg`),
  ];
}

/** ✅ Genre imagery fix: try multiple roots + normalized names */
export function genreIconCandidates(genre: GenreKey) {
  const key = normalizeKey(genre);
  const roots = [
    "/assets/genre",
    "/assets/genres",
    "/assets/browse",
    "/assets/categories",
    "/assets/genre-icons",
  ];
  const names = uniq([
    key,
    key.replace(/cinema/g, "film"),
    key.replace(/livetv/g, "live-tv"),
  ]);

  const out: string[] = [];
  for (const r of roots) {
    for (const n of names) {
      out.push(assetPath(`${r}/${n}/icon.png`));
      out.push(assetPath(`${r}/${n}/icon.svg`));
      out.push(assetPath(`${r}/${n}.png`));
      out.push(assetPath(`${r}/${n}.svg`));
    }
  }

  // All uses brand mark as fallback candidate
  if (genre === "All") return [...brandMarkCandidates(), ...out];
  return out;
}

/* =========================
   TV Connect (brands + plans)
   ========================= */

export const TV_BRANDS: { id: TVBrandId; label: string }[] = [
  { id: "samsung", label: "Samsung" },
  { id: "lg", label: "LG" },
  { id: "sony", label: "Sony" },
  { id: "tcl", label: "TCL" },
  { id: "hisense", label: "Hisense" },
  { id: "vizio", label: "Vizio" },
  { id: "roku", label: "Roku TV" },
  { id: "firetv", label: "Fire TV" },
  { id: "appletv", label: "Apple TV" },
  { id: "androidtv", label: "Android TV" },
  { id: "chromecast", label: "Chromecast" },
];

export const TV_CONNECT_PLANS: {
  id: TVConnectPlanId;
  label: string;
  priceLabel: string;
  bullets: string[];
}[] = [
  {
    id: "starter",
    label: "Starter",
    priceLabel: "Free",
    bullets: ["Manual pairing", "Basic input control", "Launch apps (handoff)"],
  },
  {
    id: "plus",
    label: "Plus",
    priceLabel: "$4.99/mo",
    bullets: ["Device discovery (local network)", "CEC control (where supported)", "Quick-switch inputs"],
  },
  {
    id: "pro",
    label: "Pro",
    priceLabel: "$9.99/mo",
    bullets: ["Multi-room", "Automations / scenes", "Priority device profiles"],
  },
];

export function tvBrandLogoCandidates(id: TVBrandId) {
  const k = normalizeKey(id);
  return [
    assetPath(`/assets/tv/${k}.png`),
    assetPath(`/assets/tv/${k}.svg`),
    assetPath(`/logos/tv/${k}.png`),
    assetPath(`/logos/tv/${k}.svg`),
  ];
}
