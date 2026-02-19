// ============================================================================
// AMPERE FEDERATED SEARCH SERVICE
// File: lib/federatedSearch.ts
//
// Cross-platform content discovery system:
// - Queries multiple streaming platforms in parallel
// - Unified content database with indexed metadata
// - Result merging, deduplication, and relevance ranking
// - Search cache with TTL for faster repeated queries
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface SearchFilters {
  platforms?: string[];
  genres?: string[];
  contentType?: "movie" | "series" | "live" | "sports" | "all";
  ageRating?: string;
  year?: { min?: number; max?: number };
  language?: string;
  sortBy?: "relevance" | "popularity" | "recent" | "title";
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  platformId: string;
  platformName: string;
  contentType: "movie" | "series" | "live" | "sports";
  genre: string;
  year?: number;
  rating?: string;
  thumbnailUrl?: string;
  deepLinkUrl?: string;
  matchScore: number; // 0.0 - 1.0
  availableOn: string[]; // Platform IDs where this content is available
  metadata: Record<string, unknown>;
}

export interface SearchResults {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  totalCount: number;
  platformStatuses: PlatformSearchStatus[];
  searchTimeMs: number;
  fromCache: boolean;
}

export interface PlatformSearchStatus {
  platformId: string;
  success: boolean;
  resultCount: number;
  searchTimeMs: number;
  error?: string;
}

// ============================================================================
// SEARCH CACHE
// ============================================================================

interface CacheEntry {
  results: SearchResults;
  timestamp: number;
  ttlMs: number;
}

export class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTtlMs: number;
  private maxEntries: number;

  constructor(options?: { defaultTtlMs?: number; maxEntries?: number }) {
    this.defaultTtlMs = options?.defaultTtlMs ?? 300000; // 5 min default
    this.maxEntries = options?.maxEntries ?? 200;
  }

  private cacheKey(query: string, filters?: SearchFilters): string {
    return JSON.stringify({ q: query.toLowerCase().trim(), f: filters ?? {} });
  }

  get(query: string, filters?: SearchFilters): SearchResults | null {
    const key = this.cacheKey(query, filters);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return { ...entry.results, fromCache: true };
  }

  set(query: string, filters: SearchFilters | undefined, results: SearchResults, ttlMs?: number): void {
    const key = this.cacheKey(query, filters);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      results: { ...results },
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs,
    });
  }

  invalidate(query?: string, filters?: SearchFilters): void {
    if (query) {
      const key = this.cacheKey(query, filters);
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// ============================================================================
// CONTENT INDEXER (Local metadata index)
// ============================================================================

export class ContentIndexer {
  private index: Map<string, SearchResult> = new Map();
  private titleIndex: Map<string, string[]> = new Map(); // word -> content IDs

  addContent(content: SearchResult): void {
    this.index.set(content.id, content);

    // Build title index for fast text search
    const words = content.title.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (!this.titleIndex.has(word)) {
        this.titleIndex.set(word, []);
      }
      this.titleIndex.get(word)!.push(content.id);
    }
  }

  search(query: string, filters?: SearchFilters): SearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return [];

    // Find matching content IDs
    const matchCounts = new Map<string, number>();
    for (const word of queryWords) {
      for (const [indexWord, contentIds] of this.titleIndex) {
        if (indexWord.includes(word) || word.includes(indexWord)) {
          for (const id of contentIds) {
            matchCounts.set(id, (matchCounts.get(id) ?? 0) + 1);
          }
        }
      }
    }

    // Get results and compute scores
    const results: SearchResult[] = [];
    for (const [id, matches] of matchCounts) {
      const content = this.index.get(id);
      if (!content) continue;

      // Apply filters
      if (filters?.platforms?.length && !filters.platforms.includes(content.platformId)) continue;
      if (filters?.genres?.length && !filters.genres.includes(content.genre)) continue;
      if (filters?.contentType && filters.contentType !== "all" && content.contentType !== filters.contentType) continue;

      results.push({
        ...content,
        matchScore: matches / queryWords.length,
      });
    }

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results;
  }
}

