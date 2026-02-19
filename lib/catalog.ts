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
  { key: "Vistazo" },
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
  { id: "criterion", label: "Criterion Channel", kind: "streaming", genres: ["Movies", "Arthouse"] },
  { id: "mubi", label: "MUBI", kind: "streaming", genres: ["Movies", "Arthouse"] },
  { id: "fandango", label: "Fandango at Home", kind: "streaming", genres: ["Movies"], note: "Formerly Vudu" },
  { id: "vudu", label: "Vudu", kind: "streaming", genres: ["Movies"], note: "Now Fandango at Home" },
  { id: "youtubemovies", label: "YouTube Movies", kind: "streaming", genres: ["Movies"] },
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
  { id: "disneyplus-kids", label: "Disney Jr.", kind: "kids", genres: ["Kids"], note: "Disney, Pixar, Marvel content + live TV" },
  { id: "pbskids", label: "PBS KIDS", kind: "kids", genres: ["Kids"], note: "Educational, commercial-free" },
  { id: "youtubekids", label: "YouTube Kids", kind: "kids", genres: ["Kids"], note: "Curated, kid-friendly" },
  { id: "noggin", label: "Noggin", kind: "kids", genres: ["Kids"], note: "PAW Patrol, Peppa Pig" },
  { id: "cartoonnetwork", label: "Cartoon Network", kind: "kids", genres: ["Kids"] },
  { id: "nickelodeon", label: "Nickelodeon", kind: "kids", genres: ["Kids"] },
  { id: "kidoodletv", label: "Kidoodle.TV", kind: "kids", genres: ["Kids"], note: "Safe, curated" },
  { id: "happykids", label: "HappyKids", kind: "kids", genres: ["Kids", "Free"], note: "Free, wide-ranging" },
  { id: "boomerang", label: "Boomerang", kind: "kids", genres: ["Kids"], note: "Classic cartoons" },
  { id: "babytv", label: "BabyTV", kind: "kids", genres: ["Kids"], note: "Toddlers & babies" },
  { id: "sensical", label: "Sensical", kind: "kids", genres: ["Kids", "Free"], note: "Expert-vetted, free" },
  { id: "gonoodle", label: "GoNoodle", kind: "kids", genres: ["Kids", "Free"], note: "Active, educational" },
  { id: "supersimple", label: "Super Simple", kind: "kids", genres: ["Kids", "Free"], note: "Songs & learning" },
  { id: "ryanfriends", label: "Ryan and Friends", kind: "kids", genres: ["Kids"], note: "Kid influencer content" },
  { id: "bbc-cbeebies", label: "BBC iPlayer", kind: "kids", genres: ["Kids"], note: "UK children's programming" },
  { id: "numberblocks", label: "Numberblocks", kind: "kids", genres: ["Kids"], note: "Math & phonics" },
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
  { id: "yahoosports", label: "Yahoo Sports Network", kind: "sports", genres: ["Sports"] },
  { id: "fanduelsports", label: "FanDuel Sports Network", kind: "sports", genres: ["Sports"] },

  // ---- REGIONAL SPORTS NETWORKS (Team-specific streaming) ----
  { id: "yesnetwork", label: "YES Network", kind: "sports", genres: ["Sports"], note: "NY Yankees, Brooklyn Nets" },
  { id: "nesn", label: "NESN", kind: "sports", genres: ["Sports"], note: "Boston Red Sox, Boston Bruins" },
  { id: "snla", label: "SportsNet LA", kind: "sports", genres: ["Sports"], note: "LA Dodgers" },
  { id: "masn", label: "MASN", kind: "sports", genres: ["Sports"], note: "Baltimore Orioles, Washington Nationals" },
  { id: "marquee", label: "Marquee Sports Network", kind: "sports", genres: ["Sports"], note: "Chicago Cubs" },
  { id: "sny", label: "SNY", kind: "sports", genres: ["Sports"], note: "NY Mets" },
  { id: "attsportsnet", label: "AT&T SportsNet", kind: "sports", genres: ["Sports"], note: "Pittsburgh Pirates, Houston Astros, Rocky Mountain region" },
  { id: "nbcsportsboston", label: "NBC Sports Boston", kind: "sports", genres: ["Sports"], note: "Boston Celtics, Bruins regional" },
  { id: "msgnetwork", label: "MSG Network", kind: "sports", genres: ["Sports"], note: "NY Knicks, NY Rangers, NJ Devils" },
  { id: "ballysports", label: "Bally Sports", kind: "sports", genres: ["Sports"], note: "Multiple RSNs across regions" },
  { id: "rootsports", label: "ROOT Sports", kind: "sports", genres: ["Sports"], note: "Seattle Mariners, Pittsburgh, AT&T Rocky Mountain" },
  { id: "spectrumsnets", label: "Spectrum SportsNet", kind: "sports", genres: ["Sports"], note: "LA Lakers, LA Galaxy" },
  { id: "nbcsportschicago", label: "NBC Sports Chicago", kind: "sports", genres: ["Sports"], note: "Chicago White Sox, Bulls, Blackhawks" },
  { id: "nbcsportsphilly", label: "NBC Sports Philadelphia", kind: "sports", genres: ["Sports"], note: "Philadelphia 76ers, Phillies, Flyers" },
  { id: "nbcsnw", label: "NBC Sports Northwest", kind: "sports", genres: ["Sports"], note: "Portland Trail Blazers" },
  { id: "kcsr", label: "KC Sports Network", kind: "sports", genres: ["Sports"], note: "Kansas City Royals, Sporting KC" },
  { id: "monumental", label: "Monumental Sports Network", kind: "sports", genres: ["Sports"], note: "Washington Wizards, Capitals" },

  // ---- GAMING ----
  { id: "twitch", label: "Twitch", kind: "gaming", genres: ["Gaming"] },
  { id: "kick", label: "Kick", kind: "gaming", genres: ["Gaming"] },
  { id: "xboxcloud", label: "XBOX Cloud", kind: "gaming", genres: ["Gaming"] },
  { id: "geforcenow", label: "GeForce NOW", kind: "gaming", genres: ["Gaming"] },
  { id: "playstationplus", label: "PlayStation Plus", kind: "gaming", genres: ["Gaming"] },
  { id: "steam", label: "Steam", kind: "gaming", genres: ["Gaming"] },

  // ---- FREE STREAMING ----
  { id: "tubi", label: "Tubi", kind: "streaming", genres: ["Free"] },
  { id: "plutotv", label: "Pluto TV", kind: "streaming", genres: ["Free"] },
  { id: "rokuchannel", label: "Roku Channel", kind: "streaming", genres: ["Free"] },
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

  // ---- VISTAZO (LATINO / SPANISH-LANGUAGE) ----
  { id: "vixpremium", label: "ViX Premium", kind: "streaming", genres: ["Vistazo"], note: "TelevisaUnivision streaming" },
  { id: "fubolatino", label: "Fubo Latino", kind: "livetv", genres: ["Vistazo", "Sports", "LiveTV"], note: "Spanish-language live TV & sports" },
  { id: "telemundodeportes", label: "Telemundo Deportes Ahora", kind: "sports", genres: ["Vistazo", "Sports"], note: "NBC/Telemundo sports" },
  { id: "slinglatino", label: "Sling Latino", kind: "livetv", genres: ["Vistazo", "LiveTV"], note: "Spanish-language Sling packages" },
  { id: "espndeportes", label: "ESPN Deportes", kind: "sports", genres: ["Vistazo", "Sports"], note: "ESPN en espa\u00f1ol" },
  { id: "directvdeportes", label: "DIRECTV Deportes", kind: "sports", genres: ["Vistazo", "Sports"], note: "Latin American sports" },
  { id: "xfinitynowlatino", label: "Xfinity/NOW TV Latino", kind: "livetv", genres: ["Vistazo", "LiveTV"], note: "Comcast Spanish-language tier" },
  { id: "univision", label: "Univision", kind: "streaming", genres: ["Vistazo"], note: "Spanish-language broadcast" },
  { id: "telemundo", label: "Telemundo", kind: "streaming", genres: ["Vistazo"], note: "NBC Spanish-language network" },
  { id: "estrella", label: "Estrella TV", kind: "streaming", genres: ["Vistazo"], note: "Mexican entertainment" },
  { id: "cinelatinotv", label: "Cinelatino", kind: "streaming", genres: ["Vistazo", "Movies"], note: "Latin American films" },
  { id: "pantaya", label: "Pantaya", kind: "streaming", genres: ["Vistazo", "Movies"], note: "Spanish-language movies" },

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

