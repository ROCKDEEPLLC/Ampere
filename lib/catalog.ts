// ============================================================================
// AMPERE PLATFORM CATALOG - COMPLETE VERSION
// File: lib/catalog.ts
//
// Complete platform catalog with ALL platforms listed in request items #11-12.
// ============================================================================

export type GenreKey = (typeof GENRES)[number]["key"];
export type PlatformId = string;

export type Platform = {
  id: PlatformId;
  label: string;
  genres?: GenreKey[];
  kind?: "streaming" | "sports" | "kids" | "livetv" | "gaming" | "niche";
  connectUrl?: string;
  note?: string;
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
  // ---- BASIC STREAMING ----
  { id: "netflix", label: "Netflix", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming", "Documentaries"] },
  { id: "hulu", label: "Hulu", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "primevideo", label: "Prime Video", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "disneyplus", label: "Disney+", kind: "streaming", genres: ["Basic Streaming", "Kids"] },
  { id: "max", label: "Max", kind: "streaming", genres: ["Movie Streaming", "Basic Streaming"] },
  { id: "peacock", label: "Peacock", kind: "streaming", genres: ["Basic Streaming", "LiveTV"] },
  { id: "paramountplus", label: "Paramount+", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "appletv", label: "Apple TV+", kind: "streaming", genres: ["Basic Streaming", "Movie Streaming"] },
  { id: "youtube", label: "YouTube", kind: "streaming", genres: ["Free Streaming"] },

  // ---- PREMIUM CHANNELS (add-on brands) ----
  { id: "betplus", label: "BET+", kind: "streaming", genres: ["Premium Channels", "Premium Streaming", "Black culture & diaspora"] },
  { id: "amcplus", label: "AMC+", kind: "streaming", genres: ["Premium Channels", "Premium Streaming"] },
  { id: "starz", label: "Starz", kind: "streaming", genres: ["Premium Channels", "Premium Streaming", "Movie Streaming"] },
  { id: "mgmplus", label: "MGM+", kind: "streaming", genres: ["Premium Channels", "Premium Streaming", "Movie Streaming"] },

  // ---- MOVIE STREAMING ----
  { id: "criterion", label: "The Criterion Channel", kind: "streaming", genres: ["Movie Streaming", "Indie and Arthouse Film"] },
  { id: "mubi", label: "MUBI", kind: "streaming", genres: ["Movie Streaming", "Indie and Arthouse Film"] },
  { id: "fandango", label: "Fandango at Home", kind: "streaming", genres: ["Movie Streaming"], note: "Formerly Vudu" },
  { id: "youtubemovies", label: "YouTube Movies / Google TV", kind: "streaming", genres: ["Movie Streaming"] },
  { id: "moviesanywhere", label: "Movies Anywhere", kind: "streaming", genres: ["Movie Streaming"] },

  // ---- DOCUMENTARIES ----
  { id: "pbspassport", label: "PBS Passport", kind: "streaming", genres: ["Documentaries"] },
  { id: "curiositystream", label: "CuriosityStream", kind: "streaming", genres: ["Documentaries"] },
  { id: "magellantv", label: "MagellanTV", kind: "streaming", genres: ["Documentaries"] },

  // ---- ANIME / ASIAN CINEMA ----
  { id: "crunchyroll", label: "Crunchyroll", kind: "streaming", genres: ["Anime / Asian cinema"] },
  { id: "hidive", label: "HIDIVE", kind: "streaming", genres: ["Anime / Asian cinema"] },
  { id: "viki", label: "Viki", kind: "streaming", genres: ["Anime / Asian cinema"] },
  { id: "iqiyi", label: "iQIYI", kind: "streaming", genres: ["Anime / Asian cinema"] },
  { id: "asiancrush", label: "AsianCrush", kind: "streaming", genres: ["Anime / Asian cinema"] },

  // ---- KIDS ----
  { id: "disneyplus-kids", label: "Disney+ / DisneyNOW / Disney Jr.", kind: "kids", genres: ["Kids"], note: "Disney, Pixar, Marvel content + live TV" },
  { id: "pbskids", label: "PBS KIDS", kind: "kids", genres: ["Kids"], note: "Educational, commercial-free" },
  { id: "youtubekids", label: "YouTube Kids", kind: "kids", genres: ["Kids"], note: "Curated, kid-friendly" },
  { id: "noggin", label: "Noggin", kind: "kids", genres: ["Kids"], note: "PAW Patrol, Peppa Pig" },
  { id: "cartoonnetwork", label: "Cartoon Network", kind: "kids", genres: ["Kids"] },
  { id: "nickelodeon", label: "Nickelodeon / Nick Jr.", kind: "kids", genres: ["Kids"] },
  { id: "kidoodletv", label: "Kidoodle.TV", kind: "kids", genres: ["Kids"], note: "Safe, curated" },
  { id: "happykids", label: "HappyKids", kind: "kids", genres: ["Kids", "Free Streaming"], note: "Free, wide-ranging" },
  { id: "boomerang", label: "Boomerang", kind: "kids", genres: ["Kids"], note: "Classic cartoons" },
  { id: "babytv", label: "BabyTV / BabyFirst TV", kind: "kids", genres: ["Kids"], note: "Toddlers & babies" },
  { id: "sensical", label: "Sensical", kind: "kids", genres: ["Kids", "Free Streaming"], note: "Expert-vetted, free" },
  { id: "gonoodle", label: "GoNoodle", kind: "kids", genres: ["Kids", "Free Streaming"], note: "Active, educational" },
  { id: "supersimple", label: "Super Simple", kind: "kids", genres: ["Kids", "Free Streaming"], note: "Songs & learning" },
  { id: "ryanfriends", label: "Ryan and Friends", kind: "kids", genres: ["Kids"], note: "Kid influencer content" },
  { id: "bbc-cbeebies", label: "BBC iPlayer (CBeebies/CBBC)", kind: "kids", genres: ["Kids"], note: "UK children's programming" },
  { id: "numberblocks", label: "Numberblocks / Alphablocks", kind: "kids", genres: ["Kids"], note: "Math & phonics" },
  { id: "babyjohn", label: "Baby John / Nursery Rhymes", kind: "kids", genres: ["Kids"], note: "Songs & learning" },
  { id: "kartoon", label: "Kartoon Channel", kind: "kids", genres: ["Kids"] },

  // ---- LIVE TV ----
  { id: "youtubetv", label: "YouTube TV", kind: "livetv", genres: ["LiveTV"] },
  { id: "hulu-livetv", label: "Hulu + Live TV", kind: "livetv", genres: ["LiveTV"] },
  { id: "sling", label: "Sling TV", kind: "livetv", genres: ["LiveTV"] },
  { id: "fubotv", label: "Fubo", kind: "livetv", genres: ["LiveTV", "Premium Sports Streaming"] },

  // ---- PREMIUM SPORTS STREAMING ----
  { id: "espn", label: "ESPN", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "espnplus", label: "ESPN+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "foxsports1", label: "FOX Sports", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "dazn", label: "DAZN", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nflplus", label: "NFL+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nbaleaguepass", label: "NBA League Pass", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "mlbtv", label: "MLB.TV", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "nhl", label: "NHL+", kind: "sports", genres: ["Premium Sports Streaming"] },
  { id: "hbcugosports", label: "HBCUGO Sports", kind: "sports", genres: ["Premium Sports Streaming", "Black culture & diaspora"] },

  // ---- GAMING ----
  { id: "twitch", label: "Twitch", kind: "gaming", genres: ["Gaming"] },
  { id: "kick", label: "Kick", kind: "gaming", genres: ["Gaming"] },
  { id: "xboxcloud", label: "Xbox Cloud Gaming", kind: "gaming", genres: ["Gaming"] },
  { id: "geforcenow", label: "GeForce NOW", kind: "gaming", genres: ["Gaming"] },
  { id: "playstationplus", label: "PlayStation Plus", kind: "gaming", genres: ["Gaming"] },
  { id: "steam", label: "Steam", kind: "gaming", genres: ["Gaming"] },

  // ---- FREE STREAMING ----
  { id: "tubi", label: "Tubi", kind: "streaming", genres: ["Free Streaming"] },
  { id: "plutotv", label: "Pluto TV", kind: "streaming", genres: ["Free Streaming"] },
  { id: "rokuchannel", label: "The Roku Channel", kind: "streaming", genres: ["Free Streaming"] },
  { id: "freevee", label: "Amazon Freevee", kind: "streaming", genres: ["Free Streaming"] },
  { id: "xumo", label: "Xumo Play", kind: "streaming", genres: ["Free Streaming"] },
  { id: "plex", label: "Plex", kind: "streaming", genres: ["Free Streaming"] },
  { id: "crackle", label: "Crackle", kind: "streaming", genres: ["Free Streaming"] },
  { id: "revry", label: "Revry", kind: "streaming", genres: ["Free Streaming", "LGBT"] },

  // ---- INDIE AND ARTHOUSE FILM ----
  { id: "ovid", label: "OVID.tv", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "fandor", label: "Fandor", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "kinocult", label: "Kino Cult", kind: "niche", genres: ["Indie and Arthouse Film"] },
  { id: "kanopy", label: "Kanopy", kind: "niche", genres: ["Indie and Arthouse Film", "Documentaries"] },

  // ---- HORROR / CULT ----
  { id: "shudder", label: "Shudder", kind: "niche", genres: ["Horror / Cult"] },
  { id: "screambox", label: "Screambox", kind: "niche", genres: ["Horror / Cult"] },
  { id: "arrow", label: "Arrow Player", kind: "niche", genres: ["Horror / Cult"] },

  // ---- LGBT ----
  { id: "heretv", label: "HERE TV", kind: "niche", genres: ["LGBT"] },
  { id: "outtv", label: "OUTtv", kind: "niche", genres: ["LGBT"] },
  { id: "dekkoo", label: "Dekkoo", kind: "niche", genres: ["LGBT"] },

  // ---- BLACK CULTURE & DIASPORA ----
  { id: "kwelitv", label: "KweliTV", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "hbcugo", label: "HBCUGO", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "brownsugar", label: "Brown Sugar", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "americanu", label: "America Nu", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "afrolandtv", label: "AfroLandTV", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "urbanflixtv", label: "UrbanFlixTV", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "blackstarnetwork", label: "Black Star Network", kind: "niche", genres: ["Black culture & diaspora"], connectUrl: "https://app.blackstarnetwork.com/" },
  { id: "umc", label: "UMC (Urban Movie Channel)", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "allblk", label: "ALLBLK", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "mansa", label: "MANSA", kind: "niche", genres: ["Black culture & diaspora"] },
  { id: "blackmedia", label: "Black Media", kind: "niche", genres: ["Black culture & diaspora"] },
];

// ============================================================================
// ALL PLATFORM IDS
// ============================================================================

export const ALL_PLATFORM_IDS: PlatformId[] = PLATFORMS.map((p) => p.id);

// ============================================================================
// LEAGUES
// ============================================================================

export const LEAGUES = ["ALL", "NFL", "NBA", "MLB", "NHL", "MLS", "NCAA", "UFC", "Premier League", "UEFA Champions League"] as const;

export const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  NFL: [
    "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
    "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
    "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
    "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
    "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
    "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
    "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
    "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders",
  ],
  NBA: [
    "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
    "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
    "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
    "Los Angeles Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
    "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks",
    "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
    "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors",
    "Utah Jazz", "Washington Wizards",
  ],
  MLB: [
    "Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox",
    "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians",
    "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals",
    "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers",
    "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics",
    "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
    "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers",
    "Toronto Blue Jays", "Washington Nationals",
  ],
  NHL: [
    "Anaheim Ducks", "Arizona Coyotes", "Boston Bruins", "Buffalo Sabres",
    "Calgary Flames", "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche",
    "Columbus Blue Jackets", "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers",
    "Florida Panthers", "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens",
    "Nashville Predators", "New Jersey Devils", "New York Islanders", "New York Rangers",
    "Ottawa Senators", "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks",
    "Seattle Kraken", "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs",
    "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets",
  ],
  MLS: [
    "Atlanta United FC", "Austin FC", "CF Montreal", "Charlotte FC",
    "Chicago Fire FC", "Colorado Rapids", "Columbus Crew", "D.C. United",
    "FC Cincinnati", "FC Dallas", "Houston Dynamo FC", "Inter Miami CF",
    "LA Galaxy", "LAFC", "Minnesota United FC", "Nashville SC",
    "New England Revolution", "New York City FC", "New York Red Bulls", "Orlando City SC",
    "Philadelphia Union", "Portland Timbers", "Real Salt Lake", "San Jose Earthquakes",
    "Seattle Sounders FC", "Sporting Kansas City", "St. Louis City SC", "Toronto FC",
    "Vancouver Whitecaps FC",
  ],
  NCAA: [
    "Alabama Crimson Tide", "Clemson Tigers", "Georgia Bulldogs", "Michigan Wolverines",
    "Ohio State Buckeyes", "Oklahoma Sooners", "Oregon Ducks", "Penn State Nittany Lions",
    "Texas Longhorns", "USC Trojans", "Florida Gators", "LSU Tigers",
    "Notre Dame Fighting Irish", "Tennessee Volunteers", "Wisconsin Badgers", "Auburn Tigers",
    "Florida State Seminoles", "Miami Hurricanes", "Michigan State Spartans", "Iowa Hawkeyes",
    "Texas A&M Aggies", "Virginia Tech Hokies", "Washington Huskies", "Colorado Buffaloes",
  ],
  UFC: ["UFC (All Events)"],
  "Premier League": [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford",
    "Brighton & Hove Albion", "Chelsea", "Crystal Palace", "Everton",
    "Fulham", "Ipswich Town", "Leicester City", "Liverpool",
    "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest",
    "Southampton", "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers",
  ],
  "UEFA Champions League": [
    "Real Madrid", "Barcelona", "Bayern Munich", "Manchester City",
    "Liverpool", "Paris Saint-Germain", "Inter Milan", "Borussia Dortmund",
    "Juventus", "Atletico Madrid", "AC Milan", "Porto",
    "Benfica", "Ajax", "RB Leipzig", "Napoli",
  ],
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

export function platformById(id: PlatformId): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export function platformIdFromLabel(label: string): PlatformId | null {
  const lower = label.toLowerCase().trim();
  const match = PLATFORMS.find(
    (p) => p.label.toLowerCase() === lower || p.id.toLowerCase() === lower
  );
  return match?.id ?? null;
}

export function platformsForGenre(genre: GenreKey | "All"): PlatformId[] {
  if (genre === "All") return ALL_PLATFORM_IDS;
  return PLATFORMS.filter(
    (p) => p.genres?.includes(genre as GenreKey) ?? false
  ).map((p) => p.id);
}

export function searchPlatforms(query: string): Platform[] {
  const q = query.toLowerCase().trim();
  if (!q) return [...PLATFORMS];
  return PLATFORMS.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.note?.toLowerCase().includes(q) ?? false)
  );
}

