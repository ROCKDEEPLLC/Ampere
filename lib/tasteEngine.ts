// ============================================================================
// AMPÈRE TASTE ENGINE — Personalization, Explainability, Discovery Contracts
// File: lib/tasteEngine.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export interface TasteProfile {
  // Preference sliders (0-100)
  comfort: number;     // comfort vs discovery
  discovery: number;   // inverse of comfort
  liveWeight: number;  // prefer live content
  shortWeight: number; // prefer shorter content
  // Muted topics
  mutedTeams: string[];
  mutedLeagues: string[];
  mutedGenres: string[];
  mutedActors: string[];
  // Feedback signals
  moreLikeThis: string[];  // content IDs
  lessLikeThis: string[];  // content IDs
  // Discovery contract
  discoveryContract: DiscoveryContract;
  // Timestamps
  updatedAt: number;
}

export type DiscoveryContract = "safe" | "one_wildcard" | "three_wildcards";

export interface FeedbackEntry {
  contentId: string;
  contentTitle: string;
  signal: "more" | "less" | "mute_topic";
  topic?: string;
  at: number;
}

export interface ExplainabilityChip {
  label: string;
  type: "genre" | "platform" | "team" | "league" | "taste" | "recency" | "live" | "delight" | "wildcard" | "social" | "trending";
  score: number; // contribution to ranking
}

export interface WhyThisPickData {
  contentId: string;
  contentTitle: string;
  totalScore: number;
  chips: ExplainabilityChip[];
  actions: Array<"more" | "less" | "mute" | "queue">;
}

// ============================================================================
// STORAGE
// ============================================================================

const TASTE_KEY = "ampere.taste.v1";
const FEEDBACK_KEY = "ampere.feedback.v1";

export function getDefaultTasteProfile(): TasteProfile {
  return {
    comfort: 60,
    discovery: 40,
    liveWeight: 50,
    shortWeight: 30,
    mutedTeams: [],
    mutedLeagues: [],
    mutedGenres: [],
    mutedActors: [],
    moreLikeThis: [],
    lessLikeThis: [],
    discoveryContract: "one_wildcard",
    updatedAt: Date.now(),
  };
}

export function getTasteProfile(): TasteProfile {
  const saved = loadJson<TasteProfile>(TASTE_KEY);
  if (saved && typeof saved.comfort === "number") return saved;
  return getDefaultTasteProfile();
}

export function saveTasteProfile(profile: TasteProfile): void {
  profile.updatedAt = Date.now();
  saveJson(TASTE_KEY, profile);
  addLog("taste_updated", { comfort: profile.comfort, discovery: profile.discovery, contract: profile.discoveryContract });
}

export function getFeedbackHistory(): FeedbackEntry[] {
  return loadJson<FeedbackEntry[]>(FEEDBACK_KEY) ?? [];
}

export function addFeedback(entry: Omit<FeedbackEntry, "at">): void {
  const history = getFeedbackHistory();
  history.unshift({ ...entry, at: Date.now() });
  saveJson(FEEDBACK_KEY, history.slice(0, 500));
  addLog("taste_feedback", { signal: entry.signal, contentId: entry.contentId });
}

// ============================================================================
// TASTE-AWARE RANKING ADJUSTMENTS
// ============================================================================

export interface TasteRankingInput {
  contentId: string;
  title: string;
  genre?: string;
  league?: string;
  platformId?: string;
  badge?: string;
  durationMinutes?: number;
  isWildcard?: boolean;
}

