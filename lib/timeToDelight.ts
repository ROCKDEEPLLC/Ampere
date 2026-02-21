// ============================================================================
// AMPÈRE TIME-TO-DELIGHT — Time-aware ranking + quick-pick engine
// File: lib/timeToDelight.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export type DelightBucket = 12 | 22 | 45 | 90;

export interface DelightState {
  activeBucket: DelightBucket | null;
  context: string | null; // e.g. "cooking", "commute", "winding_down"
  setAt: number;
}

export interface DelightSuggestion {
  bucket: DelightBucket;
  label: string;
  description: string;
  icon: string;
}

// ============================================================================
// STORAGE
// ============================================================================

const DELIGHT_KEY = "ampere.delight.v1";

export function getDelightState(): DelightState {
  const saved = loadJson<DelightState>(DELIGHT_KEY);
  if (saved && typeof saved.setAt === "number") return saved;
  return { activeBucket: null, context: null, setAt: 0 };
}

export function setDelightState(bucket: DelightBucket | null, context?: string): DelightState {
  const state: DelightState = { activeBucket: bucket, context: context ?? null, setAt: Date.now() };
  saveJson(DELIGHT_KEY, state);
  addLog("delight_set", { bucket, context });
  return state;
}

// ============================================================================
// DELIGHT BUCKETS
// ============================================================================

export const DELIGHT_BUCKETS: DelightSuggestion[] = [
  { bucket: 12, label: "12 min", description: "Quick break — shorts, clips, highlights", icon: "⚡" },
  { bucket: 22, label: "22 min", description: "Single episode — sitcom, anime, news", icon: "📺" },
  { bucket: 45, label: "45 min", description: "Full episode — drama, docs, sports highlights", icon: "🎬" },
  { bucket: 90, label: "90 min", description: "Movie night — films, specials, deep dives", icon: "🍿" },
];

// ============================================================================
// CONTEXT PRESETS
// ============================================================================

export interface ContextPreset {
  id: string;
  label: string;
  bucket: DelightBucket;
  description: string;
  genreBoosts: string[];
  backgroundFriendly: boolean;
}

export const CONTEXT_PRESETS: ContextPreset[] = [
  { id: "cooking", label: "I'm cooking", bucket: 22, description: "Background-friendly picks while you cook", genreBoosts: ["Documentaries", "Free", "Kids"], backgroundFriendly: true },
  { id: "commute", label: "Quick commute", bucket: 12, description: "Short content for your ride", genreBoosts: ["Free", "Gaming"], backgroundFriendly: false },
  { id: "lunch", label: "Lunch break", bucket: 22, description: "Something fun while you eat", genreBoosts: ["Basic", "Free", "Gaming"], backgroundFriendly: false },
  { id: "winding_down", label: "Winding down", bucket: 45, description: "Relaxing picks for the evening", genreBoosts: ["Basic", "Documentaries", "Arthouse"], backgroundFriendly: false },
  { id: "movie_night", label: "Movie night", bucket: 90, description: "Settle in for something great", genreBoosts: ["Movies", "Premium", "Arthouse"], backgroundFriendly: false },
  { id: "background", label: "Background noise", bucket: 45, description: "Low-attention content while you work", genreBoosts: ["Free", "LiveTV", "Documentaries"], backgroundFriendly: true },
];

// ============================================================================
// RANKING ADJUSTMENT
// ============================================================================

export function computeDelightScore(
  durationMinutes: number | undefined,
  activeBucket: DelightBucket | null,
  context?: string | null
): number {
  if (!activeBucket || !durationMinutes) return 0;

  // Score based on how close the content duration is to the bucket
  const diff = Math.abs(durationMinutes - activeBucket);
  const maxDiff = activeBucket; // normalize to bucket size

  // Perfect match = +10, far off = 0 or negative
  const matchScore = Math.max(0, 10 - (diff / maxDiff) * 10);

  // Context bonus for background-friendly content
  let contextBonus = 0;
  if (context) {
    const preset = CONTEXT_PRESETS.find((p) => p.id === context);
    if (preset?.backgroundFriendly && durationMinutes <= preset.bucket + 10) {
      contextBonus = 3;
    }
  }

  return matchScore + contextBonus;
}

export function getGenreBoostsForContext(context: string | null): string[] {
  if (!context) return [];
  const preset = CONTEXT_PRESETS.find((p) => p.id === context);
  return preset?.genreBoosts ?? [];
}
