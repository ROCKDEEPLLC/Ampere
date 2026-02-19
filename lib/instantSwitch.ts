// ============================================================================
// AMPERE INSTANTSWITCH — Low-Latency Content Toggle
// File: lib/instantSwitch.ts
//
// Achieves sub-300ms switching between streaming content by:
// - Preloading and suspending multiple streams in memory
// - Preserving playback state across switches
// - Managing memory with intelligent buffer eviction
// - Tiered integration: full API → SDK → deep link → webview fallback
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationTier = "full_api" | "sdk" | "deep_link" | "webview";

export interface StreamState {
  contentId: string;
  platformId: string;
  playbackPosition: number; // seconds
  bufferHealth: number; // seconds of buffered content ahead
  isPlaying: boolean;
  isSuspended: boolean;
  memoryUsage: number; // bytes
  lastAccessed: number; // timestamp
  integrationTier: IntegrationTier;
}

export interface SwitchMetrics {
  fromContentId: string | null;
  toContentId: string;
  switchTimeMs: number;
  wasPreloaded: boolean;
  integrationTier: IntegrationTier;
  timestamp: number;
}

// ============================================================================
// PLATFORM INTEGRATION TIERS
// Determines how we connect to each streaming service
// ============================================================================

export const PLATFORM_INTEGRATION_TIERS: Record<string, IntegrationTier> = {
  // Tier 1 — Full API integration (direct playback control)
  youtube: "full_api",
  twitch: "full_api",
  pluto: "full_api",
  tubi: "full_api",
  plex: "full_api",
  crackle: "full_api",

  // Tier 2 — SDK integration (partner SDK for embedding)
  roku: "sdk",
  firetv: "sdk",

  // Tier 3 — Deep linking with background state preservation
  netflix: "deep_link",
  hulu: "deep_link",
  disneyplus: "deep_link",
  max: "deep_link",
  primevideo: "deep_link",
  peacock: "deep_link",
  paramountplus: "deep_link",
  appletv: "deep_link",
  espnplus: "deep_link",

  // Tier 4 — Webview with enhanced cookie/session management (fallback)
  default: "webview",
};

export function getIntegrationTier(platformId: string): IntegrationTier {
  return PLATFORM_INTEGRATION_TIERS[platformId] ?? PLATFORM_INTEGRATION_TIERS["default"];
}

// ============================================================================
// INSTANTSWITCH CONTROLLER
// ============================================================================

export class InstantSwitchController {
  private activeStreams: Map<string, StreamState> = new Map();
  private currentActiveId: string | null = null;
  private preloadBuffer: number;
  private memoryThresholdBytes: number;
  private switchHistory: SwitchMetrics[] = [];

  constructor(options?: { preloadBuffer?: number; memoryThresholdMB?: number }) {
    this.preloadBuffer = options?.preloadBuffer ?? 4;
    this.memoryThresholdBytes = (options?.memoryThresholdMB ?? 512) * 1024 * 1024;
  }

  /**
   * Switch to a content stream. If preloaded, resumes instantly.
   * Returns switch time in milliseconds.
   */
  async switchToContent(contentId: string, platformId: string): Promise<SwitchMetrics> {
    const startTime = performance.now();
    const prevActiveId = this.currentActiveId;

    if (this.activeStreams.has(contentId)) {
      // Stream is preloaded — instant resume
      if (prevActiveId && prevActiveId !== contentId) {
        await this.suspendStream(prevActiveId);
      }
      await this.resumeStream(contentId);
      this.currentActiveId = contentId;

      const metrics: SwitchMetrics = {
        fromContentId: prevActiveId,
        toContentId: contentId,
        switchTimeMs: performance.now() - startTime,
        wasPreloaded: true,
        integrationTier: this.activeStreams.get(contentId)!.integrationTier,
        timestamp: Date.now(),
      };
      this.switchHistory.push(metrics);
      return metrics;
    } else {
      // Need to initialize new stream
      if (prevActiveId) {
        await this.suspendStream(prevActiveId);
      }
      await this.initializeStream(contentId, platformId);
      this.currentActiveId = contentId;

      const metrics: SwitchMetrics = {
        fromContentId: prevActiveId,
        toContentId: contentId,
        switchTimeMs: performance.now() - startTime,
        wasPreloaded: false,
        integrationTier: getIntegrationTier(platformId),
        timestamp: Date.now(),
      };
      this.switchHistory.push(metrics);
      return metrics;
    }
  }

