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
  { key: "Anime & AsianTV" },
  { key: "Arthouse" },
  { key: "Basic" },
  { key: "Black Media" },
  { key: "Documentaries" },
  { key: "Free" },
  { key: "Gaming" },
  { key: "Horror / Cult" },
  { key: "Kids" },
  { key: "LGBT" },
  { key: "LiveTV" },
  { key: "Movies" },
  { key: "Premium" },
  { key: "Sports" },
] as const;

// ============================================================================
// PLATFORM CATALOG
// ============================================================================

export const PLATFORMS: Platform[] = [
  // ---- BASIC STREAMING ----
  { id: "netflix", label: "Netflix", kind: "streaming", genres: ["Basic", "Movies", "Documentaries"] },
  { id: "hulu", label: "Hulu", kind: "streaming", genres: ["Basic", "Movies"] },
  { id: "primevideo", label: "Prime Video", kind: "streaming", genres: ["Basic", "Movies"] },
  { id: "disneyplus", label: "Disney+", kind: "streaming", genres: ["Basic", "Kids"] },
  { id: "max", label: "Max", kind: "streaming", genres: ["Movies", "Basic"] },
  { id: "peacock", label: "Peacock", kind: "streaming", genres: ["Basic", "LiveTV"] },
  { id: "paramountplus", label: "Paramount+", kind: "streaming", genres: ["Basic", "Movies"] },
  { id: "appletv", label: "Apple TV+", kind: "streaming", genres: ["Basic", "Movies"] },
  { id: "youtube", label: "YouTube", kind: "streaming", genres: ["Free"] },

  // ---- PREMIUM CHANNELS (add-on brands) ----
  { id: "betplus", label: "BET+", kind: "streaming", genres: ["Premium", "Premium", "Black Media"] },
  { id: "amcplus", label: "AMC+", kind: "streaming", genres: ["Premium", "Premium"] },
  { id: "starz", label: "Starz", kind: "streaming", genres: ["Premium", "Premium", "Movies"] },
  { id: "mgmplus", label: "MGM+", kind: "streaming", genres: ["Premium", "Premium", "Movies"] },

  // ---- MOVIE STREAMING ----
  { id: "criterion", label: "The Criterion Channel", kind: "streaming", genres: ["Movies", "Arthouse"] },
  { id: "mubi", label: "MUBI", kind: "streaming", genres: ["Movies", "Arthouse"] },
  { id: "fandango", label: "Fandango at Home", kind: "streaming", genres: ["Movies"], note: "Formerly Vudu" },
  { id: "vudu", label: "Vudu", kind: "streaming", genres: ["Movies"], note: "Now Fandango at Home" },
  { id: "youtubemovies", label: "YouTube Movies / Google TV", kind: "streaming", genres: ["Movies"] },
  { id: "moviesanywhere", label: "Movies Anywhere", kind: "streaming", genres: ["Movies"] },

  // ---- DOCUMENTARIES ----
  { id: "pbspassport", label: "PBS Passport", kind: "streaming", genres: ["Documentaries"] },
  { id: "curiositystream", label: "CuriosityStream", kind: "streaming", genres: ["Documentaries"] },
  { id: "magellantv", label: "MagellanTV", kind: "streaming", genres: ["Documentaries"] },

  // ---- ANIME / ASIAN CINEMA ----
  { id: "crunchyroll", label: "Crunchyroll", kind: "streaming", genres: ["Anime & AsianTV"] },
  { id: "hidive", label: "HIDIVE", kind: "streaming", genres: ["Anime & AsianTV"] },
  { id: "viki", label: "Viki", kind: "streaming", genres: ["Anime & AsianTV"] },
  { id: "iqiyi", label: "iQIYI", kind: "streaming", genres: ["Anime & AsianTV"] },
  { id: "asiancrush", label: "AsianCrush", kind: "streaming", genres: ["Anime & AsianTV"] },

  // ---- KIDS ----
  { id: "disneyplus-kids", label: "Disney+ / DisneyNOW / Disney Jr.", kind: "kids", genres: ["Kids"], note: "Disney, Pixar, Marvel content + live TV" },
  { id: "pbskids", label: "PBS KIDS", kind: "kids", genres: ["Kids"], note: "Educational, commercial-free" },
  { id: "youtubekids", label: "YouTube Kids", kind: "kids", genres: ["Kids"], note: "Curated, kid-friendly" },
  { id: "noggin", label: "Noggin", kind: "kids", genres: ["Kids"], note: "PAW Patrol, Peppa Pig" },
  { id: "cartoonnetwork", label: "Cartoon Network", kind: "kids", genres: ["Kids"] },
  { id: "nickelodeon", label: "Nickelodeon / Nick Jr.", kind: "kids", genres: ["Kids"] },
  { id: "kidoodletv", label: "Kidoodle.TV", kind: "kids", genres: ["Kids"], note: "Safe, curated" },
  { id: "happykids", label: "HappyKids", kind: "kids", genres: ["Kids", "Free"], note: "Free, wide-ranging" },
  { id: "boomerang", label: "Boomerang", kind: "kids", genres: ["Kids"], note: "Classic cartoons" },
  { id: "babytv", label: "BabyTV / BabyFirst TV", kind: "kids", genres: ["Kids"], note: "Toddlers & babies" },
  { id: "sensical", label: "Sensical", kind: "kids", genres: ["Kids", "Free"], note: "Expert-vetted, free" },
  { id: "gonoodle", label: "GoNoodle", kind: "kids", genres: ["Kids", "Free"], note: "Active, educational" },
  { id: "supersimple", label: "Super Simple", kind: "kids", genres: ["Kids", "Free"], note: "Songs & learning" },
  { id: "ryanfriends", label: "Ryan and Friends", kind: "kids", genres: ["Kids"], note: "Kid influencer content" },
  { id: "bbc-cbeebies", label: "BBC iPlayer (CBeebies/CBBC)", kind: "kids", genres: ["Kids"], note: "UK children's programming" },
  { id: "numberblocks", label: "Numberblocks / Alphablocks", kind: "kids", genres: ["Kids"], note: "Math & phonics" },
  { id: "babyjohn", label: "Baby John / Nursery Rhymes", kind: "kids", genres: ["Kids"], note: "Songs & learning" },
  { id: "kartoon", label: "Kartoon Channel", kind: "kids", genres: ["Kids"] },

  // ---- LIVE TV ----
  { id: "youtubetv", label: "YouTube TV", kind: "livetv", genres: ["LiveTV"] },
  { id: "hulu-livetv", label: "Hulu + Live TV", kind: "livetv", genres: ["LiveTV"] },
  { id: "sling", label: "Sling TV", kind: "livetv", genres: ["LiveTV"] },
  { id: "fubotv", label: "Fubo", kind: "livetv", genres: ["LiveTV", "Sports"] },

  // ---- PREMIUM SPORTS STREAMING ----
  { id: "espn", label: "ESPN", kind: "sports", genres: ["Sports"] },
  { id: "espnplus", label: "ESPN+", kind: "sports", genres: ["Sports"] },
  { id: "foxsports1", label: "FOX Sports", kind: "sports", genres: ["Sports"] },
  { id: "dazn", label: "DAZN", kind: "sports", genres: ["Sports"] },
  { id: "nflplus", label: "NFL+", kind: "sports", genres: ["Sports"] },
  { id: "nbaleaguepass", label: "NBA League Pass", kind: "sports", genres: ["Sports"] },
  { id: "mlbtv", label: "MLB.TV", kind: "sports", genres: ["Sports"] },
  { id: "nhl", label: "NHL+", kind: "sports", genres: ["Sports"] },
  { id: "hbcugosports", label: "HBCUGO Sports", kind: "sports", genres: ["Sports", "Black Media"] },

  // ---- GAMING ----
  { id: "twitch", label: "Twitch", kind: "gaming", genres: ["Gaming"] },
  { id: "kick", label: "Kick", kind: "gaming", genres: ["Gaming"] },
  { id: "xboxcloud", label: "Xbox Cloud Gaming", kind: "gaming", genres: ["Gaming"] },
  { id: "geforcenow", label: "GeForce NOW", kind: "gaming", genres: ["Gaming"] },
  { id: "playstationplus", label: "PlayStation Plus", kind: "gaming", genres: ["Gaming"] },
  { id: "steam", label: "Steam", kind: "gaming", genres: ["Gaming"] },

  // ---- FREE STREAMING ----
  { id: "tubi", label: "Tubi", kind: "streaming", genres: ["Free"] },
  { id: "plutotv", label: "Pluto TV", kind: "streaming", genres: ["Free"] },
  { id: "rokuchannel", label: "The Roku Channel", kind: "streaming", genres: ["Free"] },
  { id: "freevee", label: "Amazon Freevee", kind: "streaming", genres: ["Free"] },
  { id: "xumo", label: "Xumo Play", kind: "streaming", genres: ["Free"] },
  { id: "plex", label: "Plex", kind: "streaming", genres: ["Free"] },
  { id: "crackle", label: "Crackle", kind: "streaming", genres: ["Free"] },
  { id: "revry", label: "Revry", kind: "streaming", genres: ["Free", "LGBT"] },

  // ---- INDIE AND ARTHOUSE FILM ----
  { id: "ovid", label: "OVID.tv", kind: "niche", genres: ["Arthouse"] },
  { id: "fandor", label: "Fandor", kind: "niche", genres: ["Arthouse"] },
  { id: "kinocult", label: "Kino Cult", kind: "niche", genres: ["Arthouse"] },
  { id: "kanopy", label: "Kanopy", kind: "niche", genres: ["Arthouse", "Documentaries"] },

  // ---- HORROR / CULT ----
  { id: "shudder", label: "Shudder", kind: "niche", genres: ["Horror / Cult"] },
  { id: "screambox", label: "Screambox", kind: "niche", genres: ["Horror / Cult"] },
  { id: "arrow", label: "Arrow Player", kind: "niche", genres: ["Horror / Cult"] },

  // ---- LGBT ----
  { id: "heretv", label: "HERE TV", kind: "niche", genres: ["LGBT"] },
  { id: "outtv", label: "OUTtv", kind: "niche", genres: ["LGBT"] },
  { id: "dekkoo", label: "Dekkoo", kind: "niche", genres: ["LGBT"] },

  // ---- BLACK CULTURE & DIASPORA ----
  { id: "kwelitv", label: "KweliTV", kind: "niche", genres: ["Black Media"] },
  { id: "hbcugo", label: "HBCUGO", kind: "niche", genres: ["Black Media"] },
  { id: "brownsugar", label: "Brown Sugar", kind: "niche", genres: ["Black Media"] },
  { id: "americanu", label: "America Nu", kind: "niche", genres: ["Black Media"] },
  { id: "afrolandtv", label: "AfroLandTV", kind: "niche", genres: ["Black Media"] },
  { id: "urbanflixtv", label: "UrbanFlixTV", kind: "niche", genres: ["Black Media"] },
  { id: "blackstarnetwork", label: "Black Star Network", kind: "niche", genres: ["Black Media"], connectUrl: "https://app.blackstarnetwork.com/" },
  { id: "umc", label: "UMC (Urban Movie Channel)", kind: "niche", genres: ["Black Media"] },
  { id: "allblk", label: "ALLBLK", kind: "niche", genres: ["Black Media"] },
  { id: "mansa", label: "MANSA", kind: "niche", genres: ["Black Media"] },
];

