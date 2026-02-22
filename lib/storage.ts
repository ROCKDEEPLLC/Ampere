export function loadJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in demo
  }
}

export function removeJson(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ============================================================================
// AMPÈRE STORAGE KEY REGISTRY — All required keys
// ============================================================================

export const STORAGE_KEYS = {
  // Existing keys (preserved)
  profile: "ampere_profile_v5",
  viewing: "ampere_viewing_v4",
  attribution: "ampere_attrib_v1",
  session: "ampere_session_v1",
  wizard: "ampere_setup_wiz_v1",
  // Telemetry
  telemetry: "ampere.telemetry.v2",
  // Required new keys
  plan: "ampere.plan.v1",
  taste: "ampere.taste.v1",
  feedback: "ampere.feedback.v1",
  queue: "ampere.queue.v1",
  delight: "ampere.delight.v1",
  mode: "ampere.mode.v1",
  privateMode: "ampere.privateMode.v1",
  profiles: "ampere.profiles.v1",
  device: "ampere.device.v1",
  social: "ampere.social.v1",
  livePulse: "ampere.livePulse.v1",
  // Additional keys
  connectLadder: "ampere.connectLadder.v1",
  emulator: "ampere.emulator.v1",
  scenes: "ampere.scenes.v1",
  tastePacks: "ampere.tastePacks.v1",
  bets: "ampere.bets.v1",
  bankroll: "ampere.bankroll.v1",
} as const;

// ============================================================================
// PRIVATE MODE
// ============================================================================

export function isPrivateMode(): boolean {
  const raw = loadJson<{ enabled: boolean }>(STORAGE_KEYS.privateMode);
  return raw?.enabled ?? false;
}

export function setPrivateMode(enabled: boolean): void {
  saveJson(STORAGE_KEYS.privateMode, { enabled, setAt: Date.now() });
}

// ============================================================================
// FAMILY PROFILES
// ============================================================================

export interface FamilyProfile {
  id: string;
  name: string;
  avatar: string | null;
  pin?: string;
  isKid: boolean;
  tasteKey?: string;
  queueKey?: string;
  viewingKey?: string;
  createdAt: number;
}

export function getFamilyProfiles(): FamilyProfile[] {
  return loadJson<FamilyProfile[]>(STORAGE_KEYS.profiles) ?? [];
}

export function saveFamilyProfiles(profiles: FamilyProfile[]): void {
  saveJson(STORAGE_KEYS.profiles, profiles);
}

// ============================================================================
// FULL EXPORT / IMPORT
// ============================================================================

export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    data[name] = loadJson(key);
  }
  return JSON.stringify({ version: 1, exportedAt: Date.now(), data }, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.data || parsed.version !== 1) return false;
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      if (parsed.data[name] !== undefined && parsed.data[name] !== null) {
        saveJson(key, parsed.data[name]);
      }
    }
    return true;
  } catch {
    return false;
  }
}