export const LEAGUES = [
  "ALL",
  // South America
  "Argentine Primera", "Brasileir\u00e3o S\u00e9rie A", "Chilean Primera", "Colombian Liga BetPlay",
  "Copa Libertadores", "Copa Sudamericana", "Ecuadorian Liga Pro", "Paraguayan Primera",
  "Peruvian Liga 1", "Uruguayan Primera", "Venezuelan Primera",
  // Europe
  "Bundesliga", "EFL League One", "EFL League Two", "Eredivisie",
  "France Ligue 1", "La Liga", "Primeira Liga", "Premier League",
  "Scottish Premiership", "Serie A", "Super Lig",
  "Russian Premier League", "UEFA Champions League",
  // Africa
  "CAF Champions League", "Egyptian Premier League",
  "Kenyan Premier League", "Nigerian NPFL",
  "South African Premier Division",
  // Asia
  "AFC Champions League", "Chinese Super League",
  "Indian Super League", "I-League", "J-League", "K-League",
  "Liga 1 Indonesia", "Saudi Pro League", "Thai League",
  "UAE Pro League", "V-League",
  // Oceania
  "A-League", "AFL", "NRL", "Super Rugby",
  // North America & other
  "HBCUGoSports", "IFL", "KHL",
  "MLB", "MLS", "NBA", "NCAA", "NFL", "NHL",
  "UCI", "UFC",
] as const;

