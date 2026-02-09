export type PlatformId = string;

export type PlatformCategoryKey =
  | "premium_channels"
  | "premium_streaming"
  | "premium_sports_streaming"
  | "movie_streaming"
  | "documentaries"
  | "anime_asian"
  | "kids"
  | "livetv"
  | "free_streaming"
  | "indie_arthouse"
  | "horror_cult"
  | "lgbt"
  | "black_culture";

export type Platform = {
  id: PlatformId;
  name: string;
  categories: PlatformCategoryKey[];
  categoriesLabel: string;
  note: string;
  connectUrl?: string;
};

export type GenreCollection = {
  id: string;
  name: string;
  subtitle: string;
  assetKey?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  subtitle: string;
  platformId: PlatformId;
  platformName: string;
  isLive: boolean;
  badgeLeft: string;
  badgeRight: string;
  assetKey?: string;
};

export type UserProfile = {
  name: string;
  avatarDataUrl: string;
  headerImageDataUrl: string;
  aboutImage1?: string;
  aboutImage2?: string;

  favoritePlatforms: PlatformId[];
  favoriteGenres: string[];
  favoriteLeagues: string[];
  favoriteTeams: string[];

  connectedPlatforms: PlatformId[];
};

export type TvBrand = "Samsung" | "LG" | "Sony" | "Roku TV" | "Fire TV" | "Apple TV" | "Chromecast/Google TV" | "Vizio" | "Hisense";
export type TvPlan = "native_companion_app" | "local_hub" | "device_runtime";

export type TvConnectState =
  | { status: "disconnected"; brand: TvBrand; plan: TvPlan; deviceId: string; deviceName: string; capabilities: string[]; pairedAt: number }
  | { status: "connected"; brand: TvBrand; plan: TvPlan; deviceId: string; deviceName: string; capabilities: string[]; pairedAt: number };

export const TV_BRANDS: TvBrand[] = ["Samsung", "LG", "Sony", "Roku TV", "Fire TV", "Apple TV", "Chromecast/Google TV", "Vizio", "Hisense"];

export const TV_PLANS: Array<{ id: TvPlan; label: string }> = [
  { id: "native_companion_app", label: "Native companion app (discovery + pairing + control)" },
  { id: "local_hub", label: "Local hub (mDNS/SSDP + adapters + unified API)" },
  { id: "device_runtime", label: "Device runtime (embedded control agent / OS integration)" },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: "Demo User",
  avatarDataUrl: "",
  headerImageDataUrl: "",
  aboutImage1: "",
  aboutImage2: "",
  favoritePlatforms: ["netflix", "max", "youtube", "espnplus", "hulu", "primevideo"],
  favoriteGenres: ["sports", "movies", "documentaries", "anime"],
  favoriteLeagues: ["NBA", "NFL", "UFC"],
  favoriteTeams: [],
  connectedPlatforms: [],
};

export const DEFAULT_TV_STATE: TvConnectState = {
  status: "disconnected",
  brand: "Samsung",
  plan: "native_companion_app",
  deviceId: "",
  deviceName: "",
  capabilities: [],
  pairedAt: 0,
};

export const GENRE_COLLECTIONS: GenreCollection[] = [
  { id: "sports", name: "Sports", subtitle: "Live and highlights", assetKey: "sports" },
  { id: "movies", name: "Movies", subtitle: "Premium + free libraries", assetKey: "movies" },
  { id: "documentaries", name: "Documentaries", subtitle: "True stories and deep dives", assetKey: "documentaries" },
  { id: "anime", name: "Anime", subtitle: "Anime and Asian cinema", assetKey: "anime" },
  { id: "kids", name: "Kids", subtitle: "Family and kids picks", assetKey: "kids" },
  { id: "horror", name: "Horror / Cult", subtitle: "Cult classics and scares", assetKey: "horror" },
  { id: "indie", name: "Indie / Arthouse", subtitle: "Independent cinema", assetKey: "indie" },
  { id: "lgbt", name: "LGBT", subtitle: "LGBT-focused picks", assetKey: "lgbt" },
  { id: "black", name: "Black Culture", subtitle: "Black culture platforms", assetKey: "black-culture" },
];

