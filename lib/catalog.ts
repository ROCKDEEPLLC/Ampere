// ============================================================================
// AMPERE PLATFORM CATALOG - UPDATED VERSION
// File: lib/catalog.ts
// 
// This file contains the complete platform catalog with all missing platforms
// added based on the gap analysis.
// 
// CHANGES FROM V.11:
// - Added 35+ missing streaming platforms
// - Added connectUrl support for platforms like Black Star Network
// - Organized by category with clear comments
// - All platforms now have proper genre categorization
// ============================================================================

export type GenreKey = (typeof GENRES)[number]["key"];
export type PlatformId = string;

export type Platform = {
  id: PlatformId;
  label: string;
  genres?: GenreKey[];
  kind?: "streaming" | "sports" | "kids" | "livetv" | "gaming" | "niche";
  connectUrl?: string; // For platforms requiring external connection
  note?: string; // Additional context for the platform
};

// ============================================================================
// GENRE DEFINITIONS
// ============================================================================

export const GENRES = [
  { key: "All" },
  { key: "Basic Streaming" },
  { key: "Premium Channels" },
  { key: "Premium Streaming" },
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

// ============================================================================
// PLATFORM CATALOG
// ============================================================================

export const PLATFORMS: Platform[] = [
  
  // --------------------------------------------------------------------------
  // BASIC STREAMING (Major Services)
  // --------------------------------------------------------------------------
  { 
    id: "netflix", 
    label: "Netflix", 
    kind: "streaming", 
    genres: ["Basic Streaming", "Movie Streaming", "Documentaries"],
    note: "Movies + series"
  },
  { 
    id: "hulu", 
    label: "Hulu", 
    kind: "streaming", 
    genres: ["Basic Streaming", "Movie Streaming"],
    note: "Movies + series"
  },
  { 
    id: "primevideo", 
    label: "Prime Video", 
    kind: "streaming", 
    genres: ["Basic Streaming", "Movie Streaming"],
    note: "Movies + series"
  },
  { 
    id: "disneyplus", 
    label: "Disney+", 
    kind: "streaming", 
    genres: ["Basic Streaming", "Kids"],
    note: "Disney, Pixar, Marvel, Star Wars"
  },
  { 
    id: "max", 
    label: "Max", 
    kind: "streaming", 
    genres: ["Movie Streaming", "Basic Streaming"],
    note: "HBO + Warner Bros content"
  },
  { 
    id: "peacock", 
    label: "Peacock", 
    kind: "streaming", 
    genres: ["Basic Streaming", "LiveTV"],
    note: "NBC Universal content"
  },
  { 
    id: "paramountplus", 
    label: "Paramount+", 
    kind: "streaming", 
    genres: ["Basic Streaming", "Premium Streaming", "LiveTV"],
    note: "CBS + Paramount content"
  },
  { 
    id: "appletv", 
    label: "Apple TV+", 
    kind: "streaming", 
    genres: ["Basic Streaming", "Movie Streaming"],
    note: "Apple Originals"
  },

  // --------------------------------------------------------------------------
  // PREMIUM CHANNELS / ADD-ONS (NEW - Request #11a)
  // --------------------------------------------------------------------------
  { 
    id: "betplus", 
    label: "BET+", 
    kind: "niche", 
    genres: ["Premium Streaming", "Premium Channels", "Black culture & diaspora"],
    note: "Black culture premium streaming"
  },
  { 
    id: "amcplus", 
    label: "AMC+", 
    kind: "streaming", 
    genres: ["Premium Streaming", "Premium Channels"],
    note: "AMC premium add-on"
  },
  { 
    id: "starz", 
    label: "Starz", 
    kind: "streaming", 
    genres: ["Premium Channels", "Premium Streaming", "Movie Streaming"],
    note: "Premium channel"
  },
  { 
    id: "mgmplus", 
    label: "MGM+", 
    kind: "streaming", 
    genres: ["Premium Channels", "Premium Streaming", "Movie Streaming"],
    note: "Premium channel"
  },

  // --------------------------------------------------------------------------
  // MOVIE STREAMING (Enhanced - Request #11b)
  // --------------------------------------------------------------------------
  { 
    id: "criterion", 
    label: "The Criterion Channel", 
    kind: "niche", 
    genres: ["Movie Streaming", "Indie and Arthouse Film"],
    note: "Classic & arthouse cinema"
  },
  { 
    id: "mubi", 
    label: "MUBI", 
    kind: "niche", 
    genres: ["Movie Streaming", "Indie and Arthouse Film"],
    note: "Curated arthouse films"
  },
  { 
    id: "fandango", 
    label: "Fandango at Home", 
    kind: "streaming", 
    genres: ["Movie Streaming"],
    note: "Formerly Vudu - rent/buy movies"
  },
  { 
    id: "youtubemovies", 
    label: "YouTube Movies", 
    kind: "streaming", 
    genres: ["Movie Streaming"],
    note: "Google TV movie rentals"
  },
  { 
    id: "moviesanywhere", 
    label: "Movies Anywhere", 
    kind: "streaming", 
    genres: ["Movie Streaming"],
    note: "Digital library aggregator"
  },

  // --------------------------------------------------------------------------
  // DOCUMENTARIES (Enhanced - Request #11c)
  // --------------------------------------------------------------------------
  { 
    id: "pbspassport", 
    label: "PBS Passport", 
    kind: "streaming", 
    genres: ["Documentaries"],
    note: "PBS premium membership"
  },
  { 
    id: "curiositystream", 
    label: "CuriosityStream", 
    kind: "streaming", 
    genres: ["Documentaries"],
    note: "Science & documentary streaming"
  },
  { 
    id: "magellantv", 
    label: "MagellanTV", 
    kind: "streaming", 
    genres: ["Documentaries"],
    note: "Documentary streaming service"
  },

  // --------------------------------------------------------------------------
  // ANIME / ASIAN CINEMA (Enhanced - Request #11d)
  // --------------------------------------------------------------------------
  { 
    id: "crunchyroll", 
    label: "Crunchyroll", 
    kind: "niche", 
    genres: ["Anime / Asian cinema"],
    note: "Leading anime platform"
  },
  { 
    id: "hidive", 
    label: "HIDIVE", 
    kind: "niche", 
    genres: ["Anime / Asian cinema"],
    note: "Anime streaming"
  },
  { 
    id: "viki", 
    label: "Viki", 
    kind: "niche", 
    genres: ["Anime / Asian cinema"],
    note: "Asian drama & variety"
  },
  { 
    id: "iqiyi", 
    label: "iQIYI", 
    kind: "niche", 
    genres: ["Anime / Asian cinema"],
    note: "Chinese streaming platform"
  },
  { 
    id: "asiancrush", 
    label: "AsianCrush", 
    kind: "niche", 
    genres: ["Anime / Asian cinema"],
    note: "Asian cinema streaming"
  },

  // --------------------------------------------------------------------------
  // KIDS (Enhanced - Request #11e)
  // --------------------------------------------------------------------------
  { 
    id: "pbskids", 
    label: "PBS Kids", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Educational kids content"
  },
  { 
    id: "noggin", 
    label: "Noggin", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Nick Jr. streaming"
  },
  { 
    id: "kidoodletv", 
    label: "Kidoodle.TV", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Safe kids streaming"
  },
  { 
    id: "happykids", 
    label: "HappyKids", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Kids entertainment"
  },
  { 
    id: "sensical", 
    label: "Sensical", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Kids streaming service"
  },
  { 
    id: "youtubekids", 
    label: "YouTube Kids", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Kids-first YouTube experience"
  },
  { 
    id: "kartoon", 
    label: "Kartoon Channel", 
    kind: "kids", 
    genres: ["Kids"],
    note: "Kids streaming channel"
  },

  // --------------------------------------------------------------------------
  // LIVE TV (Enhanced - Request #11f)
  // --------------------------------------------------------------------------
  { 
    id: "youtubetv", 
    label: "YouTube TV", 
    kind: "livetv", 
    genres: ["LiveTV", "Premium Sports Streaming"],
    note: "Live TV bundle"
  },
  { 
    id: "hulu-livetv", 
    label: "Hulu + Live TV", 
    kind: "livetv", 
    genres: ["LiveTV"],
    note: "Hulu with live TV bundle"
  },
  { 
    id: "sling", 
    label: "Sling TV", 
    kind: "livetv", 
    genres: ["LiveTV"],
    note: "Affordable live TV"
  },
  { 
    id: "fubotv", 
    label: "Fubo", 
    kind: "livetv", 
    genres: ["LiveTV", "Premium Sports Streaming"],
    note: "Sports-first live TV bundle"
  },

  // --------------------------------------------------------------------------
  // SPORTS STREAMING (Confirmed Fubo included per request)
  // --------------------------------------------------------------------------
  { 
    id: "espn", 
    label: "ESPN", 
    kind: "sports", 
    genres: ["Premium Sports Streaming", "LiveTV"],
    note: "ESPN linear channel"
  },
  { 
    id: "espnplus", 
    label: "ESPN+", 
    kind: "sports", 
    genres: ["Premium Sports Streaming"],
    note: "ESPN streaming service"
  },
  { 
    id: "foxsports1", 
    label: "FOX Sports", 
    kind: "sports", 
    genres: ["LiveTV", "Premium Sports Streaming"],
    note: "FOX sports networks"
  },
  { 
    id: "dazn", 
    label: "DAZN", 
    kind: "sports", 
    genres: ["Premium Sports Streaming"],
    note: "Combat sports & soccer"
  },
  { 
    id: "nflplus", 
    label: "NFL+", 
    kind: "sports", 
    genres: ["Premium Sports Streaming"],
    note: "NFL streaming"
  },
  { 
    id: "nbaleaguepass", 
    label: "NBA League Pass", 
    kind: "sports", 
    genres: ["Premium Sports Streaming"],
    note: "NBA streaming"
  },
  { 
    id: "mlbtv", 
    label: "MLB.TV", 
    kind: "sports", 
    genres: ["Premium Sports Streaming"],
    note: "MLB streaming"
  },
  { 
    id: "nhl", 
    label: "NHL", 
    kind: "sports", 
    genres: ["Premium Sports Streaming"],
    note: "NHL streaming"
  },
  { 
    id: "hbcugosports", 
    label: "HBCUGO Sports", 
    kind: "sports", 
    genres: ["Premium Sports Streaming", "Black culture & diaspora"],
    note: "HBCU sports streaming"
  },

  // --------------------------------------------------------------------------
  // FREE STREAMING (Massively Enhanced - Request #11g)
  // --------------------------------------------------------------------------
  { 
    id: "youtube", 
    label: "YouTube", 
    kind: "streaming", 
    genres: ["Free Streaming", "Gaming", "Documentaries"],
    note: "Free video platform"
  },
  { 
    id: "tubi", 
    label: "Tubi", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Free movies & TV"
  },
  { 
    id: "plutotv", 
    label: "Pluto TV", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Free live TV & movies"
  },
  { 
    id: "rokuchannel", 
    label: "The Roku Channel", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Roku's free streaming"
  },
  { 
    id: "freevee", 
    label: "Amazon Freevee", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Amazon's free streaming"
  },
  { 
    id: "xumo", 
    label: "Xumo Play", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Free streaming service"
  },
  { 
    id: "plex", 
    label: "Plex", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Free movies & personal media"
  },
  { 
    id: "crackle", 
    label: "Crackle", 
    kind: "streaming", 
    genres: ["Free Streaming"],
    note: "Free movies & shows"
  },
  { 
    id: "revry", 
    label: "Revry", 
    kind: "niche", 
    genres: ["Free Streaming", "LGBT"],
    note: "LGBTQ+ free streaming"
  },

  // --------------------------------------------------------------------------
  // GAMING
  // --------------------------------------------------------------------------
  { 
    id: "twitch", 
    label: "Twitch", 
    kind: "gaming", 
    genres: ["Gaming"],
    note: "Live game streaming"
  },
  { 
    id: "kick", 
    label: "Kick", 
    kind: "gaming", 
    genres: ["Gaming"],
    note: "Game streaming platform"
  },
  { 
    id: "xboxcloud", 
    label: "Xbox Cloud Gaming", 
    kind: "gaming", 
    genres: ["Gaming"],
    note: "Xbox cloud service"
  },
  { 
    id: "geforcenow", 
    label: "GeForce NOW", 
    kind: "gaming", 
    genres: ["Gaming"],
    note: "NVIDIA cloud gaming"
  },
  { 
    id: "playstationplus", 
    label: "PlayStation Plus", 
    kind: "gaming", 
    genres: ["Gaming"],
    note: "PlayStation cloud gaming"
  },
  { 
    id: "steam", 
    label: "Steam", 
    kind: "gaming", 
    genres: ["Gaming"],
    note: "PC gaming platform"
  },

  // --------------------------------------------------------------------------
  // INDIE & ARTHOUSE (Enhanced - Request #11h)
  // --------------------------------------------------------------------------
  { 
    id: "ovid", 
    label: "OVID.tv", 
    kind: "niche", 
    genres: ["Indie and Arthouse Film"],
    note: "Social justice cinema"
  },
  { 
    id: "fandor", 
    label: "Fandor", 
    kind: "niche", 
    genres: ["Indie and Arthouse Film"],
    note: "Independent cinema"
  },
  { 
    id: "kinocult", 
    label: "Kino Cult", 
    kind: "niche", 
    genres: ["Indie and Arthouse Film"],
    note: "Cult & indie films"
  },
  { 
    id: "kanopy", 
    label: "Kanopy", 
    kind: "niche", 
    genres: ["Indie and Arthouse Film"],
    note: "Library card streaming"
  },

  // --------------------------------------------------------------------------
  // HORROR / CULT (Enhanced - Request #11i)
  // --------------------------------------------------------------------------
  { 
    id: "shudder", 
    label: "Shudder", 
    kind: "niche", 
    genres: ["Horror / Cult"],
    note: "Horror, thriller, supernatural"
  },
  { 
    id: "screambox", 
    label: "Screambox", 
    kind: "niche", 
    genres: ["Horror / Cult"],
    note: "Horror streaming"
  },
  { 
    id: "arrow", 
    label: "Arrow Player", 
    kind: "niche", 
    genres: ["Horror / Cult"],
    note: "Cult cinema streaming"
  },

  // --------------------------------------------------------------------------
  // LGBT (Enhanced - Request #11j)
  // --------------------------------------------------------------------------
  { 
    id: "heretv", 
    label: "HERE TV", 
    kind: "niche", 
    genres: ["LGBT"],
    note: "LGBTQ+ entertainment"
  },
  { 
    id: "outtv", 
    label: "OUTtv", 
    kind: "niche", 
    genres: ["LGBT"],
    note: "LGBTQ+ network"
  },
  { 
    id: "dekkoo", 
    label: "Dekkoo", 
    kind: "niche", 
    genres: ["LGBT"],
    note: "LGBTQ+ streaming"
  },
  // Note: Revry already listed in Free Streaming section with LGBT genre

  // --------------------------------------------------------------------------
  // BLACK CULTURE & DIASPORA (Massively Enhanced - Request #11k)
  // --------------------------------------------------------------------------
  { 
    id: "hbcugo", 
    label: "HBCUGO", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "HBCU content & culture"
  },
  { 
    id: "kwelitv", 
    label: "KweliTV", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Black culture streaming"
  },
  { 
    id: "brownsugar", 
    label: "Brown Sugar", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Classic Black cinema"
  },
  { 
    id: "americanu", 
    label: "America Nu", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Black culture platform"
  },
  { 
    id: "afrolandtv", 
    label: "AfroLandTV", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "African diaspora content"
  },
  { 
    id: "urbanflixtv", 
    label: "UrbanFlixTV", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Urban entertainment"
  },
  { 
    id: "blackstarnetwork", 
    label: "Black Star Network", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Connect via external site",
    connectUrl: "https://app.blackstarnetwork.com/"
  },
  { 
    id: "umc", 
    label: "UMC", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Urban Movie Channel"
  },
  { 
    id: "blackmedia", 
    label: "Black Media", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Black culture media"
  },
  { 
    id: "allblk", 
    label: "ALLBLK", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Black streaming service"
  },
  { 
    id: "mansa", 
    label: "MANSA", 
    kind: "niche", 
    genres: ["Black culture & diaspora"],
    note: "Black empowerment media"
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const ALL_PLATFORM_IDS = PLATFORMS.map((p) => p.id);

/**
 * Get platform by ID
 */
export function platformById(id: PlatformId): Platform | null {
  return PLATFORMS.find((p) => p.id === id) ?? null;
}

/**
 * Normalize string for matching (remove special chars, lowercase)
 */
function normalizeKey(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Find platform ID from label (fuzzy matching)
 */
export function platformIdFromLabel(label: string): PlatformId | null {
  const k = normalizeKey(label);
  if (!k) return null;
  
  // Try exact match first
  const exact = PLATFORMS.find((p) => normalizeKey(p.label) === k);
  if (exact) return exact.id;
  
  // Try partial match
  const includes = PLATFORMS.find(
    (p) => normalizeKey(p.label).includes(k) || k.includes(normalizeKey(p.label))
  );
  return includes?.id ?? null;
}

/**
 * Get all platforms for a specific genre
 */
export function platformsForGenre(genre: GenreKey): PlatformId[] {
  if (genre === "All") {
    return ["all", ...ALL_PLATFORM_IDS, "livetv"];
  }
  
  const ids = PLATFORMS
    .filter((p) => (p.genres ?? []).includes(genre))
    .map((p) => p.id);
  
  return ["all", ...Array.from(new Set(ids)), "livetv"];
}

/**
 * Get all platforms by category/kind
 */
export function platformsByKind(kind: Platform["kind"]): Platform[] {
  return PLATFORMS.filter((p) => p.kind === kind);
}

/**
 * Search platforms by query
 */
export function searchPlatforms(query: string): Platform[] {
  const q = normalizeKey(query);
  if (!q) return [];
  
  return PLATFORMS.filter((p) => {
    const labelMatch = normalizeKey(p.label).includes(q);
    const noteMatch = p.note && normalizeKey(p.note).includes(q);
    const genreMatch = (p.genres ?? []).some((g) => normalizeKey(g).includes(q));
    return labelMatch || noteMatch || genreMatch;
  });
}
