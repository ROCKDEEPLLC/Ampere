export type TabKey = "home" | "live" | "favs" | "search";

export type GenreKey =
  | "All"
  | "Basic Streaming"
  | "Movie Streaming"
  | "Documentaries"
  | "Anime / Asian cinema"
  | "Kids"
  | "LiveTV"
  | "Premium Sports Streaming"
  | "Gaming"
  | "Free Streaming"
  | "Indie and Arthouse Film"
  | "Horror / Cult"
  | "LGBT"
  | "Black culture & diaspora";

export type PlatformId = string;

export type Platform = {
  id: PlatformId;
  label: string;
  genres?: GenreKey[];
  kind?: "streaming" | "sports" | "kids" | "livetv" | "gaming" | "niche" | "fast" | "music";
};

export type Card = {
  id: string;
  title: string;
  subtitle?: string;
  platformId?: PlatformId;
  platformLabel?: string;
  badge?: "LIVE" | "UPCOMING" | "NEW" | string;
  badgeRight?: string;
  metaLeft?: string;
  metaRight?: string;
  league?: string;
  genre?: GenreKey;
  startTime?: string;
  timeRemaining?: string;
};

export type ProfileState = {
  name: string;
  profilePhoto: string | null;
  headerPhoto: string | null;
  favoritePlatformIds: PlatformId[];
  favoriteLeagues: string[];
  favoriteTeams: string[];
  connectedPlatformIds: Partial<Record<PlatformId, boolean>>;
  notificationsEnabled: boolean;
};

export type ViewingEvent = {
  id: string;
  title: string;
  platformId?: PlatformId;
  league?: string;
  at: string;
};

export type AttributionEvent = {
  at: string;
  sessionId: string;
  event: string;
  props: Record<string, any>;
};

export type WizardDraft = {
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
  platforms: PlatformId[];
  leagues: string[];
  teams: string[];
  updatedAt: string;
};

export type TVBrandId =
  | "samsung"
  | "lg"
  | "sony"
  | "tcl"
  | "hisense"
  | "vizio"
  | "roku"
  | "firetv"
  | "appletv"
  | "androidtv"
  | "chromecast";

export type TVConnectPlanId = "starter" | "plus" | "pro";

export type TVConnectState = {
  brandId: TVBrandId | null;
  planId: TVConnectPlanId;
  paired: boolean;
  updatedAt: string;
};
