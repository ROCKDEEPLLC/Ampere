// ============================================================================
// AMPERE ASSET RESOLUTION SYSTEM - UPDATED VERSION
// File: lib/assetPath.ts
//
// This file provides robust asset path resolution with support for:
// - basePath / assetPrefix compatibility
// - Multiple filename variants (hyphens, underscores, plus signs)
// - Multiple directory roots
// - Logo/icon suffix variants
//
// FIXES:
// - P0: Asset path resolution (basePath / assetPrefix-safe)
// - P0: Candidate filename coverage (hyphens/underscores, + vs plus, etc.)
// ============================================================================

/**
 * Get the asset prefix from environment
 * Handles both NEXT_PUBLIC_ASSET_PREFIX and NEXT_PUBLIC_BASE_PATH
 */
function getAssetPrefix(): string {
  const prefix = 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ASSET_PREFIX) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BASE_PATH) ||
    "";
  return prefix.replace(/\/$/, ""); // Remove trailing slash
}

/**
 * Make a path basePath / assetPrefix-safe
 * 
 * @example
 * assetPath("/brand/logo.svg") // => "/base-path/brand/logo.svg" in production
 * assetPath("icons/home.png")  // => "/base-path/icons/home.png"
 */
export function assetPath(p: string): string {
  const prefix = getAssetPrefix();
  if (!prefix) return p;
  
  const cleanPath = p.startsWith("/") ? p : `/${p}`;
  return `${prefix}${cleanPath}`;
}

// ============================================================================
// FILENAME VARIANT GENERATION
// ============================================================================

/**
 * Generate filename variants for robust asset discovery
 * Handles: spaces, hyphens, underscores, plus signs, ampersands
 * 
 * @example
 * generateFilenameVariants("BET+")
 * // => ["bet+", "betplus", "bet-plus", "bet_plus"]
 */
export function generateFilenameVariants(name: string): string[] {
  const normalized = name.toLowerCase().trim();
  
  const variants = new Set<string>();
  
  // Original normalized
  variants.add(normalized);
  
  // Replace + with "plus"
  variants.add(normalized.replace(/\+/g, "plus"));
  variants.add(normalized.replace(/\+/g, "-plus"));
  variants.add(normalized.replace(/\+/g, "_plus"));
  
  // Replace spaces
  variants.add(normalized.replace(/\s+/g, "-"));
  variants.add(normalized.replace(/\s+/g, "_"));
  variants.add(normalized.replace(/\s+/g, ""));
  
  // Replace & with "and"
  variants.add(normalized.replace(/&/g, "and"));
  variants.add(normalized.replace(/&/g, "-and-"));
  
  // Remove all special characters
  variants.add(normalized.replace(/[^a-z0-9]/g, ""));
  
  return Array.from(variants).filter(Boolean);
}

// ============================================================================
// ASSET PATH CANDIDATE GENERATORS
// ============================================================================

/**
 * Generate all possible paths for a platform logo/icon
 * 
 * @example
 * platformIconCandidates("betplus")
 * // Returns array of paths to try:
 * // - /icons/platforms/betplus.svg
 * // - /icons/platforms/betplus.png
 * // - /icons/platforms/betplus-logo.svg
 * // - /platforms/betplus.svg
 * // etc.
 */
export function platformIconCandidates(platformId: string): string[] {
  const variants = generateFilenameVariants(platformId);
  const paths: string[] = [];
  
  const directories = [
  "/assets/services",      // ADD THIS - where your logos are!
  "/logos/services",       // ADD THIS - your other location
  "/icons/platforms",
  "/platforms",
  "/assets/platforms",
];
  
  const suffixes = ["", "-logo", "-icon", "_logo", "_icon"];
  const extensions = [".svg", ".png", ".webp", ".jpg"];
  
  for (const dir of directories) {
    for (const variant of variants) {
      for (const suffix of suffixes) {
        for (const ext of extensions) {
          paths.push(assetPath(`${dir}/${variant}${suffix}${ext}`));
        }
      }
    }
  }
  
  return paths;
}

/**
 * Generate candidates for genre/category images
 */
export function genreImageCandidates(genreKey: string): string[] {
  const variants = generateFilenameVariants(genreKey);
  const paths: string[] = [];
  
  const directories = [
    "/images/genres",
    "/genres",
    "/assets/genres",
    "/assets/images/genres",
  ];
  
  const extensions = [".jpg", ".png", ".webp", ".svg"];
  
  for (const dir of directories) {
    for (const variant of variants) {
      for (const ext of extensions) {
        paths.push(assetPath(`${dir}/${variant}${ext}`));
      }
    }
  }
  
  return paths;
}