export function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function canonicalLeagueForTeams(league: string): string | null {
  const key = normalizeKey(league);
  for (const [k] of Object.entries(TEAMS_BY_LEAGUE)) {
    if (normalizeKey(k) === key) return k;
  }
  return null;
}

// ============================================================================
// PROVIDER URL HELPERS (demo handoff)
// ============================================================================

const PROVIDER_URLS: Record<string, { open: string; subscribe: string }> = {
  netflix: { open: "https://www.netflix.com", subscribe: "https://www.netflix.com/signup" },
  hulu: { open: "https://www.hulu.com", subscribe: "https://www.hulu.com/welcome" },
  primevideo: { open: "https://www.amazon.com/gp/video", subscribe: "https://www.amazon.com/gp/video/offers" },
  disneyplus: { open: "https://www.disneyplus.com", subscribe: "https://www.disneyplus.com/sign-up" },
  max: { open: "https://www.max.com", subscribe: "https://www.max.com/select-plan" },
  peacock: { open: "https://www.peacocktv.com", subscribe: "https://www.peacocktv.com/plans" },
  paramountplus: { open: "https://www.paramountplus.com", subscribe: "https://www.paramountplus.com/account/signup" },
  appletv: { open: "https://tv.apple.com", subscribe: "https://tv.apple.com" },
  youtube: { open: "https://www.youtube.com", subscribe: "https://www.youtube.com/premium" },
  espn: { open: "https://www.espn.com", subscribe: "https://www.espn.com/espnplus" },
  espnplus: { open: "https://plus.espn.com", subscribe: "https://plus.espn.com" },
  dazn: { open: "https://www.dazn.com", subscribe: "https://www.dazn.com/account/signup" },
  youtubetv: { open: "https://tv.youtube.com", subscribe: "https://tv.youtube.com/welcome" },
  sling: { open: "https://www.sling.com", subscribe: "https://www.sling.com/deals" },
  fubotv: { open: "https://www.fubo.tv", subscribe: "https://www.fubo.tv/welcome" },
  tubi: { open: "https://tubitv.com", subscribe: "https://tubitv.com" },
  plutotv: { open: "https://pluto.tv", subscribe: "https://pluto.tv" },
  crunchyroll: { open: "https://www.crunchyroll.com", subscribe: "https://www.crunchyroll.com/welcome" },
  twitch: { open: "https://www.twitch.tv", subscribe: "https://www.twitch.tv/turbo" },
  shudder: { open: "https://www.shudder.com", subscribe: "https://www.shudder.com/signup" },
  betplus: { open: "https://www.bet.com/betplus", subscribe: "https://www.bet.com/betplus" },
  amcplus: { open: "https://www.amcplus.com", subscribe: "https://www.amcplus.com/plans" },
  starz: { open: "https://www.starz.com", subscribe: "https://www.starz.com/plans" },
  mgmplus: { open: "https://www.mgmplus.com", subscribe: "https://www.mgmplus.com/subscribe" },
  criterion: { open: "https://www.criterionchannel.com", subscribe: "https://www.criterionchannel.com/checkout" },
  mubi: { open: "https://mubi.com", subscribe: "https://mubi.com/go" },
  curiositystream: { open: "https://curiositystream.com", subscribe: "https://curiositystream.com/plan" },
  magellantv: { open: "https://www.magellantv.com", subscribe: "https://www.magellantv.com/join" },
  hidive: { open: "https://www.hidive.com", subscribe: "https://www.hidive.com/account/signup" },
  viki: { open: "https://www.viki.com", subscribe: "https://www.viki.com/pass" },
  iqiyi: { open: "https://www.iq.com", subscribe: "https://www.iq.com/vip" },
  asiancrush: { open: "https://www.asiancrush.com", subscribe: "https://www.asiancrush.com" },
  pbskids: { open: "https://pbskids.org", subscribe: "https://pbskids.org" },
  noggin: { open: "https://www.noggin.com", subscribe: "https://www.noggin.com" },
  kidoodletv: { open: "https://www.kidoodle.tv", subscribe: "https://www.kidoodle.tv" },
  happykids: { open: "https://www.happykids.tv", subscribe: "https://www.happykids.tv" },
  youtubekids: { open: "https://www.youtubekids.com", subscribe: "https://www.youtubekids.com" },
  kartoon: { open: "https://www.kartoonplanet.com", subscribe: "https://www.kartoonplanet.com" },
  heretv: { open: "https://www.here.tv", subscribe: "https://www.here.tv/subscribe" },
  outtv: { open: "https://www.outtv.com", subscribe: "https://www.outtv.com" },
  dekkoo: { open: "https://www.dekkoo.com", subscribe: "https://www.dekkoo.com/subscribe" },
  revry: { open: "https://revry.tv", subscribe: "https://revry.tv" },
  kwelitv: { open: "https://www.kweli.tv", subscribe: "https://www.kweli.tv/subscribe" },
  hbcugo: { open: "https://www.hbcugo.tv", subscribe: "https://www.hbcugo.tv/subscribe" },
  hbcugosports: { open: "https://www.hbcugo.tv/sports", subscribe: "https://www.hbcugo.tv/subscribe" },
  brownsugar: { open: "https://www.brownsugar.com", subscribe: "https://www.brownsugar.com" },
  americanu: { open: "https://www.americanu.com", subscribe: "https://www.americanu.com" },
  afrolandtv: { open: "https://www.afrolandtv.com", subscribe: "https://www.afrolandtv.com" },
  urbanflixtv: { open: "https://urbanflixtv.com", subscribe: "https://urbanflixtv.com" },
  blackstarnetwork: { open: "https://app.blackstarnetwork.com/", subscribe: "https://app.blackstarnetwork.com/" },
  umc: { open: "https://www.umc.tv", subscribe: "https://www.umc.tv/subscribe" },
  allblk: { open: "https://www.allblk.tv", subscribe: "https://www.allblk.tv/subscribe" },
  mansa: { open: "https://www.mansa.stream", subscribe: "https://www.mansa.stream" },
  blackmedia: { open: "https://www.blackmedia.tv", subscribe: "https://www.blackmedia.tv" },
  rokuchannel: { open: "https://therokuchannel.roku.com", subscribe: "https://therokuchannel.roku.com" },
  freevee: { open: "https://www.amazon.com/gp/video/splash/freevee", subscribe: "https://www.amazon.com/gp/video/splash/freevee" },
  xumo: { open: "https://www.xumo.tv", subscribe: "https://www.xumo.tv" },
  plex: { open: "https://www.plex.tv", subscribe: "https://www.plex.tv/plex-pass" },
  crackle: { open: "https://www.crackle.com", subscribe: "https://www.crackle.com" },
  ovid: { open: "https://www.ovid.tv", subscribe: "https://www.ovid.tv/subscribe" },
  fandor: { open: "https://www.fandor.com", subscribe: "https://www.fandor.com/subscribe" },
  kinocult: { open: "https://www.kinocult.com", subscribe: "https://www.kinocult.com" },
  kanopy: { open: "https://www.kanopy.com", subscribe: "https://www.kanopy.com" },
  screambox: { open: "https://www.screambox.com", subscribe: "https://www.screambox.com/subscribe" },
  arrow: { open: "https://www.arrowplayer.com", subscribe: "https://www.arrowplayer.com/subscribe" },
  fandango: { open: "https://www.vudu.com", subscribe: "https://www.vudu.com" },
  youtubemovies: { open: "https://play.google.com/store/movies", subscribe: "https://tv.google.com" },
  moviesanywhere: { open: "https://moviesanywhere.com", subscribe: "https://moviesanywhere.com" },
  nflplus: { open: "https://www.nfl.com/plus", subscribe: "https://www.nfl.com/plus" },
  nbaleaguepass: { open: "https://www.nba.com/watch", subscribe: "https://www.nba.com/league-pass" },
  mlbtv: { open: "https://www.mlb.com/tv", subscribe: "https://www.mlb.com/tv" },
  nhl: { open: "https://www.nhl.com/subscribe", subscribe: "https://www.nhl.com/subscribe" },
};

export function providerUrlOpen(pid: PlatformId | null, title?: string): string {
  if (!pid) return "https://www.google.com/search?q=" + encodeURIComponent(title ?? "streaming");
  const entry = PROVIDER_URLS[pid];
  if (entry) return entry.open;
  const platform = platformById(pid);
  if (platform?.connectUrl) return platform.connectUrl;
  return "https://www.google.com/search?q=" + encodeURIComponent((platform?.label ?? pid) + " streaming");
}

export function providerUrlSubscribe(pid: PlatformId | null): string {
  if (!pid) return "https://www.google.com/search?q=streaming+subscription";
  const entry = PROVIDER_URLS[pid];
  if (entry) return entry.subscribe;
  const platform = platformById(pid);
  if (platform?.connectUrl) return platform.connectUrl;
  return "https://www.google.com/search?q=" + encodeURIComponent((platform?.label ?? pid) + " subscribe");
}

export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return "unknown";
  }
}

// ============================================================================
// PLATFORM CATALOG (legacy compat export)
// ============================================================================

export const PLATFORM_CATALOG = PLATFORMS.map((p) => ({ name: p.label, id: p.id }));
