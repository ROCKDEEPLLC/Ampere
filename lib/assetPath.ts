import type { ContentItem, GenreCollection } from "./catalog";

function stripTrailingSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function ensureLeadingSlash(s: string) {
  return s.startsWith("/") ? s : "/" + s;
}

export function assetPath(rel: string): string {
  const normalized = ensureLeadingSlash(rel);

  const basePathRaw = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim();
  const assetPrefixRaw = (process.env.NEXT_PUBLIC_ASSET_PREFIX || "").trim();

  const basePath = stripTrailingSlash(basePathRaw);
  const assetPrefix = stripTrailingSlash(assetPrefixRaw);

  // Most robust: if assetPrefix is provided, assume it may be a CDN root. Append basePath (if any) + normalized.
  if (assetPrefix) return assetPrefix + (basePath ? basePath : "") + normalized;
  if (basePath) return basePath + normalized;
  return normalized;
}

function slugLike(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function variantsForName(name: string): string[] {
  const base = slugLike(name);

  const out: string[] = [];
  const push = (s: string) => { if (s && !out.includes(s)) out.push(s); };

  push(base);
  push(base.replace(/\s/g, "-"));
  push(base.replace(/\s/g, "_"));
  push(base.replace(/\s/g, ""));
  // + variants
  push(base.replace(/\+/g, "plus"));
  push(base.replace(/\+/g, "-plus").replace(/\s+/g, "-"));
  push(base.replace(/\+/g, "_plus").replace(/\s+/g, "_"));
  push(base.replace(/\+/g, "plus").replace(/\s+/g, "-"));
  push(base.replace(/\+/g, "plus").replace(/\s+/g, "_"));
  // remove plus completely
  push(base.replace(/\+/g, "").replace(/\s+/g, "-"));
  push(base.replace(/\+/g, "").replace(/\s+/g, "_"));

  return out;
}

function candidateFilenames(name: string): string[] {
  const bases = variantsForName(name);
  const suffixes = ["", "-logo", "_logo", "-icon", "_icon", "-mark", "_mark", "-badge", "_badge"];
  const exts = ["png", "svg", "webp", "jpg", "jpeg"];

  const out: string[] = [];
  for (const b of bases) {
    for (const s of suffixes) {
      for (const e of exts) {
        const fn = (b + s + "." + e).replace(/\s+/g, "");
        if (!out.includes(fn)) out.push(fn);
      }
    }
  }
  return out;
}

function candidateRoots(): string[] {
  return [
    "/assets/icons",
    "/assets/platforms",
    "/assets/platforms/icons",
    "/assets/platforms/logos",
    "/assets/brands",
    "/assets/logos",
    "/assets/channels",
    "/assets/channels/logos",
    "/assets/header",
    "/assets",
  ];
}

export function platformIconCandidates(platformNameOrKey: string): string[] {
  const files = candidateFilenames(platformNameOrKey);
  const roots = candidateRoots();

  const out: string[] = [];
  for (const r of roots) {
    for (const f of files) out.push(assetPath(r + "/" + f));
  }

  // common fallbacks
  out.push(assetPath("/assets/icons/default-platform.png"));
  out.push(assetPath("/assets/icons/default.png"));
  return out;
}

export function genreImageCandidates(genre: GenreCollection): string[] {
  const name = genre.assetKey || genre.name;
  const files = candidateFilenames(name);
  const roots = [
    "/assets/genres",
    "/assets/genre",
    "/assets/collections",
    "/assets/images/genres",
    "/assets/images",
    "/assets",
  ];

  const out: string[] = [];
  for (const r of roots) for (const f of files) out.push(assetPath(r + "/" + f));
  out.push(assetPath("/assets/icons/default-genre.png"));
  return out;
}

export function contentPosterCandidates(item: ContentItem): string[] {
  const roots = ["/assets/content", "/assets/posters", "/assets/cards", "/assets/images/content", "/assets/images"];
  const files = candidateFilenames(item.assetKey || item.title);

  const out: string[] = [];
  for (const r of roots) for (const f of files) out.push(assetPath(r + "/" + f));
  out.push(assetPath("/assets/icons/default-poster.png"));
  return out;
}