/**
 * Generate candidates for header/footer icons
 */
export function uiIconCandidates(iconName: string, location: "header" | "footer"): string[] {
  const variants = generateFilenameVariants(iconName);
  const paths: string[] = [];
  
  const directories = [
    `/icons/${location}`,
    `/${location}/icons`,
    `/assets/icons/${location}`,
    `/assets/${location}`,
    `/public/icons/${location}`,
  ];
  
  const extensions = [".svg", ".png", ".webp"];
  
  for (const dir of directories) {
    for (const variant of variants) {
      for (const ext of extensions) {
        paths.push(assetPath(`${dir}/${variant}${ext}`));
      }
    }
  }
  
  return paths;
}

/**
 * Generate candidates for brand logos (wide/long format)
 */
export function brandWideCandidates(): string[] {
  return [
    assetPath("/brand/amperelong.webp"),
    assetPath("/brand/ampere-long.svg"),
    assetPath("/brand/ampere-wide.svg"),
    assetPath("/brand/ampere-wide.png"),
    assetPath("/brand/ampere-wordmark.svg"),
    assetPath("/brand/ampere-wordmark.png"),
    assetPath("/assets/brand/amperelong.webp"),
    assetPath("/assets/brand/ampere-wide.svg"),
    assetPath("/public/brand/amperelong.webp"),
  ];
}

/**
 * Generate candidates for brand logos (mark/short format)
 */
export function brandMarkCandidates(): string[] {
  return [
    assetPath("/brand/ampere_short.png"),
    assetPath("/brand/ampere-short.svg"),
    assetPath("/brand/ampere-mark.svg"),
    assetPath("/brand/ampere-mark.png"),
    assetPath("/brand/ampere-icon.svg"),
    assetPath("/brand/ampere-icon.png"),
    assetPath("/assets/brand/ampere_short.png"),
    assetPath("/assets/brand/ampere-mark.svg"),
    assetPath("/public/brand/ampere_short.png"),
  ];
}

/**
 * Generate candidates for voice icon
 */
export function voiceIconCandidates(): string[] {
  return [
    assetPath("/icons/header/voice.png"),
    assetPath("/icons/voice.svg"),
    assetPath("/icons/voice.png"),
    assetPath("/icons/microphone.svg"),
    assetPath("/icons/mic.svg"),
    assetPath("/assets/icons/voice.png"),
  ];
}

/**
 * Generate candidates for settings icon
 */
export function settingsIconCandidates(): string[] {
  return [
    assetPath("/icons/header/settings.png"),
    assetPath("/icons/settings.svg"),
    assetPath("/icons/settings.png"),
    assetPath("/icons/gear.svg"),
    assetPath("/icons/cog.svg"),
    assetPath("/assets/icons/settings.png"),
  ];
}

/**
 * Generate candidates for power icon
 */
export function powerIconCandidates(): string[] {
  return [
    assetPath("/icons/header/power.png"),
    assetPath("/icons/power.svg"),
    assetPath("/icons/power.png"),
    assetPath("/icons/power-off.svg"),
    assetPath("/assets/icons/power.png"),
  ];
}

// ============================================================================
// PRELOAD UTILITIES
// ============================================================================

/**
 * Preload an image and return a promise that resolves when loaded
 */
export function preloadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Try to preload the first available image from a list of candidates
 * Returns the first successfully loaded image path, or null if none load
 */
export async function preloadFirstAvailable(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      const loaded = await preloadImage(candidate);
      return loaded;
    } catch {
      // Continue to next candidate
      continue;
    }
  }
  return null;
}

/**
 * Preload multiple images and return those that loaded successfully
 */
export async function preloadMultiple(candidates: string[]): Promise<string[]> {
  const results = await Promise.allSettled(
    candidates.map(src => preloadImage(src))
  );
  
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map(r => r.value);
}

// ============================================================================
// CACHE MANAGEMENT (Optional - for performance)
// ============================================================================

const imageCache = new Map<string, string | null>();

/**
 * Get cached successful image path for a set of candidates
 */
export function getCachedImage(cacheKey: string): string | null | undefined {
  return imageCache.get(cacheKey);
}

/**
 * Cache a successful image path
 */
export function cacheImage(cacheKey: string, imagePath: string | null): void {
  imageCache.set(cacheKey, imagePath);
}

/**
 * Clear the image cache (useful for development)
 */
export function clearImageCache(): void {
  imageCache.clear();
}
