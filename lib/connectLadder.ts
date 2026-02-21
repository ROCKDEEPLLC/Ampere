// ============================================================================
// AMPÈRE CONNECT PLATFORMS LADDER — Level 1/2/3 Connectors
// File: lib/connectLadder.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export type ConnectLevel = 1 | 2 | 3;

export interface PlatformEntitlement {
  platformId: string;
  tier: "free" | "basic" | "premium" | "ultimate";
  maxStreams: number;
  adSupported: boolean;
  offlineEnabled: boolean;
  hdEnabled: boolean;
  fourKEnabled: boolean;
  tokenExpiry?: number;
}

export interface WatchStateEntry {
  id: string;
  contentId: string;
  title: string;
  platformId: string;
  positionSeconds: number;
  durationSeconds: number;
  percentComplete: number;
  lastWatchedAt: number;
  episodeInfo?: { season: number; episode: number; episodeTitle: string };
}

export interface ConnectLadderState {
  // Level 1 — Deep links (free)
  connectedPlatforms: Record<string, boolean>;
  // Level 2 — Entitlements (premium)
  entitlements: Record<string, PlatformEntitlement>;
  // Level 3 — Watch state (premium)
  watchState: WatchStateEntry[];
}

// ============================================================================
// STORAGE
// ============================================================================

const LADDER_KEY = "ampere.connectLadder.v1";

export function getConnectLadderState(): ConnectLadderState {
  const saved = loadJson<ConnectLadderState>(LADDER_KEY);
  if (saved && saved.connectedPlatforms) return saved;
  return { connectedPlatforms: {}, entitlements: {}, watchState: [] };
}

export function saveConnectLadderState(state: ConnectLadderState): void {
  saveJson(LADDER_KEY, state);
}

// ============================================================================
// LEVEL 1 — Deep Link (Free)
// ============================================================================

export function connectPlatformLevel1(platformId: string): void {
  const state = getConnectLadderState();
  state.connectedPlatforms[platformId] = true;
  saveConnectLadderState(state);
  addLog("connect_level1", { platformId });
}

export function disconnectPlatform(platformId: string): void {
  const state = getConnectLadderState();
  delete state.connectedPlatforms[platformId];
  delete state.entitlements[platformId];
  state.watchState = state.watchState.filter((w) => w.platformId !== platformId);
  saveConnectLadderState(state);
  addLog("connect_disconnect", { platformId });
}

export function getConnectedPlatforms(): string[] {
  const state = getConnectLadderState();
  return Object.keys(state.connectedPlatforms).filter((k) => state.connectedPlatforms[k]);
}

// ============================================================================
// LEVEL 2 — Entitlement-aware (Premium)
// Mock connector interface + working demo adapter
// ============================================================================

export interface EntitlementConnector {
  platformId: string;
  fetchEntitlements(): Promise<PlatformEntitlement>;
  isEntitled(contentId: string): Promise<boolean>;
}

// Working mock connector for Netflix
class MockNetflixConnector implements EntitlementConnector {
  platformId = "netflix";
  async fetchEntitlements(): Promise<PlatformEntitlement> {
    return {
      platformId: "netflix",
      tier: "premium",
      maxStreams: 4,
      adSupported: false,
      offlineEnabled: true,
      hdEnabled: true,
      fourKEnabled: true,
      tokenExpiry: Date.now() + 3600000,
    };
  }
  async isEntitled(): Promise<boolean> { return true; }
}

// Working mock connector for Disney+
class MockDisneyConnector implements EntitlementConnector {
  platformId = "disneyplus";
  async fetchEntitlements(): Promise<PlatformEntitlement> {
    return {
      platformId: "disneyplus",
      tier: "basic",
      maxStreams: 2,
      adSupported: true,
      offlineEnabled: false,
      hdEnabled: true,
      fourKEnabled: false,
      tokenExpiry: Date.now() + 3600000,
    };
  }
  async isEntitled(): Promise<boolean> { return true; }
}

// Generic mock connector for any platform
class MockGenericConnector implements EntitlementConnector {
  platformId: string;
  constructor(platformId: string) { this.platformId = platformId; }
  async fetchEntitlements(): Promise<PlatformEntitlement> {
    return {
      platformId: this.platformId,
      tier: "basic",
      maxStreams: 1,
      adSupported: false,
      offlineEnabled: false,
      hdEnabled: true,
      fourKEnabled: false,
    };
  }
  async isEntitled(): Promise<boolean> { return true; }
}