// ============================================================================
// SEARCH PROVIDER (per-platform adapter)
// ============================================================================

export abstract class SearchProvider {
  abstract platformId: string;
  abstract search(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
}

class DemoSearchProvider extends SearchProvider {
  platformId: string;

  constructor(platformId: string) {
    super();
    this.platformId = platformId;
  }

  async search(query: string): Promise<SearchResult[]> {
    // In production: call platform's search API
    // For demo: return empty (index search handles demo content)
    void query;
    return [];
  }
}

// ============================================================================
// FEDERATED SEARCH SERVICE (Main orchestrator)
// ============================================================================

export class FederatedSearchService {
  private searchProviders: Map<string, SearchProvider> = new Map();
  private contentIndexer: ContentIndexer;
  private searchCache: SearchCache;
  private searchTimeoutMs: number;

  constructor(options?: { searchTimeoutMs?: number; cacheTtlMs?: number }) {
    this.contentIndexer = new ContentIndexer();
    this.searchCache = new SearchCache({ defaultTtlMs: options?.cacheTtlMs ?? 300000 });
    this.searchTimeoutMs = options?.searchTimeoutMs ?? 5000;

    this.registerSearchProviders();
  }

  private registerSearchProviders(): void {
    const platforms = [
      "netflix", "hulu", "disneyplus", "max", "primevideo",
      "peacock", "paramountplus", "appletv", "youtube",
      "espnplus", "tubi", "pluto", "crunchyroll",
    ];
    for (const pid of platforms) {
      this.searchProviders.set(pid, new DemoSearchProvider(pid));
    }
  }

  /**
   * Index content for local search (called during catalog loading).
   */
  indexContent(content: SearchResult): void {
    this.contentIndexer.addContent(content);
  }

  /**
   * Federated search across all platforms.
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResults> {
    const startTime = performance.now();

    // Check cache first
    const cached = this.searchCache.get(query, filters);
    if (cached) return cached;

    // Search local index first (fast results)
    const indexResults = this.contentIndexer.search(query, filters);

    // Dispatch search to all providers in parallel with timeout
    const platformStatuses: PlatformSearchStatus[] = [];
    const providerResults: SearchResult[] = [];

    const providerSearches = Array.from(this.searchProviders.entries()).map(
      async ([platformId, provider]): Promise<void> => {
        const pStart = performance.now();
        try {
          const results = await Promise.race([
            provider.search(query, filters),
            new Promise<SearchResult[]>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), this.searchTimeoutMs)
            ),
          ]);
          platformStatuses.push({
            platformId,
            success: true,
            resultCount: results.length,
            searchTimeMs: performance.now() - pStart,
          });
          providerResults.push(...results);
        } catch (error) {
          platformStatuses.push({
            platformId,
            success: false,
            resultCount: 0,
            searchTimeMs: performance.now() - pStart,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    );

    await Promise.allSettled(providerSearches);

    // Merge and deduplicate results
    const allResults = this.mergeAndRankResults(indexResults, providerResults);

    const searchResults: SearchResults = {
      query,
      filters: filters ?? {},
      results: allResults,
      totalCount: allResults.length,
      platformStatuses,
      searchTimeMs: performance.now() - startTime,
      fromCache: false,
    };

    // Cache results
    this.searchCache.set(query, filters, searchResults);

    return searchResults;
  }

  private mergeAndRankResults(indexResults: SearchResult[], providerResults: SearchResult[]): SearchResult[] {
    // Deduplicate by title + platform
    const seen = new Map<string, SearchResult>();

    for (const result of [...indexResults, ...providerResults]) {
      const key = `${result.title.toLowerCase()}__${result.platformId}`;
      const existing = seen.get(key);
      if (!existing || result.matchScore > existing.matchScore) {
        seen.set(key, result);
      }
    }

    // Sort by match score descending
    return Array.from(seen.values()).sort((a, b) => b.matchScore - a.matchScore);
  }

  getSearchCache(): SearchCache {
    return this.searchCache;
  }
}