// ============================================================================
// ALL PLATFORM IDS
// ============================================================================

export const ALL_PLATFORM_IDS: PlatformId[] = PLATFORMS.map((p) => p.id);

// ============================================================================
// LEAGUES
// ============================================================================

export const LEAGUES = ["ALL", "EFL League One", "EFL League Two", "France Ligue 1", "KFL", "KHL", "MLB", "MLS", "NBA", "NCAA", "NFL", "NHL", "Premier League", "UCI", "UEFA Champions League", "UFC"] as const;

export const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  KFL: [
    "Arkansas Twisters", "Duke City Gladiators", "Frisco Fighters", "Iowa Barnstormers",
    "Jacksonville Sharks", "Massachusetts Pirates", "NAZ Wranglers", "Northern Arizona Wranglers",
    "Sioux Falls Storm", "Southwest Kansas Storm", "Tucson Sugar Skulls", "Vegas Knight Hawks",
  ],
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
    "Atlanta United FC", "Austin FC", "CF Montréal", "Charlotte FC",
    "Chicago Fire FC", "Colorado Rapids", "Columbus Crew", "D.C. United",
    "FC Cincinnati", "FC Dallas", "Houston Dynamo FC", "Inter Miami CF",
    "LA Galaxy", "LAFC", "Minnesota United FC", "Nashville SC",
    "New England Revolution", "New York City FC", "New York Red Bulls", "Orlando City SC",
    "Philadelphia Union", "Portland Timbers", "Real Salt Lake", "San Diego FC",
    "San Jose Earthquakes", "Seattle Sounders FC", "Sporting Kansas City", "St. Louis City SC",
    "Toronto FC", "Vancouver Whitecaps FC",
  ],
  NCAA: [
    // Power 5 / Power 4 Conference Teams (Division 1 FBS)
    "Alabama Crimson Tide", "Arizona State Sun Devils", "Arizona Wildcats", "Arkansas Razorbacks",
    "Auburn Tigers", "Baylor Bears", "BYU Cougars", "Cal Golden Bears",
    "Clemson Tigers", "Colorado Buffaloes", "Duke Blue Devils", "Florida Gators",
    "Florida State Seminoles", "Georgia Bulldogs", "Georgia Tech Yellow Jackets", "Illinois Fighting Illini",
    "Indiana Hoosiers", "Iowa Hawkeyes", "Iowa State Cyclones", "Kansas Jayhawks",
    "Kansas State Wildcats", "Kentucky Wildcats", "Louisville Cardinals", "LSU Tigers",
    "Maryland Terrapins", "Miami Hurricanes", "Michigan State Spartans", "Michigan Wolverines",
    "Minnesota Golden Gophers", "Mississippi State Bulldogs", "Missouri Tigers", "Nebraska Cornhuskers",
    "North Carolina Tar Heels", "Northwestern Wildcats", "Notre Dame Fighting Irish", "Ohio State Buckeyes",
    "Oklahoma Sooners", "Oklahoma State Cowboys", "Ole Miss Rebels", "Oregon Ducks",
    "Oregon State Beavers", "Penn State Nittany Lions", "Pitt Panthers", "Purdue Boilermakers",
    "Rutgers Scarlet Knights", "SMU Mustangs", "South Carolina Gamecocks", "Stanford Cardinal",
    "Syracuse Orange", "TCU Horned Frogs", "Tennessee Volunteers", "Texas A&M Aggies",
    "Texas Longhorns", "Texas Tech Red Raiders", "UCLA Bruins", "USC Trojans",
    "Utah Utes", "Vanderbilt Commodores", "Virginia Cavaliers", "Virginia Tech Hokies",
    "Wake Forest Demon Deacons", "Washington Huskies", "Washington State Cougars", "West Virginia Mountaineers",
    "Wisconsin Badgers",
    // HBCU Schools
    "Alabama A&M Bulldogs", "Alabama State Hornets", "Alcorn State Braves", "Albany State Golden Rams",
    "Bethune-Cookman Wildcats", "Bowie State Bulldogs", "Central State Marauders", "Coppin State Eagles",
    "Delaware State Hornets", "Edward Waters Tigers", "Elizabeth City State Vikings", "Fayetteville State Broncos",
    "Florida A&M Rattlers", "Fort Valley State Wildcats", "Grambling State Tigers", "Hampton Pirates",
    "Howard Bison", "Jackson State Tigers", "Kentucky State Thorobreds", "Lane Dragons",
    "Lincoln University Lions", "Livingstone Blue Bears", "Miles Golden Bears", "Mississippi Valley State Delta Devils",
    "Morgan State Bears", "Norfolk State Spartans", "North Carolina A&T Aggies", "North Carolina Central Eagles",
    "Prairie View A&M Panthers", "Savannah State Tigers", "Shaw Bears", "South Carolina State Bulldogs",
    "Southern Jaguars", "Southern University Jaguars", "Stillman Tigers", "Tennessee State Tigers",
    "Texas Southern Tigers", "Tuskegee Golden Tigers", "Virginia State Trojans", "Virginia Union Panthers",
    "Winston-Salem State Rams",
  ],
  UFC: ["UFC (All Events)"],
  "Premier League": [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford",
    "Brighton & Hove Albion", "Chelsea", "Crystal Palace", "Everton",
    "Fulham", "Ipswich Town", "Leicester City", "Liverpool",
    "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest",
    "Southampton", "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers",
  ],
  UCI: [
    "UCI Pro Tour (All Events)", "Tour de France", "Giro d'Italia", "Vuelta a España",
  ],
  "UEFA Champions League": [
    "AC Milan", "Ajax", "Atletico Madrid", "Barcelona",
    "Bayern Munich", "Benfica", "Borussia Dortmund", "Inter Milan",
    "Juventus", "Liverpool", "Manchester City", "Napoli",
    "Paris Saint-Germain", "Porto", "RB Leipzig", "Real Madrid",
  ],
  "EFL League One": [
    "AFC Wimbledon", "Barnsley", "Blackpool", "Bolton Wanderers",
    "Bradford City", "Burton Albion", "Cardiff City", "Doncaster Rovers",
    "Exeter City", "Huddersfield Town", "Leyton Orient", "Lincoln City",
    "Luton Town", "Mansfield Town", "Northampton Town", "Peterborough United",
    "Plymouth Argyle", "Port Vale", "Reading", "Rotherham United",
    "Stevenage", "Stockport County", "Wigan Athletic", "Wycombe Wanderers",
  ],
  "EFL League Two": [
    "Accrington Stanley", "Barnet", "Barrow", "Bristol Rovers",
    "Bromley", "Cambridge United", "Cheltenham Town", "Chesterfield",
    "Colchester United", "Crawley Town", "Crewe Alexandra", "Fleetwood Town",
    "Gillingham", "Grimsby Town", "Harrogate Town", "MK Dons",
    "Newport County", "Notts County", "Oldham Athletic", "Salford City",
    "Shrewsbury Town", "Swindon Town", "Tranmere Rovers", "Walsall",
  ],
  "France Ligue 1": [
    "AJ Auxerre", "Angers SCO", "AS Monaco", "FC Lorient",
    "FC Metz", "FC Nantes", "Le Havre AC", "Lille OSC",
    "OGC Nice", "Olympique de Marseille", "Olympique Lyonnais", "Paris FC",
    "Paris Saint-Germain", "RC Lens", "RC Strasbourg", "Stade Brestois",
    "Stade Rennais", "Toulouse FC",
  ],
  KHL: [
    "Admiral Vladivostok", "Ak Bars Kazan", "Amur Khabarovsk", "Avangard Omsk",
    "Avtomobilist Yekaterinburg", "Barys Astana", "CSKA Moscow", "Dinamo Minsk",
    "Dynamo Moscow", "HK Sochi", "Lada Togliatti", "Lokomotiv Yaroslavl",
    "Metallurg Magnitogorsk", "Neftekhimik Nizhnekamsk", "Salavat Yulaev Ufa", "Severstal Cherepovets",
    "Shanghai Dragons", "Sibir Novosibirsk", "SKA St. Petersburg", "Spartak Moscow",
    "Torpedo Nizhny Novgorod", "Traktor Chelyabinsk",
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
  vudu: { open: "https://www.vudu.com", subscribe: "https://www.vudu.com" },
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