export function computeTasteScore(item: TasteRankingInput, taste: TasteProfile): { score: number; chips: ExplainabilityChip[] } {
  let score = 0;
  const chips: ExplainabilityChip[] = [];

  // Muted check — zero score
  if (item.genre && taste.mutedGenres.includes(item.genre)) return { score: -999, chips: [{ label: `Muted: ${item.genre}`, type: "genre", score: -999 }] };
  if (item.league && taste.mutedLeagues.includes(item.league)) return { score: -999, chips: [{ label: `Muted: ${item.league}`, type: "league", score: -999 }] };

  // More/less signals
  if (taste.moreLikeThis.includes(item.contentId)) {
    score += 15;
    chips.push({ label: "You liked this", type: "taste", score: 15 });
  }
  if (taste.lessLikeThis.includes(item.contentId)) {
    score -= 20;
    chips.push({ label: "You disliked this", type: "taste", score: -20 });
  }

  // Comfort vs discovery
  if (item.isWildcard) {
    const discoveryBonus = taste.discovery * 0.1;
    score += discoveryBonus;
    chips.push({ label: "Discovery pick", type: "wildcard", score: discoveryBonus });
  } else {
    const comfortBonus = taste.comfort * 0.05;
    score += comfortBonus;
    chips.push({ label: "Comfort pick", type: "taste", score: comfortBonus });
  }

  // Live weight
  if (item.badge === "LIVE") {
    const liveBonus = taste.liveWeight * 0.08;
    score += liveBonus;
    chips.push({ label: "Live content", type: "live", score: liveBonus });
  }

  // Short content preference
  if (item.durationMinutes && item.durationMinutes <= 30 && taste.shortWeight > 50) {
    const shortBonus = (taste.shortWeight - 50) * 0.06;
    score += shortBonus;
    chips.push({ label: "Quick watch", type: "delight", score: shortBonus });
  }

  return { score, chips };
}

// ============================================================================
// DISCOVERY CONTRACT APPLICATION
// ============================================================================

export function applyDiscoveryContract<T extends { isWildcard?: boolean }>(
  items: T[],
  contract: DiscoveryContract
): T[] {
  const wildcardCount = contract === "safe" ? 0 : contract === "one_wildcard" ? 1 : 3;
  if (wildcardCount === 0) return items.filter((i) => !i.isWildcard);

  const regular = items.filter((i) => !i.isWildcard);
  const wildcards = items.filter((i) => i.isWildcard).slice(0, wildcardCount);

  // Interleave wildcards into the list
  const result = [...regular];
  for (let i = 0; i < wildcards.length; i++) {
    const insertAt = Math.min(3 + i * 4, result.length);
    result.splice(insertAt, 0, wildcards[i]);
  }
  return result;
}

// ============================================================================
// EXPLAINABILITY — "Why This Pick?" data builder
// ============================================================================

export function buildWhyThisPick(
  contentId: string,
  contentTitle: string,
  baseScore: number,
  tasteChips: ExplainabilityChip[],
  profileChips: ExplainabilityChip[]
): WhyThisPickData {
  const allChips = [...profileChips, ...tasteChips].sort((a, b) => b.score - a.score);
  const totalScore = allChips.reduce((s, c) => s + c.score, baseScore);
  return {
    contentId,
    contentTitle,
    totalScore,
    chips: allChips.slice(0, 8), // Top 8 reasons
    actions: ["more", "less", "mute", "queue"],
  };
}

// ============================================================================
// TASTE PORTABILITY — Export/Import
// ============================================================================

export interface TasteExport {
  version: 1;
  exportedAt: number;
  taste: TasteProfile;
  feedback: FeedbackEntry[];
}

export function exportTaste(): string {
  const data: TasteExport = {
    version: 1,
    exportedAt: Date.now(),
    taste: getTasteProfile(),
    feedback: getFeedbackHistory(),
  };
  addLog("taste_exported");
  return JSON.stringify(data, null, 2);
}

export function importTaste(json: string): boolean {
  try {
    const data = JSON.parse(json) as TasteExport;
    if (data.version !== 1 || !data.taste) return false;
    saveTasteProfile(data.taste);
    if (data.feedback) saveJson(FEEDBACK_KEY, data.feedback);
    addLog("taste_imported");
    return true;
  } catch {
    return false;
  }
}
