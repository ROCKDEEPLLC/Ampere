// ============================================================================
// AMPÈRE CONTEXT MODES — Reshape rails, prioritization, and remote macros
// File: lib/modes.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export type ModeId = "default" | "game_day" | "kids" | "date_night" | "background" | "focus" | "party";

export interface ModeDefinition {
  id: ModeId;
  name: string;
  description: string;
  icon: string;
  genrePriority: string[];       // genres to boost
  genreSuppress: string[];       // genres to suppress
  liveBoost: number;             // 0-20 extra live score
  sportBoost: number;            // 0-20 extra sport score
  backgroundFriendly: boolean;
  captionsDefault: boolean;
  volumePreset?: number;         // 0-100
  dimLights?: boolean;
  sceneId?: string;              // linked remote scene
}

export interface ModeState {
  activeMode: ModeId;
  setAt: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const MODE_KEY = "ampere.mode.v1";

export function getModeState(): ModeState {
  const saved = loadJson<ModeState>(MODE_KEY);
  if (saved && saved.activeMode) return saved;
  return { activeMode: "default", setAt: 0 };
}

export function setMode(mode: ModeId): ModeState {
  const state: ModeState = { activeMode: mode, setAt: Date.now() };
  saveJson(MODE_KEY, state);
  addLog("mode_changed", { mode });
  return state;
}

// ============================================================================
// MODE DEFINITIONS
// ============================================================================

export const MODE_DEFINITIONS: ModeDefinition[] = [
  {
    id: "default",
    name: "Default",
    description: "Standard browsing experience",
    icon: "🏠",
    genrePriority: [],
    genreSuppress: [],
    liveBoost: 0,
    sportBoost: 0,
    backgroundFriendly: false,
    captionsDefault: false,
  },
  {
    id: "game_day",
    name: "Game Day",
    description: "Sports-first — live games, scores, highlights",
    icon: "🏟️",
    genrePriority: ["Sports", "LiveTV"],
    genreSuppress: ["Kids", "Arthouse", "Horror / Cult"],
    liveBoost: 15,
    sportBoost: 20,
    backgroundFriendly: false,
    captionsDefault: false,
    volumePreset: 80,
    sceneId: "scene_game_day",
  },
  {
    id: "kids",
    name: "Kids Mode",
    description: "Safe, age-appropriate content only",
    icon: "🧸",
    genrePriority: ["Kids"],
    genreSuppress: ["Horror / Cult", "LGBT", "Premium", "LiveTV"],
    liveBoost: 0,
    sportBoost: 0,
    backgroundFriendly: true,
    captionsDefault: true,
    volumePreset: 50,
    sceneId: "scene_kids",
  },
  {
    id: "date_night",
    name: "Date Night",
    description: "Curated picks for couples — drama, comedy, indie",
    icon: "🌙",
    genrePriority: ["Movies", "Basic", "Arthouse"],
    genreSuppress: ["Kids", "Gaming", "Sports"],
    liveBoost: 0,
    sportBoost: 0,
    backgroundFriendly: false,
    captionsDefault: true,
    dimLights: true,
    sceneId: "scene_date_night",
  },
  {
    id: "background",
    name: "Background",
    description: "Low-attention content while you multitask",
    icon: "🎵",
    genrePriority: ["Documentaries", "Free", "LiveTV"],
    genreSuppress: ["Horror / Cult"],
    liveBoost: 5,
    sportBoost: 0,
    backgroundFriendly: true,
    captionsDefault: true,
    volumePreset: 30,
    sceneId: "scene_background",
  },
  {
    id: "focus",
    name: "Focus",
    description: "Ambient visuals and quiet soundscapes",
    icon: "🧘",
    genrePriority: ["Documentaries"],
    genreSuppress: ["Sports", "LiveTV", "Gaming", "Horror / Cult"],
    liveBoost: 0,
    sportBoost: 0,
    backgroundFriendly: true,
    captionsDefault: false,
    volumePreset: 20,
    sceneId: "scene_focus",
  },
  {
    id: "party",
    name: "Party",
    description: "Music videos, live shows, crowd-pleasers",
    icon: "🎉",
    genrePriority: ["Free", "Gaming", "LiveTV"],
    genreSuppress: ["Arthouse", "Documentaries"],
    liveBoost: 10,
    sportBoost: 5,
    backgroundFriendly: true,
    captionsDefault: false,
    volumePreset: 90,
    sceneId: "scene_party",
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getModeDefinition(modeId: ModeId): ModeDefinition {
  return MODE_DEFINITIONS.find((m) => m.id === modeId) ?? MODE_DEFINITIONS[0];
}

export function computeModeRankingBoost(genre: string | undefined, badge: string | undefined, mode: ModeDefinition): number {
  let boost = 0;

  if (genre) {
    if (mode.genrePriority.includes(genre)) boost += 8;
    if (mode.genreSuppress.includes(genre)) boost -= 10;
  }

  if (badge === "LIVE") boost += mode.liveBoost;
  if (genre === "Sports") boost += mode.sportBoost;

  return boost;
}

export function isContentAllowedInMode(genre: string | undefined, mode: ModeDefinition): boolean {
  // In kids mode, strictly enforce genre suppression
  if (mode.id === "kids" && genre && mode.genreSuppress.includes(genre)) return false;
  return true;
}
