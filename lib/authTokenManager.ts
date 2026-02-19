// ============================================================================
// AMPERE AUTHENTICATION TOKEN MANAGER
// File: lib/authTokenManager.ts
//
// Handles platform-specific authentication with:
// - Token refresh logic per platform (varying expiration policies)
// - Proactive renewal before expiration (prevents session interruptions)
// - Secure token storage with encryption
// - Platform-specific auth handlers (OAuth, API key, session cookie)
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  tokenType: "bearer" | "api_key" | "session";
  scopes?: string[];
  platformId: string;
  issuedAt: number;
}

export interface PlatformAuthConfig {
  platformId: string;
  authType: "oauth2" | "api_key" | "session_cookie" | "device_code" | "none";
  tokenEndpoint?: string;
  authorizationEndpoint?: string;
  clientId?: string;
  scopes?: string[];
  refreshSupported: boolean;
  tokenLifetimeMs: number;
  proactiveRefreshMs: number; // Refresh this many ms before expiration
}

export interface AuthEvent {
  type: "token_issued" | "token_refreshed" | "token_expired" | "token_revoked" | "auth_failed" | "reauth_required";
  platformId: string;
  timestamp: number;
  details?: string;
}

// ============================================================================
// PLATFORM AUTH CONFIGURATIONS
// ============================================================================

export const PLATFORM_AUTH_CONFIGS: Record<string, PlatformAuthConfig> = {
  netflix: {
    platformId: "netflix",
    authType: "oauth2",
    refreshSupported: true,
    tokenLifetimeMs: 3600000, // 1 hour
    proactiveRefreshMs: 300000, // 5 min before expiry
  },
  disneyplus: {
    platformId: "disneyplus",
    authType: "oauth2",
    refreshSupported: true,
    tokenLifetimeMs: 7200000, // 2 hours
    proactiveRefreshMs: 600000,
  },
  hulu: {
    platformId: "hulu",
    authType: "oauth2",
    refreshSupported: true,
    tokenLifetimeMs: 3600000,
    proactiveRefreshMs: 300000,
  },
  max: {
    platformId: "max",
    authType: "oauth2",
    refreshSupported: true,
    tokenLifetimeMs: 3600000,
    proactiveRefreshMs: 300000,
  },
  primevideo: {
    platformId: "primevideo",
    authType: "oauth2",
    refreshSupported: true,
    tokenLifetimeMs: 3600000,
    proactiveRefreshMs: 300000,
  },
  youtube: {
    platformId: "youtube",
    authType: "oauth2",
    scopes: ["youtube.readonly"],
    refreshSupported: true,
    tokenLifetimeMs: 3600000,
    proactiveRefreshMs: 300000,
  },
  espnplus: {
    platformId: "espnplus",
    authType: "oauth2",
    refreshSupported: true,
    tokenLifetimeMs: 1800000, // 30 min
    proactiveRefreshMs: 180000,
  },
  tubi: {
    platformId: "tubi",
    authType: "none",
    refreshSupported: false,
    tokenLifetimeMs: 0,
    proactiveRefreshMs: 0,
  },
  pluto: {
    platformId: "pluto",
    authType: "session_cookie",
    refreshSupported: false,
    tokenLifetimeMs: 86400000, // 24 hours
    proactiveRefreshMs: 3600000,
  },
};

// ============================================================================
// SECURE TOKEN STORAGE
// ============================================================================

export class SecureTokenStorage {
  private storage: Map<string, Token> = new Map();

  async saveToken(platformId: string, token: Token): Promise<void> {
    // In production: encrypt token before storage using AES-256-GCM
    // with a key derived from device credentials via HKDF
    this.storage.set(platformId, { ...token });
  }

  async getToken(platformId: string): Promise<Token | null> {
    return this.storage.get(platformId) ?? null;
  }

  async removeToken(platformId: string): Promise<void> {
    this.storage.delete(platformId);
  }

  async getAllTokens(): Promise<Map<string, Token>> {
    return new Map(this.storage);
  }

  async clearAll(): Promise<void> {
    this.storage.clear();
  }
}

// ============================================================================
// TOKEN REFRESH SCHEDULER
// ============================================================================

export class TokenRefreshScheduler {
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private refreshCallback?: (platformId: string) => Promise<void>;

  setRefreshCallback(callback: (platformId: string) => Promise<void>): void {
    this.refreshCallback = callback;
  }

  scheduleRefresh(platformId: string, refreshAtMs: number): void {
    // Cancel existing timer for this platform
    this.cancelRefresh(platformId);

    const delay = Math.max(0, refreshAtMs - Date.now());
    const timer = setTimeout(async () => {
      if (this.refreshCallback) {
        await this.refreshCallback(platformId);
      }
    }, delay);

    this.timers.set(platformId, timer);
  }

  cancelRefresh(platformId: string): void {
    const existing = this.timers.get(platformId);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(platformId);
    }
  }

  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

// ============================================================================
// PLATFORM AUTH HANDLER (Base + per-platform)
// ============================================================================

export abstract class PlatformAuthHandler {
  abstract platformId: string;

  abstract authenticate(credentials: Record<string, string>): Promise<Token>;
  abstract refreshToken(currentToken: Token): Promise<Token>;
  abstract revokeToken(token: Token): Promise<void>;
}

class GenericOAuth2Handler extends PlatformAuthHandler {
  platformId: string;
  private config: PlatformAuthConfig;

  constructor(config: PlatformAuthConfig) {
    super();
    this.platformId = config.platformId;
    this.config = config;
  }

