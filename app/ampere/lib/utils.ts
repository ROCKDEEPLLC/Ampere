export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export function safeNowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
}

export function normalizeKey(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function toggleInArray<T>(arr: T[], item: T) {
  const has = arr.includes(item);
  return has ? arr.filter((x) => x !== item) : [...arr, item];
}

/** basePath / assetPrefix-safe paths */
export function assetPath(p: string) {
  const prefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "").replace(/\/$/, "");
  if (!prefix) return p;
  return `${prefix}${p.startsWith("/") ? p : `/${p}`}`;
}