function labelForCats(cats: PlatformCategoryKey[]): string {
  const m: Record<PlatformCategoryKey, string> = {
    premium_channels: "Premium Channels",
    premium_streaming: "Premium Streaming",
    premium_sports_streaming: "Premium Sports Streaming",
    movie_streaming: "Movie Streaming",
    documentaries: "Documentaries",
    anime_asian: "Anime / Asian Cinema",
    kids: "Kids",
    livetv: "LiveTV",
    free_streaming: "Free Streaming",
    indie_arthouse: "Indie & Arthouse",
    horror_cult: "Horror / Cult",
    lgbt: "LGBT",
    black_culture: "Black Culture",
  };
  const names = cats.map((c) => m[c]).filter(Boolean);
  return Array.from(new Set(names)).join(" • ");
}

export const PLATFORM_CATALOG: Platform[] = [
  // Core (common)
  { id: "netflix", name: "Netflix", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Movies + series" },
  { id: "max", name: "Max", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Movies + series" },
  { id: "primevideo", name: "Prime Video", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Movies + series" },
  { id: "hulu", name: "Hulu", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Movies + series" },
  { id: "hulutv", name: "HuluTV", categories: ["livetv"], categoriesLabel: labelForCats(["livetv"]), note: "Live TV bundle" },

  { id: "youtube", name: "YouTube", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Video platform" },
  { id: "youtubekids", name: "YouTube Kids", categories: ["kids"], categoriesLabel: labelForCats(["kids"]), note: "Kids-first YouTube" },
  { id: "youtubemovies", name: "YouTube Movies / Google TV", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Movie rentals & purchases" },

  // Sports / Live
  { id: "espnplus", name: "ESPN+", categories: ["premium_sports_streaming"], categoriesLabel: labelForCats(["premium_sports_streaming"]), note: "Sports streaming" },
  { id: "foxsports", name: "FOX Sports", categories: ["premium_sports_streaming"], categoriesLabel: labelForCats(["premium_sports_streaming"]), note: "Sports streaming" },
  { id: "fubo", name: "Fubo", categories: ["premium_sports_streaming", "livetv"], categoriesLabel: labelForCats(["premium_sports_streaming","livetv"]), note: "Sports-first live TV bundle" },
  { id: "paramountplus", name: "Paramount+", categories: ["premium_streaming"], categoriesLabel: labelForCats(["premium_streaming"]), note: "Premium streaming" },

  // Premium Channels / Add-ons
  { id: "betplus", name: "BET+", categories: ["premium_streaming", "black_culture"], categoriesLabel: labelForCats(["premium_streaming","black_culture"]), note: "Black culture premium streaming" },
  { id: "amcplus", name: "AMC+", categories: ["premium_streaming"], categoriesLabel: labelForCats(["premium_streaming"]), note: "Premium add-on" },
  { id: "starz", name: "Starz", categories: ["premium_channels","premium_streaming"], categoriesLabel: labelForCats(["premium_channels","premium_streaming"]), note: "Premium channel" },
  { id: "mgmplus", name: "MGM+", categories: ["premium_channels","premium_streaming"], categoriesLabel: labelForCats(["premium_channels","premium_streaming"]), note: "Premium channel" },

  // Movie streaming missing list
  { id: "criterion", name: "The Criterion Channel", categories: ["movie_streaming", "indie_arthouse"], categoriesLabel: labelForCats(["movie_streaming","indie_arthouse"]), note: "Also Arthouse" },
  { id: "mubi", name: "MUBI", categories: ["movie_streaming", "indie_arthouse"], categoriesLabel: labelForCats(["movie_streaming","indie_arthouse"]), note: "Also Arthouse" },
  { id: "fandango", name: "Fandango at Home (Vudu)", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Rent/buy movies" },
  { id: "moviesanywhere", name: "Movies Anywhere", categories: ["movie_streaming"], categoriesLabel: labelForCats(["movie_streaming"]), note: "Library aggregator" },

  // Documentaries
  { id: "curiositystream", name: "CuriosityStream", categories: ["documentaries"], categoriesLabel: labelForCats(["documentaries"]), note: "Documentaries" },
  { id: "magellantv", name: "MagellanTV", categories: ["documentaries"], categoriesLabel: labelForCats(["documentaries"]), note: "Documentaries" },

  // Anime / Asian Cinema
  { id: "crunchyroll", name: "Crunchyroll", categories: ["anime_asian"], categoriesLabel: labelForCats(["anime_asian"]), note: "Anime streaming" },
  { id: "hidive", name: "HIDIVE", categories: ["anime_asian"], categoriesLabel: labelForCats(["anime_asian"]), note: "Anime streaming" },
  { id: "viki", name: "Viki", categories: ["anime_asian"], categoriesLabel: labelForCats(["anime_asian"]), note: "Asian drama" },
  { id: "iqiyi", name: "iQIYI", categories: ["anime_asian"], categoriesLabel: labelForCats(["anime_asian"]), note: "Asian streaming" },
  { id: "asiancrush", name: "AsianCrush", categories: ["anime_asian"], categoriesLabel: labelForCats(["anime_asian"]), note: "Asian cinema" },

  // Kids
  { id: "pbskids", name: "PBS Kids", categories: ["kids"], categoriesLabel: labelForCats(["kids"]), note: "Kids picks" },
  { id: "kartoon", name: "Kartoon Channel", categories: ["kids"], categoriesLabel: labelForCats(["kids"]), note: "Kids streaming" },

  // Free streaming
  { id: "tubi", name: "Tubi", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "pluto", name: "Pluto TV", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "rokuchannel", name: "The Roku Channel", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "freevee", name: "Amazon Freevee", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "xumo", name: "Xumo Play", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "plex", name: "Plex", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "crackle", name: "Crackle", categories: ["free_streaming"], categoriesLabel: labelForCats(["free_streaming"]), note: "Free streaming" },
  { id: "revry", name: "Revry", categories: ["free_streaming","lgbt"], categoriesLabel: labelForCats(["free_streaming","lgbt"]), note: "Also LGBT" },

  // Indie / Arthouse
  { id: "ovid", name: "OVID.tv", categories: ["indie_arthouse"], categoriesLabel: labelForCats(["indie_arthouse"]), note: "Arthouse library" },
  { id: "fandor", name: "Fandor", categories: ["indie_arthouse"], categoriesLabel: labelForCats(["indie_arthouse"]), note: "Indie cinema" },
  { id: "kinocult", name: "Kino Cult", categories: ["indie_arthouse"], categoriesLabel: labelForCats(["indie_arthouse"]), note: "Cult + indie" },
  { id: "kanopy", name: "Kanopy", categories: ["indie_arthouse"], categoriesLabel: labelForCats(["indie_arthouse"]), note: "Library streaming" },

  // Horror / Cult
  { id: "shudder", name: "Shudder", categories: ["horror_cult"], categoriesLabel: labelForCats(["horror_cult"]), note: "Horror / cult" },
  { id: "screambox", name: "Screambox", categories: ["horror_cult"], categoriesLabel: labelForCats(["horror_cult"]), note: "Horror" },
  { id: "arrow", name: "Arrow Player", categories: ["horror_cult"], categoriesLabel: labelForCats(["horror_cult"]), note: "Cult cinema" },

  // Black Culture
  { id: "kwelitv", name: "KweliTV", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Black culture platform" },
  { id: "hbcugo", name: "HBCUGO", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Black culture + HBCU" },
  { id: "hbcugosports", name: "HBCUGO Sports", categories: ["black_culture","premium_sports_streaming"], categoriesLabel: labelForCats(["black_culture","premium_sports_streaming"]), note: "HBCU sports" },
  { id: "brownsugar", name: "Brown Sugar", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Black cinema" },
  { id: "americanu", name: "America Nu", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Black culture" },
  { id: "afroland", name: "AfroLandTV", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Black culture" },
  { id: "urbanflixtv", name: "UrbanFlixTV", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Black culture" },
  { id: "blackstar", name: "Black Star Network", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Connect via site", connectUrl: "https://app.blackstarnetwork.com/" },
  { id: "umc", name: "UMC (Urban Movie Channel)", categories: ["black_culture"], categoriesLabel: labelForCats(["black_culture"]), note: "Urban Movie Channel" },
];

export function buildRails(profile: UserProfile) {
  // Demo content set (logos should overlay on cards)
  const all: ContentItem[] = [
    { id: "live-fs1-soccer", title: "FS1: Soccer Night", subtitle: "Live match window", platformId: "foxsports", platformName: "FOX Sports", isLive: true, badgeLeft: "Live", badgeRight: "FS1", assetKey: "soccer-night" },
    { id: "live-espn-ufc", title: "UFC Fight Night", subtitle: "Main card", platformId: "espnplus", platformName: "ESPN+", isLive: true, badgeLeft: "Live", badgeRight: "UFC", assetKey: "ufc-fight-night" },
    { id: "cw-stranger", title: "Stranger Things", subtitle: "Continue Episode 4", platformId: "netflix", platformName: "Netflix", isLive: false, badgeLeft: "Resume", badgeRight: "Sci-fi", assetKey: "stranger-things" },
    { id: "cw-batman", title: "The Batman", subtitle: "Continue at 01:12:33", platformId: "max", platformName: "Max", isLive: false, badgeLeft: "Resume", badgeRight: "Movie", assetKey: "the-batman" },
    { id: "cw-crunchy", title: "Crunchyroll Picks", subtitle: "Continue queue", platformId: "crunchyroll", platformName: "Crunchyroll", isLive: false, badgeLeft: "Resume", badgeRight: "Anime", assetKey: "crunchyroll-picks" },
    { id: "cw-indie", title: "Indie Library", subtitle: "Continue watchlist", platformId: "criterion", platformName: "The Criterion Channel", isLive: false, badgeLeft: "Resume", badgeRight: "Arthouse", assetKey: "indie-library" },
    { id: "tr-top10", title: "Top 10 Today", subtitle: "Across streaming", platformId: "netflix", platformName: "Netflix", isLive: false, badgeLeft: "Trending", badgeRight: "Now", assetKey: "top-10-today" },
    { id: "tr-horror", title: "Horror / Cult Night", subtitle: "New arrivals", platformId: "shudder", platformName: "Shudder", isLive: false, badgeLeft: "Horror", badgeRight: "New", assetKey: "horror-cult-night" },
    { id: "tr-free", title: "Free Movies Marathon", subtitle: "Watch free", platformId: "tubi", platformName: "Tubi", isLive: false, badgeLeft: "Free", badgeRight: "No sign-up", assetKey: "free-movies" },
    { id: "tr-kids", title: "Kids: Bedtime Stories", subtitle: "Calm picks", platformId: "pbskids", platformName: "PBS Kids", isLive: false, badgeLeft: "Kids", badgeRight: "Safe", assetKey: "kids-bedtime" },
    { id: "live-gaming", title: "Live Gaming: Esports Finals", subtitle: "Championship", platformId: "youtube", platformName: "YouTube", isLive: true, badgeLeft: "Live", badgeRight: "Gaming", assetKey: "esports-finals" },
    { id: "lgbt-weekend", title: "LGBT: Weekend Premiere", subtitle: "New episode drop", platformId: "revry", platformName: "Revry", isLive: false, badgeLeft: "LGBT", badgeRight: "New", assetKey: "lgbt-weekend" },
  ];

  // Dedupe + ranking tuning:
  // - Boost favorites
  // - Slightly boost genre matches
  const favPlatforms = new Set(profile.favoritePlatforms);
  const favGenres = new Set(profile.favoriteGenres);

  function score(it: ContentItem): number {
    let s = 0;
    if (it.isLive) s += 4;
    if (favPlatforms.has(it.platformId)) s += 5;
    if (favGenres.has("sports") && (it.badgeRight.includes("UFC") || it.badgeRight.includes("FS1"))) s += 2;
    if (favGenres.has("anime") && it.platformId === "crunchyroll") s += 2;
    if (favGenres.has("documentaries") && (it.platformId === "curiositystream" || it.platformId === "magellantv")) s += 2;
    return s;
  }

  const sorted = [...all].sort((a, b) => score(b) - score(a));

  function takeUnique(filter: (x: ContentItem) => boolean, n: number, used: Set<string>) {
    const out: ContentItem[] = [];
    for (const it of sorted) {
      if (out.length >= n) break;
      if (used.has(it.id)) continue;
      if (!filter(it)) continue;
      used.add(it.id);
      out.push(it);
    }
    return out;
  }

  const used = new Set<string>();
  const liveNow = takeUnique((x) => x.isLive, 6, used);
  const continueWatching = takeUnique((x) => x.badgeLeft === "Resume", 8, used);
  const trending = takeUnique((x) => x.badgeLeft === "Trending" || x.badgeLeft === "Free" || x.badgeLeft === "Horror" || x.badgeLeft === "Kids", 10, used);
  const recommended = takeUnique(() => true, 10, used);

  return { liveNow, continueWatching, trending, recommended };
}