  /**
   * Preload content for faster switching later.
   */
  async preloadContent(contentId: string, platformId: string): Promise<void> {
    if (this.activeStreams.has(contentId)) return;

    // Check memory before preloading
    if (this.getCurrentMemoryUsage() > this.memoryThresholdBytes * 0.8) {
      await this.evictLeastRecentStream();
    }

    await this.initializeStream(contentId, platformId, true);
  }

  /**
   * Preload recently viewed content for quick re-access.
   */
  async preloadRecentContent(recentContentIds: Array<{ contentId: string; platformId: string }>): Promise<void> {
    const toPreload = recentContentIds.slice(0, this.preloadBuffer);
    await Promise.all(
      toPreload.map(({ contentId, platformId }) =>
        this.preloadContent(contentId, platformId)
      )
    );
  }

  // -- Internal stream management --

  private async initializeStream(contentId: string, platformId: string, suspended = false): Promise<void> {
    const tier = getIntegrationTier(platformId);

    const state: StreamState = {
      contentId,
      platformId,
      playbackPosition: 0,
      bufferHealth: 0,
      isPlaying: !suspended,
      isSuspended: suspended,
      memoryUsage: 50 * 1024 * 1024, // Estimate 50MB per stream
      lastAccessed: Date.now(),
      integrationTier: tier,
    };

    this.activeStreams.set(contentId, state);
  }

  private async suspendStream(contentId: string): Promise<void> {
    const stream = this.activeStreams.get(contentId);
    if (!stream) return;

    stream.isPlaying = false;
    stream.isSuspended = true;
    // In production: pause media player, flush partial buffers, save position
  }

  private async resumeStream(contentId: string): Promise<void> {
    const stream = this.activeStreams.get(contentId);
    if (!stream) return;

    stream.isSuspended = false;
    stream.isPlaying = true;
    stream.lastAccessed = Date.now();
    // In production: resume media player from saved position
  }

  private async evictLeastRecentStream(): Promise<void> {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [id, state] of this.activeStreams) {
      if (id === this.currentActiveId) continue; // Never evict active stream
      if (state.lastAccessed < oldestTime) {
        oldestTime = state.lastAccessed;
        oldest = id;
      }
    }

    if (oldest) {
      await this.releaseStream(oldest);
    }
  }

  private async releaseStream(contentId: string): Promise<void> {
    const stream = this.activeStreams.get(contentId);
    if (!stream) return;

    // In production: full teardown — flush buffers, release media resources
    this.activeStreams.delete(contentId);
  }

  private getCurrentMemoryUsage(): number {
    let total = 0;
    for (const state of this.activeStreams.values()) {
      total += state.memoryUsage;
    }
    return total;
  }

  /**
   * Release all streams older than given threshold, keeping the active one.
   */
  releaseOldStreams(maxAgeMs = 300000): void {
    const now = Date.now();
    for (const [id, state] of this.activeStreams) {
      if (id === this.currentActiveId) continue;
      if (now - state.lastAccessed > maxAgeMs) {
        this.activeStreams.delete(id);
      }
    }
  }

  // -- Metrics --

  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  getAverageSwitchTime(): number {
    if (this.switchHistory.length === 0) return 0;
    const total = this.switchHistory.reduce((sum, m) => sum + m.switchTimeMs, 0);
    return total / this.switchHistory.length;
  }

  getSwitchHistory(): SwitchMetrics[] {
    return [...this.switchHistory];
  }
}
