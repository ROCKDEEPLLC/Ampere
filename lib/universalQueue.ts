// ============================================================================
// AMPÈRE UNIVERSAL QUEUE — Queue + Availability Resolution
// File: lib/universalQueue.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export interface QueueItem {
  id: string;
  contentId: string;
  title: string;
  subtitle?: string;
  genre?: string;
  league?: string;
  preferredPlatform: string;
  alternatePlatforms: string[];
  status: "queued" | "watching" | "watched" | "unavailable";
  addedAt: number;
  watchedAt?: number;
  notifyOnAvailability: boolean;
  estimatedDurationMin?: number;
  position?: number; // playback position in seconds
  // Explainability
  reason?: string; // e.g. "Intent: 22min intense"
}

export interface AvailabilityEntry {
  platformId: string;
  available: boolean;
  type: "subscription" | "rent" | "buy" | "free" | "unavailable";
  price?: string;
  deepLinkUrl?: string;
  lastChecked: number;
}

export interface QueueState {
  items: QueueItem[];
  maxItems: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const QUEUE_KEY = "ampere.queue.v1";

export function getQueue(): QueueState {
  const saved = loadJson<QueueState>(QUEUE_KEY);
  if (saved && Array.isArray(saved.items)) return saved;
  return { items: [], maxItems: 200 };
}

export function saveQueue(state: QueueState): void {
  saveJson(QUEUE_KEY, state);
}

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

export function addToQueue(item: Omit<QueueItem, "id" | "addedAt" | "status">): QueueItem {
  const queue = getQueue();
  const newItem: QueueItem = {
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    addedAt: Date.now(),
    status: "queued",
  };

  // Avoid duplicates
  const exists = queue.items.find((i) => i.contentId === item.contentId && i.status === "queued");
  if (exists) return exists;

  queue.items.unshift(newItem);
  if (queue.items.length > queue.maxItems) queue.items = queue.items.slice(0, queue.maxItems);
  saveQueue(queue);
  addLog("queue_add", { contentId: item.contentId, title: item.title });
  return newItem;
}

export function removeFromQueue(id: string): void {
  const queue = getQueue();
  queue.items = queue.items.filter((i) => i.id !== id);
  saveQueue(queue);
  addLog("queue_remove", { id });
}

export function updateQueueItem(id: string, updates: Partial<QueueItem>): void {
  const queue = getQueue();
  const idx = queue.items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    queue.items[idx] = { ...queue.items[idx], ...updates };
    saveQueue(queue);
  }
}

export function markWatched(id: string): void {
  updateQueueItem(id, { status: "watched", watchedAt: Date.now() });
  addLog("queue_watched", { id });
}

export function reorderQueue(fromIndex: number, toIndex: number): void {
  const queue = getQueue();
  const [item] = queue.items.splice(fromIndex, 1);
  if (item) {
    queue.items.splice(toIndex, 0, item);
    saveQueue(queue);
  }
}

export function getQueuedItems(): QueueItem[] {
  return getQueue().items.filter((i) => i.status === "queued");
}

export function getWatchedItems(): QueueItem[] {
  return getQueue().items.filter((i) => i.status === "watched");
}

// ============================================================================
// AVAILABILITY RESOLUTION
// ============================================================================

// Simulated availability data for demo
const DEMO_AVAILABILITY: Record<string, AvailabilityEntry[]> = {};

export function resolveAvailability(contentId: string, subscribedPlatforms: string[]): AvailabilityEntry[] {
  // Check cached availability
  const cached = DEMO_AVAILABILITY[contentId];
  if (cached && cached.length > 0) return cached;

  // Generate simulated availability
  const entries: AvailabilityEntry[] = subscribedPlatforms.map((pid) => ({
    platformId: pid,
    available: Math.random() > 0.3, // 70% chance available
    type: "subscription" as const,
    lastChecked: Date.now(),
  }));

  // Add a free option sometimes
  if (Math.random() > 0.6) {
    entries.push({
      platformId: "tubi",
      available: true,
      type: "free",
      lastChecked: Date.now(),
    });
  }

  DEMO_AVAILABILITY[contentId] = entries;
  return entries;
}

export function getBestPlatformForContent(
  contentId: string,
  preferredPlatform: string,
  subscribedPlatforms: string[]
): { platformId: string; type: string } | null {
  const availability = resolveAvailability(contentId, subscribedPlatforms);

  // Prefer the user's chosen platform
  const preferred = availability.find((a) => a.platformId === preferredPlatform && a.available);
  if (preferred) return { platformId: preferred.platformId, type: preferred.type };

  // Fall back to subscribed platforms
  const subscribed = availability.find((a) => a.available && a.type === "subscription");
  if (subscribed) return { platformId: subscribed.platformId, type: subscribed.type };

  // Fall back to free
  const free = availability.find((a) => a.available && a.type === "free");
  if (free) return { platformId: free.platformId, type: free.type };

  return null;
}

// ============================================================================
// EXPORT VAULT (Premium perk)
// ============================================================================

export interface VaultExport {
  version: 1;
  exportedAt: number;
  tag: string;
  queue: QueueItem[];
}

export function exportVault(tag: string): string {
  const queue = getQueue();
  const data: VaultExport = {
    version: 1,
    exportedAt: Date.now(),
    tag,
    queue: queue.items,
  };
  addLog("vault_export", { tag, itemCount: queue.items.length });
  return JSON.stringify(data, null, 2);
}

export function importVault(json: string): boolean {
  try {
    const data = JSON.parse(json) as VaultExport;
    if (data.version !== 1 || !Array.isArray(data.queue)) return false;
    const queue = getQueue();
    // Merge, avoiding duplicates
    for (const item of data.queue) {
      if (!queue.items.find((i) => i.contentId === item.contentId)) {
        queue.items.push(item);
      }
    }
    saveQueue(queue);
    addLog("vault_import", { tag: data.tag, itemCount: data.queue.length });
    return true;
  } catch {
    return false;
  }
}
