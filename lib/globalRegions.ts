// ============================================================================
// AMPERE GLOBAL REGIONS
// File: lib/globalRegions.ts
//
// Implements:
// - Global region definitions with languages and locales
// - Popular streaming platforms per region
// - Local/niche platforms for the App Store per region
// - Language translation option logic
//   • User in America choosing other-region favorites may keep English
//   • User in other regions choosing US platforms may keep local language
// - Soccer/football/rugby leagues per region
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface GlobalRegion {
  id: string;
  name: string;
  emoji: string;
  subregions: string[];
  defaultLanguage: string;
  supportedLanguages: Language[];
  popularPlatforms: string[];      // platformIds available broadly in the region
  localPlatforms: string[];        // niche/local platformIds for App Store
  sportsLeagues: string[];         // league keys (mapped in catalog.ts)
}

export interface Language {
  code: string;       // ISO 639-1
  name: string;       // English name
  nativeName: string; // Name in the language itself
}

export interface TranslationPreference {
  regionId: string;
  displayLanguage: string;       // Language code the user wants the UI in
  contentLanguage: string;       // Language code the user prefers for content
  keepEnglishForForeign: boolean; // If true, show English UI even when browsing foreign content
}

// ============================================================================
// LANGUAGES
// ============================================================================

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Espa\u00f1ol" },
  { code: "pt", name: "Portuguese", nativeName: "Portugu\u00eas" },
  { code: "fr", name: "French", nativeName: "Fran\u00e7ais" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "tr", name: "Turkish", nativeName: "T\u00fcrk\u00e7e" },
  { code: "ru", name: "Russian", nativeName: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { code: "ar", name: "Arabic", nativeName: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "hi", name: "Hindi", nativeName: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "bn", name: "Bengali", nativeName: "\u09ac\u09be\u0982\u09b2\u09be" },
  { code: "ta", name: "Tamil", nativeName: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd" },
  { code: "te", name: "Telugu", nativeName: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41" },
  { code: "zh", name: "Chinese (Mandarin)", nativeName: "\u4e2d\u6587" },
  { code: "ja", name: "Japanese", nativeName: "\u65e5\u672c\u8a9e" },
  { code: "ko", name: "Korean", nativeName: "\ud55c\uad6d\uc5b4" },
  { code: "th", name: "Thai", nativeName: "\u0e44\u0e17\u0e22" },
  { code: "vi", name: "Vietnamese", nativeName: "Ti\u1ebfng Vi\u1ec7t" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", nativeName: "Filipino" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "yo", name: "Yoruba", nativeName: "Yor\u00f9b\u00e1" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
  { code: "am", name: "Amharic", nativeName: "\u12a0\u121b\u122d\u129b" },
  { code: "he", name: "Hebrew", nativeName: "\u05e2\u05d1\u05e8\u05d9\u05ea" },
];

// ============================================================================
// GLOBAL REGIONS
// ============================================================================

export const GLOBAL_REGIONS: GlobalRegion[] = [
  // ── NORTH AMERICA ──
  {
    id: "north_america",
    name: "North America",
    emoji: "\ud83c\uddfa\ud83c\uddf8",
    subregions: ["United States", "Canada", "Mexico"],
    defaultLanguage: "en",
    supportedLanguages: LANGUAGES.filter((l) => ["en", "es", "fr"].includes(l.code)),
    popularPlatforms: [
      "netflix", "hulu", "primevideo", "disneyplus", "max", "peacock",
      "paramountplus", "appletv", "youtube", "espnplus", "youtubetv",
    ],
    localPlatforms: [
      "tubi", "pluto", "roku", "crackle", "xumo", "plex",
      "slingtv", "fubo", "philo", "amcplus", "starz", "mgmplus",
      "betplus", "criterion", "mubi", "shudder", "crunchyroll",
    ],
    sportsLeagues: [
      "NFL", "NBA", "MLB", "NHL", "MLS", "NCAA",
      "UFC", "IFL",
    ],
  },

  // ── LATIN AMERICA & CARIBBEAN ──
  {
    id: "latin_america",
    name: "Latin America & Caribbean",
    emoji: "\ud83c\udde7\ud83c\uddf7",
    subregions: [
      "Brazil", "Argentina", "Colombia", "Chile", "Peru",
      "Ecuador", "Venezuela", "Uruguay", "Paraguay", "Bolivia",
      "Central America", "Caribbean",
    ],
    defaultLanguage: "es",
    supportedLanguages: LANGUAGES.filter((l) => ["es", "pt", "en"].includes(l.code)),
    popularPlatforms: [
      "netflix", "primevideo", "disneyplus", "max", "paramountplus",
      "appletv", "youtube", "vixpremium", "directvdeportes",
    ],
    localPlatforms: [
      "fubolatino", "slinglatino", "espndeportes", "telemundodeportes",
      "univision", "telemundo", "estrella", "cinelatinotv", "pantaya",
      "xfinitynowlatino", "globoplay", "clarovideo", "blim", "starzplay_latam",
    ],
    sportsLeagues: [
      "Argentine Primera", "Brasileir\u00e3o S\u00e9rie A", "Chilean Primera",
      "Colombian Liga BetPlay", "Copa Libertadores", "Copa Sudamericana",
      "Ecuadorian Liga Pro", "Paraguayan Primera", "Peruvian Liga 1",
      "Uruguayan Primera", "Venezuelan Primera", "MLS",
    ],
  },

  // ── EUROPE ──
  {
    id: "europe",
    name: "Europe",
    emoji: "\ud83c\uddea\ud83c\uddfa",
    subregions: [
      "United Kingdom", "France", "Germany", "Spain", "Italy",
      "Netherlands", "Scandinavia", "Eastern Europe", "Balkans",
      "Portugal", "Ireland", "Switzerland", "Austria", "Belgium",
    ],
    defaultLanguage: "en",
    supportedLanguages: LANGUAGES.filter((l) =>
      ["en", "fr", "de", "es", "it", "nl", "sv", "no", "da", "fi", "pl", "tr", "ru"].includes(l.code)
    ),
    popularPlatforms: [
      "netflix", "primevideo", "disneyplus", "appletv", "youtube",
      "max", "paramountplus",
    ],
    localPlatforms: [
      "skygo", "nowtv_uk", "britbox", "itv_hub", "channel4", "bbc_iplayer",
      "canal_plus", "salto", "orf", "zdf", "rtlplus", "joyn",
      "movistarplus", "atresplayer", "rai_play", "videoland",
      "viaplay", "tv2play", "svtplay", "yle_areena", "cmore",
      "hbonordic", "nrktv", "player_pl", "voyo", "kinopoisk",
      "ivi_ru", "okko", "megogo", "dazn",
    ],
    sportsLeagues: [
      "Premier League", "France Ligue 1", "EFL League One", "EFL League Two",
      "UEFA Champions League", "La Liga", "Bundesliga", "Serie A",
      "Eredivisie", "Primeira Liga", "Scottish Premiership",
      "Super Lig", "Russian Premier League",
    ],
  },

  // ── MIDDLE EAST & NORTH AFRICA ──
  {
    id: "mena",
    name: "Middle East & North Africa",
    emoji: "\ud83c\uddf8\ud83c\udde6",
    subregions: [
      "Saudi Arabia", "UAE", "Qatar", "Egypt", "Morocco",
      "Tunisia", "Algeria", "Iraq", "Jordan", "Lebanon",
      "Kuwait", "Bahrain", "Oman", "Israel",
    ],
    defaultLanguage: "ar",
    supportedLanguages: LANGUAGES.filter((l) => ["ar", "en", "fr", "he", "tr"].includes(l.code)),
    popularPlatforms: [
      "netflix", "primevideo", "disneyplus", "appletv", "youtube",
    ],
    localPlatforms: [
      "shahid", "starzplay_mena", "osn", "wavo", "viu_mena",
      "toonamiapp", "beinsports_connect", "weyyak", "jawwy",
    ],
    sportsLeagues: [
      "Saudi Pro League", "Egyptian Premier League", "UAE Pro League",
      "Qatar Stars League", "UEFA Champions League", "Premier League",
    ],
  },

  // ── SUB-SAHARAN AFRICA ──
  {
    id: "sub_saharan_africa",
    name: "Sub-Saharan Africa",
    emoji: "\ud83c\uddf3\ud83c\uddec",
    subregions: [
      "Nigeria", "Kenya", "South Africa", "Ghana", "Tanzania",
      "Ethiopia", "Uganda", "Cameroon", "Senegal", "C\u00f4te d'Ivoire",
    ],
    defaultLanguage: "en",
    supportedLanguages: LANGUAGES.filter((l) => ["en", "fr", "sw", "yo", "ha", "am"].includes(l.code)),
    popularPlatforms: [
      "netflix", "primevideo", "youtube", "disneyplus",
    ],
    localPlatforms: [
      "showmax", "dstvnow", "iroko", "viusasa",
      "afrolandtv", "kwelitv", "startimes_on",
      "boomplay", "trace_play",
    ],
    sportsLeagues: [
      "South African Premier Division", "Nigerian NPFL",
      "Kenyan Premier League", "CAF Champions League",
      "Premier League", "La Liga",
    ],
  },

  // ── SOUTH ASIA ──
  {
    id: "south_asia",
    name: "South Asia",
    emoji: "\ud83c\uddee\ud83c\uddf3",
    subregions: [
      "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
    ],
    defaultLanguage: "hi",
    supportedLanguages: LANGUAGES.filter((l) => ["en", "hi", "bn", "ta", "te"].includes(l.code)),
    popularPlatforms: [
      "netflix", "primevideo", "disneyplus", "youtube",
    ],
    localPlatforms: [
      "jiocinema", "sonyliv", "zee5", "hotstar", "voot",
      "altbalaji", "mxplayer", "aha", "hoichoi", "erosnow",
      "sunnxt", "adda247", "tapmad",
    ],
    sportsLeagues: [
      "Indian Super League", "I-League", "IPL Cricket",
      "Pakistan Super League", "Premier League",
      "UEFA Champions League",
    ],
  },

  // ── EAST & SOUTHEAST ASIA ──
  {
    id: "east_southeast_asia",
    name: "East & Southeast Asia",
    emoji: "\ud83c\uddef\ud83c\uddf5",
    subregions: [
      "Japan", "South Korea", "China", "Taiwan", "Hong Kong",
      "Thailand", "Philippines", "Indonesia", "Malaysia",
      "Vietnam", "Singapore",
    ],
    defaultLanguage: "en",
    supportedLanguages: LANGUAGES.filter((l) =>
      ["en", "zh", "ja", "ko", "th", "vi", "id", "ms", "tl"].includes(l.code)
    ),
    popularPlatforms: [
      "netflix", "primevideo", "disneyplus", "youtube", "appletv",
    ],
    localPlatforms: [
      "viki", "iqiyi", "wetv", "viu", "tving", "wavve", "coupangplay",
      "abema", "unext", "dtv_japan", "bilibili", "youku", "mango",
      "vidio", "iflix", "mewatch", "trueid", "vivamax",
      "crunchyroll", "hidive", "asiancrush",
    ],
    sportsLeagues: [
      "J-League", "K-League", "Chinese Super League",
      "Thai League", "V-League", "Liga 1 Indonesia",
      "Philippine Football League",
      "AFC Champions League",
    ],
  },

  // ── OCEANIA ──
  {
    id: "oceania",
    name: "Oceania",
    emoji: "\ud83c\udde6\ud83c\uddfa",
    subregions: ["Australia", "New Zealand", "Pacific Islands"],
    defaultLanguage: "en",
    supportedLanguages: LANGUAGES.filter((l) => ["en"].includes(l.code)),
    popularPlatforms: [
      "netflix", "primevideo", "disneyplus", "appletv", "youtube",
      "paramountplus", "max",
    ],
    localPlatforms: [
      "stan", "binge", "kayo", "foxtel_go", "tenplay",
      "nineplay", "abc_iview", "sbs_on_demand",
      "neon", "sparksport", "three_now",
    ],
    sportsLeagues: [
      "A-League", "NRL", "AFL", "Super Rugby",
      "ANZ Premiership", "Premier League",
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getRegionById(regionId: string): GlobalRegion | undefined {
  return GLOBAL_REGIONS.find((r) => r.id === regionId);
}

export function getRegionsForPlatform(platformId: string): GlobalRegion[] {
  return GLOBAL_REGIONS.filter(
    (r) => r.popularPlatforms.includes(platformId) || r.localPlatforms.includes(platformId)
  );
}

export function getAllPlatformsForRegion(regionId: string): string[] {
  const region = getRegionById(regionId);
  if (!region) return [];
  return [...region.popularPlatforms, ...region.localPlatforms];
}

export function getLanguagesForRegion(regionId: string): Language[] {
  const region = getRegionById(regionId);
  return region?.supportedLanguages ?? [];
}

/**
 * Determine translation preference:
 * - A US user browsing Latin American content can keep English UI
 * - A Brazilian user browsing US content can keep Portuguese UI
 */
export function resolveTranslationPreference(
  userRegionId: string,
  contentRegionId: string,
  userPreferredLanguage: string
): TranslationPreference {
  const userRegion = getRegionById(userRegionId);
  const contentRegion = getRegionById(contentRegionId);

  const isCrossRegion = userRegionId !== contentRegionId;

  return {
    regionId: userRegionId,
    displayLanguage: userPreferredLanguage,
    contentLanguage: isCrossRegion
      ? (contentRegion?.defaultLanguage ?? userPreferredLanguage)
      : userPreferredLanguage,
    keepEnglishForForeign: isCrossRegion && userPreferredLanguage === "en",
  };
}

/**
 * Get all "App Store" platforms for a region — local/niche ones not shown
 * in the main setup wizard but available for manual install.
 */
export function getAppStorePlatforms(regionId: string): string[] {
  const region = getRegionById(regionId);
  return region?.localPlatforms ?? [];
}

/**
 * Get sports leagues relevant to a region.
 */
export function getSportsLeaguesForRegion(regionId: string): string[] {
  const region = getRegionById(regionId);
  return region?.sportsLeagues ?? [];
}
