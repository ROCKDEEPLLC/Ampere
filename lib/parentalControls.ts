// ============================================================================
// AMPERE PARENTAL CONTROLS
// File: lib/parentalControls.ts
//
// Implements:
// - PIN-protected profiles
// - Content filters by age rating and genre
// - Time limits for usage
// - Activity logs for parents
// - Kid Mode UI with simplified navigation
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type AgeRating = "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG" | "TV-14" | "TV-MA" | "G" | "PG" | "PG-13" | "R" | "NC-17" | "NR";

export type ContentRestriction = "violence" | "language" | "nudity" | "drugs" | "horror" | "gambling";

export interface ParentalProfile {
  id: string;
  name: string;
  isKidProfile: boolean;
  isRestricted: boolean;
  pin?: string; // Hashed PIN for switching to this profile
  avatar?: string;
  maxAgeRating: AgeRating;
  blockedGenres: string[];
  blockedPlatforms: string[];
  blockedContentIds: string[];
  contentRestrictions: ContentRestriction[];
  timeLimit?: TimeLimitConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLimitConfig {
  enabled: boolean;
  dailyLimitMinutes: number;
  weekendLimitMinutes?: number; // Optional different limit for weekends
  allowedHoursStart: number; // 24h format, e.g. 8 = 8am
  allowedHoursEnd: number; // 24h format, e.g. 21 = 9pm
  bedtimeEnabled: boolean;
  bedtimeHour: number;
  bedtimeMinute: number;
  warningBeforeLimitMinutes: number; // Warn N minutes before limit
}

export interface ActivityLogEntry {
  id: string;
  profileId: string;
  profileName: string;
  action: "content_viewed" | "content_blocked" | "search_query" | "platform_opened" | "time_limit_reached" | "pin_attempt" | "profile_switch";
  details: string;
  contentTitle?: string;
  platformId?: string;
  timestamp: string;
  duration?: number; // minutes
}

export interface KidModeConfig {
  enabled: boolean;
  simplifiedNavigation: boolean;
  hideSearch: boolean;
  hideLiveTV: boolean;
  customBackground?: string;
  approvedPlatforms: string[];
  approvedGenres: string[];
  maxResultsPerPage: number;
}

export interface ParentalState {
  masterPinHash: string;
  profiles: ParentalProfile[];
  activeProfileId: string;
  activityLog: ActivityLogEntry[];
  kidModeConfig: KidModeConfig;
}

// ============================================================================
// AGE RATING HIERARCHY (strictest to most permissive)
// ============================================================================

const AGE_RATING_LEVELS: Record<AgeRating, number> = {
  "TV-Y": 0,
  "TV-Y7": 1,
  "G": 2,
  "TV-G": 2,
  "PG": 3,
  "TV-PG": 3,
  "PG-13": 4,
  "TV-14": 4,
  "R": 5,
  "TV-MA": 5,
  "NC-17": 6,
  "NR": 6,
};

// ============================================================================
// PARENTAL CONTROLS MANAGER
// ============================================================================

export class ParentalControlsManager {
  private state: ParentalState;
  private usageStartTime: number | null = null;
  private usageCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(savedState?: ParentalState) {
    this.state = savedState ?? {
      masterPinHash: "",
      profiles: [
        {
          id: "default",
          name: "Main",
          isKidProfile: false,
          isRestricted: false,
          maxAgeRating: "NC-17",
          blockedGenres: [],
          blockedPlatforms: [],
          blockedContentIds: [],
          contentRestrictions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activeProfileId: "default",
      activityLog: [],
      kidModeConfig: {
        enabled: false,
        simplifiedNavigation: true,
        hideSearch: false,
        hideLiveTV: true,
        approvedPlatforms: ["disneyplus", "youtube", "pbskids", "noggin", "kidoodletv", "happykids"],
        approvedGenres: ["Kids"],
        maxResultsPerPage: 20,
      },
    };
  }

  // -- PIN Management --

  async setMasterPin(pin: string): Promise<void> {
    // In production: use Argon2id or bcrypt
    this.state.masterPinHash = await this.hashPin(pin);
  }

  async verifyMasterPin(pin: string): Promise<boolean> {
    const hash = await this.hashPin(pin);
    const valid = hash === this.state.masterPinHash;
    this.logActivity({
      action: "pin_attempt",
      details: valid ? "Master PIN verified" : "Master PIN attempt failed",
    });
    return valid;
  }

  async setProfilePin(profileId: string, pin: string): Promise<void> {
    const profile = this.getProfile(profileId);
    if (!profile) return;
    profile.pin = await this.hashPin(pin);
    profile.updatedAt = new Date().toISOString();
  }

  async verifyProfilePin(profileId: string, pin: string): Promise<boolean> {
    const profile = this.getProfile(profileId);
    if (!profile?.pin) return true; // No PIN set = unrestricted
    const hash = await this.hashPin(pin);
    return hash === profile.pin;
  }

  private async hashPin(pin: string): Promise<string> {
    // In production: use Argon2id. For prototype, use SHA-256.
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + "_ampere_salt_v1");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // -- Profile Management --

  createProfile(profile: Omit<ParentalProfile, "id" | "createdAt" | "updatedAt">): ParentalProfile {
    const newProfile: ParentalProfile = {
      ...profile,
      id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.profiles.push(newProfile);
    return newProfile;
  }

  getProfile(profileId: string): ParentalProfile | undefined {
    return this.state.profiles.find((p) => p.id === profileId);
  }

  getActiveProfile(): ParentalProfile | undefined {
    return this.state.profiles.find((p) => p.id === this.state.activeProfileId);
  }

  async switchProfile(profileId: string, pin?: string): Promise<boolean> {
    const profile = this.getProfile(profileId);
    if (!profile) return false;

    // If profile has a PIN, verify it
    if (profile.pin) {
      if (!pin) return false;
      const valid = await this.verifyProfilePin(profileId, pin);
      if (!valid) return false;
    }

    this.state.activeProfileId = profileId;
    this.logActivity({
      action: "profile_switch",
      details: `Switched to profile: ${profile.name}`,
    });

    // Reset usage timer for new profile
    this.startUsageTracking();
    return true;
  }

  // -- Content Filtering --

  isContentAllowed(contentRating: AgeRating, genre: string, platformId: string, contentId?: string): { allowed: boolean; reason?: string } {
    const profile = this.getActiveProfile();
    if (!profile || !profile.isRestricted) return { allowed: true };

    // Check age rating
    const maxLevel = AGE_RATING_LEVELS[profile.maxAgeRating] ?? 6;
    const contentLevel = AGE_RATING_LEVELS[contentRating] ?? 6;
    if (contentLevel > maxLevel) {
      this.logActivity({
        action: "content_blocked",
        details: `Blocked: rating ${contentRating} exceeds max ${profile.maxAgeRating}`,
        contentTitle: contentId,
        platformId,
      });
      return { allowed: false, reason: `Content rated ${contentRating} is above your profile's limit of ${profile.maxAgeRating}` };
    }

    // Check blocked genres
    if (profile.blockedGenres.includes(genre)) {
      return { allowed: false, reason: `Genre "${genre}" is blocked on this profile` };
    }

    // Check blocked platforms
    if (profile.blockedPlatforms.includes(platformId)) {
      return { allowed: false, reason: `Platform is blocked on this profile` };
    }

    // Check specific blocked content
    if (contentId && profile.blockedContentIds.includes(contentId)) {
      return { allowed: false, reason: "This content has been blocked" };
    }

    return { allowed: true };
  }

  // -- Time Limits --

  startUsageTracking(): void {
    this.usageStartTime = Date.now();

    if (this.usageCheckInterval) {
      clearInterval(this.usageCheckInterval);
    }

    const profile = this.getActiveProfile();
    if (!profile?.timeLimit?.enabled) return;

    this.usageCheckInterval = setInterval(() => {
      this.checkTimeLimit();
    }, 60000); // Check every minute
  }

  private checkTimeLimit(): void {
    const profile = this.getActiveProfile();
    if (!profile?.timeLimit?.enabled || !this.usageStartTime) return;

    const elapsedMinutes = (Date.now() - this.usageStartTime) / 60000;
    const isWeekend = [0, 6].includes(new Date().getDay());
    const limit = isWeekend && profile.timeLimit.weekendLimitMinutes
      ? profile.timeLimit.weekendLimitMinutes
      : profile.timeLimit.dailyLimitMinutes;

    if (elapsedMinutes >= limit) {
      this.logActivity({
        action: "time_limit_reached",
        details: `Daily time limit of ${limit} minutes reached`,
      });
      // In production: trigger UI notification and lock profile
    }

    // Check bedtime
    if (profile.timeLimit.bedtimeEnabled) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const bedtimeMinutes = profile.timeLimit.bedtimeHour * 60 + profile.timeLimit.bedtimeMinute;
      if (currentMinutes >= bedtimeMinutes) {
        this.logActivity({
          action: "time_limit_reached",
          details: "Bedtime reached",
        });
      }
    }
  }

  getRemainingTime(): number | null {
    const profile = this.getActiveProfile();
    if (!profile?.timeLimit?.enabled || !this.usageStartTime) return null;

    const elapsedMinutes = (Date.now() - this.usageStartTime) / 60000;
    const isWeekend = [0, 6].includes(new Date().getDay());
    const limit = isWeekend && profile.timeLimit.weekendLimitMinutes
      ? profile.timeLimit.weekendLimitMinutes
      : profile.timeLimit.dailyLimitMinutes;

    return Math.max(0, limit - elapsedMinutes);
  }

  // -- Kid Mode --

  isKidModeActive(): boolean {
    const profile = this.getActiveProfile();
    return !!(profile?.isKidProfile && this.state.kidModeConfig.enabled);
  }

  getKidModeConfig(): KidModeConfig {
    return this.state.kidModeConfig;
  }

  setKidModeConfig(config: Partial<KidModeConfig>): void {
    this.state.kidModeConfig = { ...this.state.kidModeConfig, ...config };
  }

  // -- Activity Log --

  private logActivity(entry: Omit<ActivityLogEntry, "id" | "profileId" | "profileName" | "timestamp">): void {
    const profile = this.getActiveProfile();
    this.state.activityLog.push({
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      profileId: this.state.activeProfileId,
      profileName: profile?.name ?? "Unknown",
      timestamp: new Date().toISOString(),
    });

    // Keep last 1000 entries
    if (this.state.activityLog.length > 1000) {
      this.state.activityLog = this.state.activityLog.slice(-1000);
    }
  }

  getActivityLog(profileId?: string, limit = 50): ActivityLogEntry[] {
    let logs = this.state.activityLog;
    if (profileId) {
      logs = logs.filter((l) => l.profileId === profileId);
    }
    return logs.slice(-limit);
  }

  // -- State Export --

  getState(): ParentalState {
    return { ...this.state };
  }

  destroy(): void {
    if (this.usageCheckInterval) {
      clearInterval(this.usageCheckInterval);
    }
  }
}