const CONNECTORS: Record<string, EntitlementConnector> = {
  netflix: new MockNetflixConnector(),
  disneyplus: new MockDisneyConnector(),
};

export function getEntitlementConnector(platformId: string): EntitlementConnector {
  return CONNECTORS[platformId] ?? new MockGenericConnector(platformId);
}

export async function fetchAndStoreEntitlement(platformId: string): Promise<PlatformEntitlement> {
  const connector = getEntitlementConnector(platformId);
  const entitlement = await connector.fetchEntitlements();
  const state = getConnectLadderState();
  state.entitlements[platformId] = entitlement;
  saveConnectLadderState(state);
  addLog("connect_level2_fetch", { platformId, tier: entitlement.tier });
  return entitlement;
}

export function getStoredEntitlement(platformId: string): PlatformEntitlement | null {
  const state = getConnectLadderState();
  return state.entitlements[platformId] ?? null;
}

export function isEntitledToPlay(platformId: string): boolean {
  const ent = getStoredEntitlement(platformId);
  return ent !== null;
}

// ============================================================================
// LEVEL 3 — Watch State Ingest (Premium)
// Normalized model + working mock adapter
// ============================================================================

export interface WatchStateAdapter {
  platformId: string;
  fetchWatchState(): Promise<WatchStateEntry[]>;
}

class MockNetflixWatchAdapter implements WatchStateAdapter {
  platformId = "netflix";
  async fetchWatchState(): Promise<WatchStateEntry[]> {
    return [
      {
        id: "ws_nf_1",
        contentId: "nf_stranger_things",
        title: "Stranger Things",
        platformId: "netflix",
        positionSeconds: 1845,
        durationSeconds: 3120,
        percentComplete: 59,
        lastWatchedAt: Date.now() - 86400000,
        episodeInfo: { season: 5, episode: 3, episodeTitle: "The Crawl" },
      },
      {
        id: "ws_nf_2",
        contentId: "nf_wednesday",
        title: "Wednesday",
        platformId: "netflix",
        positionSeconds: 2400,
        durationSeconds: 2700,
        percentComplete: 89,
        lastWatchedAt: Date.now() - 172800000,
        episodeInfo: { season: 2, episode: 1, episodeTitle: "New Semester" },
      },
    ];
  }
}

class MockGenericWatchAdapter implements WatchStateAdapter {
  platformId: string;
  constructor(platformId: string) { this.platformId = platformId; }
  async fetchWatchState(): Promise<WatchStateEntry[]> { return []; }
}

const WATCH_ADAPTERS: Record<string, WatchStateAdapter> = {
  netflix: new MockNetflixWatchAdapter(),
};

export function getWatchStateAdapter(platformId: string): WatchStateAdapter {
  return WATCH_ADAPTERS[platformId] ?? new MockGenericWatchAdapter(platformId);
}

export async function ingestWatchState(platformId: string): Promise<WatchStateEntry[]> {
  const adapter = getWatchStateAdapter(platformId);
  const entries = await adapter.fetchWatchState();

  const state = getConnectLadderState();
  // Merge new entries, updating existing ones
  for (const entry of entries) {
    const idx = state.watchState.findIndex((w) => w.id === entry.id);
    if (idx >= 0) state.watchState[idx] = entry;
    else state.watchState.push(entry);
  }
  // Keep latest 200 entries
  state.watchState.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  state.watchState = state.watchState.slice(0, 200);
  saveConnectLadderState(state);

  addLog("connect_level3_ingest", { platformId, entriesIngested: entries.length });
  return entries;
}

export function getContinueWatchingFromWatchState(): WatchStateEntry[] {
  const state = getConnectLadderState();
  return state.watchState
    .filter((w) => w.percentComplete > 5 && w.percentComplete < 95)
    .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
    .slice(0, 20);
}

// ============================================================================
// LEVEL HELPERS
// ============================================================================

export function getMaxLevelForPlatform(platformId: string, isPremiumUser: boolean): ConnectLevel {
  const state = getConnectLadderState();
  if (!state.connectedPlatforms[platformId]) return 1; // can still deep link
  if (!isPremiumUser) return 1;
  if (state.entitlements[platformId]) {
    if (state.watchState.some((w) => w.platformId === platformId)) return 3;
    return 2;
  }
  return 1;
}