export const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  // ======== SOUTH AMERICAN LEAGUES ========
  "Argentine Primera": [
    "Atl\u00e9tico Tucum\u00e1n", "Banfield", "Barracas Central", "Belgrano",
    "Boca Juniors", "Central C\u00f3rdoba", "Defensa y Justicia", "Estudiantes",
    "Gimnasia La Plata", "Godoy Cruz", "Hurac\u00e1n", "Independiente",
    "Independiente Rivadavia", "Instituto", "Lan\u00fas", "Newell's Old Boys",
    "Platense", "Racing Club", "River Plate", "Rosario Central",
    "San Lorenzo", "Sarmiento", "Talleres", "Tigre",
    "Uni\u00f3n de Santa Fe", "V\u00e9lez S\u00e1rsfield",
  ],
  "Brasileir\u00e3o S\u00e9rie A": [
    "Athl\u00e9tico Paranaense", "Atl\u00e9tico Mineiro", "Bahia", "Botafogo",
    "Corinthians", "Crici\u00fama", "Cruzeiro", "Cuiab\u00e1",
    "Flamengo", "Fluminense", "Fortaleza", "Gr\u00eamio",
    "Internacional", "Juventude", "Palmeiras", "Red Bull Bragantino",
    "Santos", "S\u00e3o Paulo", "Vasco da Gama", "Vit\u00f3ria",
  ],
  "Chilean Primera": [
    "Audax Italiano", "Cobreloa", "Cobresal", "Colo-Colo",
    "Coquimbo Unido", "Deportes Copiap\u00f3", "Deportes Iquique", "Everton de Vi\u00f1a",
    "Huachipato", "Nublense", "O'Higgins", "Palestino",
    "Universidad Cat\u00f3lica", "Universidad de Chile", "Uni\u00f3n Espa\u00f1ola", "Uni\u00f3n La Calera",
  ],
  "Colombian Liga BetPlay": [
    "Aguilas Doradas", "Alianza FC", "Am\u00e9rica de Cali", "Atl\u00e9tico Bucaramanga",
    "Atl\u00e9tico Nacional", "Boyac\u00e1 Chicó", "Deportes Tolima", "Deportivo Cali",
    "Deportivo Pasto", "Envigado", "Independiente Medell\u00edn", "Independiente Santa Fe",
    "Jaguares de C\u00f3rdoba", "Junior FC", "La Equidad", "Millonarios",
    "Once Caldas", "Patriotas Boyac\u00e1", "Deportivo Pereira",
  ],
  "Copa Libertadores": [
    "Boca Juniors", "River Plate", "Flamengo", "Palmeiras",
    "Atl\u00e9tico Mineiro", "S\u00e3o Paulo", "Fluminense", "Colo-Colo",
    "Pe\u00f1arol", "Nacional", "Independiente del Valle", "LDU Quito",
    "Olimpia", "Cerro Porte\u00f1o", "Universitario", "Sporting Cristal",
    "The Strongest", "Bol\u00edvar", "Millonarios", "Atl\u00e9tico Nacional",
    "Junior FC", "Libertad", "Caracas FC", "Deportivo T\u00e1chira",
  ],
  "Copa Sudamericana": [
    "Defensa y Justicia", "Independiente", "Racing Club", "Lan\u00fas",
    "Fortaleza", "Cruzeiro", "Internacional", "Botafogo",
    "Deportivo Cali", "Deportes Tolima", "Universidad Cat\u00f3lica", "Huachipato",
    "LDU Quito", "Barcelona SC", "Sol de Am\u00e9rica", "Sportivo Luque\u00f1o",
    "Melgar", "Cienciano", "Wanderers", "Liverpool FC (Uruguay)",
  ],
  "Ecuadorian Liga Pro": [
    "Aucas", "Barcelona SC", "Delfín", "Deportivo Cuenca",
    "El Nacional", "Emelec", "Independiente del Valle", "LDU Quito",
    "Liga de Portoviejo", "Macará", "Mushuc Runa", "Orense",
    "T\u00e9cnico Universitario", "Universidad Cat\u00f3lica (Ecuador)",
  ],
  "Paraguayan Primera": [
    "Cerro Porte\u00f1o", "Club Guaraní", "General Caballero JLM", "Libertad",
    "Nacional", "Olimpia", "Sol de Am\u00e9rica", "Sportivo Ameliano",
    "Sportivo Luque\u00f1o", "Tacuary", "12 de Octubre",
  ],
  "Peruvian Liga 1": [
    "ADT Tarma", "Alianza Atl\u00e9tico", "Alianza Lima", "Atl\u00e9tico Grau",
    "Carlos Manucci", "Cienciano", "Comerciantes Unidos", "Cusco FC",
    "Deportivo Garcilaso", "Melgar", "Sport Boys", "Sport Huancayo",
    "Sporting Cristal", "Universitario", "UTC Cajamarca", "Uni\u00f3n Comercio",
  ],
  "Uruguayan Primera": [
    "Boston River", "Cerro", "Cerro Largo", "Danubio",
    "Defensor Sporting", "F\u00e9nix", "Liverpool FC (Uruguay)", "Miramar Misiones",
    "Nacional", "Pe\u00f1arol", "Plaza Colonia", "Racing (Uruguay)",
    "River Plate (Uruguay)", "Wanderers",
  ],
  "Venezuelan Primera": [
    "Academ\u00eda Puerto Cabello", "Caracas FC", "Carabobo FC", "Deportivo La Guaira",
    "Deportivo Lara", "Deportivo T\u00e1chira", "Estudiantes de M\u00e9rida", "Hermanos Colmenarez",
    "Metropolitanos FC", "Mineros de Guayana", "Monagas SC", "Portuguesa FC",
    "UCV FC", "Zamora FC",
  ],
  // ======== EUROPEAN LEAGUES ========
  "Premier League": [
    "Arsenal", "Aston Villa", "AFC Bournemouth", "Brentford", "Brighton",
    "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich Town",
    "Leicester City", "Liverpool", "Manchester City", "Manchester United",
    "Newcastle United", "Nottingham Forest", "Southampton", "Tottenham Hotspur",
    "West Ham United", "Wolverhampton Wanderers",
  ],
  "La Liga": [
    "Alav\u00e9s", "Athletic Bilbao", "Atl\u00e9tico Madrid", "Barcelona", "Betis",
    "Celta Vigo", "Espanyol", "Getafe", "Girona", "Las Palmas",
    "Legan\u00e9s", "Mallorca", "Osasuna", "Rayo Vallecano", "Real Madrid",
    "Real Sociedad", "Sevilla", "Valencia", "Valladolid", "Villarreal",
  ],
  "Bundesliga": [
    "Augsburg", "Bayer Leverkusen", "Bayern Munich", "Bochum",
    "Borussia Dortmund", "Borussia M\u00f6nchengladbach", "Eintracht Frankfurt",
    "Freiburg", "Heidenheim", "Hoffenheim", "Holstein Kiel",
    "Mainz 05", "RB Leipzig", "St. Pauli", "Stuttgart",
    "Union Berlin", "Werder Bremen", "Wolfsburg",
  ],
  "Serie A": [
    "Atalanta", "Bologna", "Cagliari", "Como", "Empoli",
    "Fiorentina", "Genoa", "Hellas Verona", "Inter Milan",
    "Juventus", "Lazio", "Lecce", "AC Milan", "Monza",
    "Napoli", "Parma", "Roma", "Torino", "Udinese", "Venezia",
  ],
  "Eredivisie": [
    "Ajax", "AZ Alkmaar", "Feyenoord", "FC Groningen", "FC Twente",
    "FC Utrecht", "Go Ahead Eagles", "Heerenveen", "Heracles",
    "NAC Breda", "NEC Nijmegen", "PEC Zwolle", "PSV Eindhoven",
    "RKC Waalwijk", "Sparta Rotterdam", "Willem II",
  ],
  "Primeira Liga": [
    "Arouca", "AVS", "Benfica", "Boavista", "Braga",
    "Casa Pia", "Estrela Amadora", "Estoril", "Famalic\u00e3o",
    "Gil Vicente", "Moreirense", "Nacional", "Porto",
    "Rio Ave", "Santa Clara", "Sporting CP", "Vit\u00f3ria de Guimar\u00e3es",
  ],
  "Scottish Premiership": [
    "Aberdeen", "Celtic", "Dundee", "Dundee United",
    "Hearts", "Hibernian", "Kilmarnock", "Motherwell",
    "Rangers", "Ross County", "St Johnstone", "St Mirren",
  ],
  "Super Lig": [
    "Adana Demirspor", "Alanyaspor", "Antalyaspor", "Be\u015fikta\u015f",
    "Fenerbah\u00e7e", "Galatasaray", "Gaziantep FK", "Hatayspor",
    "Istanbul Ba\u015fak\u015fehir", "Kasimpa\u015fa", "Kayserispor", "Konyaspor",
    "Pendikspor", "Rizespor", "Samsunspor", "Sivasspor",
    "Trabzonspor",
  ],
  "Russian Premier League": [
    "CSKA Moscow", "Dynamo Moscow", "FK Krasnodar", "Lokomotiv Moscow",
    "Rubin Kazan", "Spartak Moscow", "Zenit St. Petersburg",
  ],
  // ======== AFRICAN LEAGUES ========
  "South African Premier Division": [
    "AmaZulu", "Cape Town City", "Chippa United", "Golden Arrows",
    "Kaizer Chiefs", "Mamelodi Sundowns", "Moroka Swallows",
    "Orlando Pirates", "Richards Bay", "Royal AM",
    "Sekhukhune United", "Stellenbosch", "SuperSport United",
    "TS Galaxy",
  ],
  "Nigerian NPFL": [
    "Akwa United", "Bendel Insurance", "Doma United", "Enyimba",
    "Heartland", "Kano Pillars", "Kwara United", "Lobi Stars",
    "Niger Tornadoes", "Plateau United", "Rangers International",
    "Remo Stars", "Rivers United", "Shooting Stars",
    "Sunshine Stars", "Wikki Tourists",
  ],
  "Egyptian Premier League": [
    "Al Ahly", "Al Ittihad Alexandria", "Al Masry", "Ceramica Cleopatra",
    "El Gouna", "ENPPI", "Future FC", "Ghazl El Mahalla",
    "Ismaily", "National Bank", "Pharco", "Pyramids FC",
    "Smouha", "Zamalek", "ZED FC",
  ],
  "Kenyan Premier League": [
    "AFC Leopards", "Bandari", "Gor Mahia", "Kakamega Homeboyz",
    "Kariobangi Sharks", "KCB", "Kenya Police", "Mathare United",
    "Murang'a Seal", "Nairobi City Stars", "Nzoia Sugar",
    "Posta Rangers", "Sofapaka", "Tusker", "Ulinzi Stars",
  ],
  "CAF Champions League": [
    "Al Ahly", "Zamalek", "Mamelodi Sundowns", "Esperance",
    "Wydad Casablanca", "TP Mazembe", "Raja Casablanca",
    "Enyimba", "Kaizer Chiefs", "Simba SC", "Al Hilal Omdurman",
    "JS Kabylie",
  ],
  // ======== ASIAN LEAGUES ========
  "J-League": [
    "Albirex Niigata", "Avispa Fukuoka", "Cerezo Osaka", "FC Tokyo",
    "Gamba Osaka", "Kashima Antlers", "Kashiwa Reysol",
    "Kawasaki Frontale", "Kyoto Sanga", "Machida Zelvia",
    "Nagoya Grampus", "Sanfrecce Hiroshima", "Sagan Tosu",
    "Shonan Bellmare", "Tokyo Verdy", "Urawa Red Diamonds",
    "Vissel Kobe", "Yokohama F. Marinos",
  ],
  "K-League": [
    "Daegu FC", "Daejeon Hana Citizen", "FC Seoul", "Gangwon FC",
    "Gimcheon Sangmu", "Gwangju FC", "Incheon United",
    "Jeju United", "Jeonbuk Hyundai Motors", "Pohang Steelers",
    "Suwon FC", "Ulsan HD",
  ],
  "Chinese Super League": [
    "Beijing Guoan", "Changchun Yatai", "Chengdu Rongcheng",
    "Dalian Professional", "Henan Songshan Longmen",
    "Meizhou Hakka", "Nantong Zhiyun", "Qingdao Hainiu",
    "Shandong Taishan", "Shanghai Port", "Shanghai Shenhua",
    "Shenzhen FC", "Tianjin Jinmen Tiger", "Wuhan Three Towns",
    "Zhejiang Professional",
  ],
  "Indian Super League": [
    "ATK Mohun Bagan", "Bengaluru FC", "Chennaiyin FC", "East Bengal",
    "FC Goa", "Hyderabad FC", "Jamshedpur FC", "Kerala Blasters",
    "Mohammedan SC", "Mumbai City FC", "NorthEast United",
    "Odisha FC", "Punjab FC",
  ],
  "Saudi Pro League": [
    "Al Ahli", "Al Ettifaq", "Al Fateh", "Al Fayha",
    "Al Hilal", "Al Ittihad", "Al Khaleej", "Al Nassr",
    "Al Raed", "Al Riyadh", "Al Shabab", "Al Tai",
    "Al Wehda", "Damac", "Neom",
  ],
  "Thai League": [
    "BG Pathum United", "Buriram United", "Chiang Rai United",
    "Khon Kaen United", "Muangthong United", "Nakhon Ratchasima",
    "Port FC", "Ratchaburi FC",
  ],
  "AFC Champions League": [
    "Al Hilal", "Al Nassr", "Al Ain", "Persepolis",
    "Jeonbuk Hyundai Motors", "Urawa Red Diamonds",
    "Shanghai Port", "Ulsan HD", "Vissel Kobe",
    "Yokohama F. Marinos", "BG Pathum United", "Johor Darul Ta'zim",
  ],
  // ======== OCEANIA LEAGUES ========
  "A-League": [
    "Adelaide United", "Brisbane Roar", "Central Coast Mariners",
    "Macarthur FC", "Melbourne City", "Melbourne Victory",
    "Newcastle Jets", "Perth Glory", "Sydney FC",
    "Wellington Phoenix", "Western Sydney Wanderers", "Western United",
  ],
  "NRL": [
    "Brisbane Broncos", "Canberra Raiders", "Canterbury Bulldogs",
    "Cronulla Sharks", "Dolphins", "Gold Coast Titans",
    "Manly Sea Eagles", "Melbourne Storm", "Newcastle Knights",
    "New Zealand Warriors", "North Queensland Cowboys",
    "Parramatta Eels", "Penrith Panthers", "South Sydney Rabbitohs",
    "St George Illawarra Dragons", "Sydney Roosters", "Wests Tigers",
  ],
  "AFL": [
    "Adelaide Crows", "Brisbane Lions", "Carlton", "Collingwood",
    "Essendon", "Fremantle", "Geelong Cats", "Gold Coast Suns",
    "GWS Giants", "Hawthorn", "Melbourne", "North Melbourne",
    "Port Adelaide", "Richmond", "St Kilda", "Sydney Swans",
    "West Coast Eagles", "Western Bulldogs",
  ],
  "Super Rugby": [
    "ACT Brumbies", "Blues", "Chiefs", "Crusaders",
    "Drua", "Force", "Highlanders", "Hurricanes",
    "Melbourne Rebels", "Moana Pasifika", "NSW Waratahs",
    "Queensland Reds",
  ],
  // ======== NORTH AMERICAN / OTHER LEAGUES ========
  IFL: [
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
  ],
  HBCUGoSports: [
    // HBCU Football & Basketball Schools
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
// TEAM RSN MAPPINGS — Teams with own streaming/TV contracts
// (Not covered by league-wide deals)
// ============================================================================

export const TEAM_RSN_MAP: Record<string, { team: string; league: string; rsn: string; rsnLabel: string }> = {
  // MLB
  "ny_yankees":    { team: "New York Yankees",     league: "MLB", rsn: "yesnetwork",       rsnLabel: "YES Network" },
  "boston_redsox":  { team: "Boston Red Sox",        league: "MLB", rsn: "nesn",             rsnLabel: "NESN" },
  "la_dodgers":    { team: "Los Angeles Dodgers",   league: "MLB", rsn: "snla",             rsnLabel: "SportsNet LA" },
  "baltimore_o":   { team: "Baltimore Orioles",     league: "MLB", rsn: "masn",             rsnLabel: "MASN" },
  "wash_nats":     { team: "Washington Nationals",  league: "MLB", rsn: "masn",             rsnLabel: "MASN" },
  "chicago_cubs":  { team: "Chicago Cubs",          league: "MLB", rsn: "marquee",          rsnLabel: "Marquee Sports Network" },
  "ny_mets":       { team: "New York Mets",         league: "MLB", rsn: "sny",              rsnLabel: "SNY" },
  "houston_astros":{ team: "Houston Astros",        league: "MLB", rsn: "attsportsnet",     rsnLabel: "AT&T SportsNet" },
  "pitt_pirates":  { team: "Pittsburgh Pirates",    league: "MLB", rsn: "attsportsnet",     rsnLabel: "AT&T SportsNet" },
  "seattle_m":     { team: "Seattle Mariners",      league: "MLB", rsn: "rootsports",       rsnLabel: "ROOT Sports" },
  "la_angels":     { team: "Los Angeles Angels",    league: "MLB", rsn: "ballysports",      rsnLabel: "Bally Sports" },
  "chi_whitesox":  { team: "Chicago White Sox",     league: "MLB", rsn: "nbcsportschicago", rsnLabel: "NBC Sports Chicago" },
  "philly_phils":  { team: "Philadelphia Phillies", league: "MLB", rsn: "nbcsportsphilly",  rsnLabel: "NBC Sports Philadelphia" },
  "kc_royals":     { team: "Kansas City Royals",    league: "MLB", rsn: "kcsr",             rsnLabel: "KC Sports Network" },
  // NBA
  "ny_knicks":     { team: "New York Knicks",       league: "NBA", rsn: "msgnetwork",       rsnLabel: "MSG Network" },
  "boston_celtics": { team: "Boston Celtics",        league: "NBA", rsn: "nbcsportsboston",  rsnLabel: "NBC Sports Boston" },
  "la_lakers":     { team: "Los Angeles Lakers",    league: "NBA", rsn: "spectrumsnets",    rsnLabel: "Spectrum SportsNet" },
  "chi_bulls":     { team: "Chicago Bulls",         league: "NBA", rsn: "nbcsportschicago", rsnLabel: "NBC Sports Chicago" },
  "philly_76ers":  { team: "Philadelphia 76ers",    league: "NBA", rsn: "nbcsportsphilly",  rsnLabel: "NBC Sports Philadelphia" },
  "portland_tb":   { team: "Portland Trail Blazers",league: "NBA", rsn: "nbcsnw",           rsnLabel: "NBC Sports Northwest" },
  "wash_wizards":  { team: "Washington Wizards",    league: "NBA", rsn: "monumental",       rsnLabel: "Monumental Sports Network" },
  // NHL
  "ny_rangers":    { team: "New York Rangers",      league: "NHL", rsn: "msgnetwork",       rsnLabel: "MSG Network" },
  "nj_devils":     { team: "New Jersey Devils",     league: "NHL", rsn: "msgnetwork",       rsnLabel: "MSG Network" },
  "boston_bruins":  { team: "Boston Bruins",         league: "NHL", rsn: "nesn",             rsnLabel: "NESN" },
  "chi_blackhawks":{ team: "Chicago Blackhawks",    league: "NHL", rsn: "nbcsportschicago", rsnLabel: "NBC Sports Chicago" },
  "philly_flyers": { team: "Philadelphia Flyers",   league: "NHL", rsn: "nbcsportsphilly",  rsnLabel: "NBC Sports Philadelphia" },
  "wash_caps":     { team: "Washington Capitals",   league: "NHL", rsn: "monumental",       rsnLabel: "Monumental Sports Network" },
  // MLS
  "la_galaxy":     { team: "LA Galaxy",             league: "MLS", rsn: "spectrumsnets",    rsnLabel: "Spectrum SportsNet" },
  "sporting_kc":   { team: "Sporting Kansas City",  league: "MLS", rsn: "kcsr",             rsnLabel: "KC Sports Network" },
};

/**
 * Get the RSN platform for a given team name (fuzzy match).
 */
export function getRSNForTeam(teamName: string): { rsn: string; rsnLabel: string } | null {
  const normalized = teamName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const entry of Object.values(TEAM_RSN_MAP)) {
    const entryNorm = entry.team.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (entryNorm === normalized || normalized.includes(entryNorm) || entryNorm.includes(normalized)) {
      return { rsn: entry.rsn, rsnLabel: entry.rsnLabel };
    }
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
  yahoosports: { open: "https://sports.yahoo.com", subscribe: "https://sports.yahoo.com" },
  fanduelsports: { open: "https://www.fanduel.com/sports-network", subscribe: "https://www.fanduel.com/sports-network" },
  // Vistazo
  vixpremium: { open: "https://www.vix.com", subscribe: "https://www.vix.com/es/premium" },
  fubolatino: { open: "https://www.fubo.tv/latino", subscribe: "https://www.fubo.tv/latino" },
  telemundodeportes: { open: "https://www.telemundodeportes.com", subscribe: "https://www.telemundodeportes.com" },
  slinglatino: { open: "https://www.sling.com/latino", subscribe: "https://www.sling.com/latino" },
  espndeportes: { open: "https://www.espn.com/espndeportes", subscribe: "https://www.espn.com/espndeportes" },
  directvdeportes: { open: "https://www.directvgo.com", subscribe: "https://www.directvgo.com" },
  xfinitynowlatino: { open: "https://www.xfinity.com/learn/digital-cable-tv/latino", subscribe: "https://www.xfinity.com/learn/digital-cable-tv/latino" },
  univision: { open: "https://www.univision.com", subscribe: "https://www.univision.com" },
  telemundo: { open: "https://www.telemundo.com", subscribe: "https://www.telemundo.com" },
  estrella: { open: "https://www.estrellatv.com", subscribe: "https://www.estrellatv.com" },
  cinelatinotv: { open: "https://www.cinelatino.com", subscribe: "https://www.cinelatino.com" },
  pantaya: { open: "https://www.pantaya.com", subscribe: "https://www.pantaya.com/subscribe" },
  // RSNs (Regional Sports Networks)
  yesnetwork: { open: "https://www.yesnetwork.com", subscribe: "https://www.yesnetwork.com" },
  nesn: { open: "https://www.nesn.com", subscribe: "https://nesn.com/nesn-360" },
  snla: { open: "https://www.sportsnetla.com", subscribe: "https://www.sportsnetla.com" },
  masn: { open: "https://www.masnsports.com", subscribe: "https://www.masnsports.com" },
  marquee: { open: "https://www.marqueesportsnetwork.com", subscribe: "https://www.marqueesportsnetwork.com" },
  sny: { open: "https://www.sny.tv", subscribe: "https://www.sny.tv" },
  attsportsnet: { open: "https://www.attsportsnet.com", subscribe: "https://www.attsportsnet.com" },
  nbcsportsboston: { open: "https://www.nbcsports.com/boston", subscribe: "https://www.nbcsports.com/boston" },
  msgnetwork: { open: "https://www.msgnetworks.com", subscribe: "https://www.msgnetworks.com" },
  ballysports: { open: "https://www.ballysports.com", subscribe: "https://www.ballysports.com" },
  rootsports: { open: "https://www.rootsports.com", subscribe: "https://www.rootsports.com" },
  spectrumsnets: { open: "https://www.spectrumsnets.com", subscribe: "https://www.spectrumsnets.com" },
  nbcsportschicago: { open: "https://www.nbcsports.com/chicago", subscribe: "https://www.nbcsports.com/chicago" },
  nbcsportsphilly: { open: "https://www.nbcsports.com/philadelphia", subscribe: "https://www.nbcsports.com/philadelphia" },
  nbcsnw: { open: "https://www.nbcsports.com/northwest", subscribe: "https://www.nbcsports.com/northwest" },
  kcsr: { open: "https://www.kcsportsnetwork.com", subscribe: "https://www.kcsportsnetwork.com" },
  monumental: { open: "https://www.monumentalsportsnetwork.com", subscribe: "https://www.monumentalsportsnetwork.com" },
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