  async authenticate(_credentials: Record<string, string>): Promise<Token> {
    // In production: execute OAuth 2.0 authorization code flow
    // 1. Redirect to authorization endpoint
    // 2. Exchange code for tokens at token endpoint
    // 3. Return access + refresh tokens
    const now = Date.now();
    return {
      accessToken: `demo_access_${this.platformId}_${now}`,
      refreshToken: `demo_refresh_${this.platformId}_${now}`,
      expiresAt: now + this.config.tokenLifetimeMs,
      tokenType: "bearer",
      scopes: this.config.scopes,
      platformId: this.platformId,
      issuedAt: now,
    };
  }

  async refreshToken(currentToken: Token): Promise<Token> {
    // In production: POST to token endpoint with refresh_token grant
    const now = Date.now();
    return {
      ...currentToken,
      accessToken: `demo_access_${this.platformId}_${now}`,
      expiresAt: now + this.config.tokenLifetimeMs,
      issuedAt: now,
    };
  }

  async revokeToken(_token: Token): Promise<void> {
    // In production: POST to revocation endpoint
  }
}

// ============================================================================
// AUTH TOKEN MANAGER (Main orchestrator)
// ============================================================================

export class AuthTokenManager {
  private tokenStore: SecureTokenStorage;
  private refreshScheduler: TokenRefreshScheduler;
  private platformHandlers: Map<string, PlatformAuthHandler>;
  private authEvents: AuthEvent[] = [];

  constructor() {
    this.tokenStore = new SecureTokenStorage();
    this.refreshScheduler = new TokenRefreshScheduler();
    this.platformHandlers = new Map();

    // Register platform-specific handlers
    this.registerPlatformHandlers();

    // Set up refresh callback
    this.refreshScheduler.setRefreshCallback(async (platformId) => {
      const token = await this.tokenStore.getToken(platformId);
      if (token) {
        await this.refreshTokenForPlatform(platformId, token);
      }
    });
  }

  private registerPlatformHandlers(): void {
    for (const [platformId, config] of Object.entries(PLATFORM_AUTH_CONFIGS)) {
      if (config.authType === "oauth2") {
        this.platformHandlers.set(platformId, new GenericOAuth2Handler(config));
      }
    }
  }

  /**
   * Get a valid token for a platform. Refreshes proactively if needed.
   */
  async getValidToken(platformId: string): Promise<string | null> {
    const token = await this.tokenStore.getToken(platformId);
    if (!token) return null;

    const config = PLATFORM_AUTH_CONFIGS[platformId];
    if (!config) return token.accessToken;

    // Check if token needs refresh
    if (this.isTokenExpiringSoon(token, config)) {
      try {
        const newToken = await this.refreshTokenForPlatform(platformId, token);
        return newToken.accessToken;
      } catch {
        // If refresh fails, return current token if not expired
        if (Date.now() < token.expiresAt) {
          return token.accessToken;
        }
        this.logAuthEvent("reauth_required", platformId, "Token expired and refresh failed");
        return null;
      }
    }

    return token.accessToken;
  }

  /**
   * Authenticate with a platform.
   */
  async authenticatePlatform(platformId: string, credentials: Record<string, string>): Promise<Token> {
    const handler = this.platformHandlers.get(platformId);
    if (!handler) {
      throw new Error(`No auth handler for platform: ${platformId}`);
    }

    const token = await handler.authenticate(credentials);
    await this.tokenStore.saveToken(platformId, token);

    // Schedule refresh
    const config = PLATFORM_AUTH_CONFIGS[platformId];
    if (config?.refreshSupported) {
      this.refreshScheduler.scheduleRefresh(
        platformId,
        token.expiresAt - config.proactiveRefreshMs
      );
    }

    this.logAuthEvent("token_issued", platformId);
    return token;
  }

  private async refreshTokenForPlatform(platformId: string, currentToken: Token): Promise<Token> {
    const handler = this.platformHandlers.get(platformId);
    if (!handler) {
      throw new Error(`No auth handler for platform: ${platformId}`);
    }

    const newToken = await handler.refreshToken(currentToken);
    await this.tokenStore.saveToken(platformId, newToken);

    // Schedule next refresh
    const config = PLATFORM_AUTH_CONFIGS[platformId];
    if (config?.refreshSupported) {
      this.refreshScheduler.scheduleRefresh(
        platformId,
        newToken.expiresAt - config.proactiveRefreshMs
      );
    }

    this.logAuthEvent("token_refreshed", platformId);
    return newToken;
  }

  private isTokenExpiringSoon(token: Token, config: PlatformAuthConfig): boolean {
    return Date.now() >= (token.expiresAt - config.proactiveRefreshMs);
  }

  /**
   * Revoke all tokens and clear storage.
   */
  async logout(): Promise<void> {
    const tokens = await this.tokenStore.getAllTokens();
    for (const [platformId, token] of tokens) {
      const handler = this.platformHandlers.get(platformId);
      if (handler) {
        try {
          await handler.revokeToken(token);
          this.logAuthEvent("token_revoked", platformId);
        } catch {
          // Best-effort revocation
        }
      }
    }
    await this.tokenStore.clearAll();
    this.refreshScheduler.cancelAll();
  }

  private logAuthEvent(type: AuthEvent["type"], platformId: string, details?: string): void {
    // SECURITY: Never log tokens, passwords, or PII
    this.authEvents.push({
      type,
      platformId,
      timestamp: Date.now(),
      details,
    });
    // Keep last 500 events
    if (this.authEvents.length > 500) {
      this.authEvents = this.authEvents.slice(-500);
    }
  }

  getAuthEvents(): AuthEvent[] {
    return [...this.authEvents];
  }
}
