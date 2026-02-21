// ============================================================================
// AMPÈRE REMOTE SCENES — Macro sequences for modes + device control
// File: lib/scenes.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export interface SceneStep {
  type: "set_mode" | "set_delight" | "navigate" | "set_captions" | "set_volume" | "set_input" | "launch_app" | "delay" | "notify";
  payload: Record<string, unknown>;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: SceneStep[];
  linkedMode?: string;
  isPremiumPack?: boolean;
}

export interface SceneExecutionLog {
  sceneId: string;
  sceneName: string;
  executedAt: number;
  stepsCompleted: number;
  totalSteps: number;
  success: boolean;
}

// ============================================================================
// BUILT-IN SCENES
// ============================================================================

export const BUILT_IN_SCENES: Scene[] = [
  {
    id: "scene_game_day",
    name: "Game Day",
    description: "Set up for the big game — sports mode, volume up, live TV",
    icon: "🏟️",
    linkedMode: "game_day",
    steps: [
      { type: "set_mode", payload: { mode: "game_day" } },
      { type: "set_volume", payload: { level: 80 } },
      { type: "navigate", payload: { tab: "live" } },
      { type: "set_captions", payload: { enabled: false } },
    ],
  },
  {
    id: "scene_date_night",
    name: "Date Night",
    description: "Dim the lights, curated picks, captions on",
    icon: "🌙",
    linkedMode: "date_night",
    steps: [
      { type: "set_mode", payload: { mode: "date_night" } },
      { type: "set_volume", payload: { level: 50 } },
      { type: "set_captions", payload: { enabled: true } },
      { type: "navigate", payload: { tab: "home" } },
    ],
  },
  {
    id: "scene_kids",
    name: "Kids Time",
    description: "Safe content, moderate volume, kids mode",
    icon: "🧸",
    linkedMode: "kids",
    steps: [
      { type: "set_mode", payload: { mode: "kids" } },
      { type: "set_volume", payload: { level: 50 } },
      { type: "set_captions", payload: { enabled: true } },
      { type: "navigate", payload: { tab: "home" } },
    ],
  },
  {
    id: "scene_background",
    name: "Background Vibes",
    description: "Low-key content while you work or cook",
    icon: "🎵",
    linkedMode: "background",
    steps: [
      { type: "set_mode", payload: { mode: "background" } },
      { type: "set_volume", payload: { level: 30 } },
      { type: "set_captions", payload: { enabled: true } },
    ],
  },
  {
    id: "scene_focus",
    name: "Focus Mode",
    description: "Ambient visuals, low volume, no distractions",
    icon: "🧘",
    linkedMode: "focus",
    steps: [
      { type: "set_mode", payload: { mode: "focus" } },
      { type: "set_volume", payload: { level: 20 } },
    ],
  },
  {
    id: "scene_party",
    name: "Party Mode",
    description: "Music, crowd-pleasers, volume cranked",
    icon: "🎉",
    linkedMode: "party",
    steps: [
      { type: "set_mode", payload: { mode: "party" } },
      { type: "set_volume", payload: { level: 90 } },
      { type: "set_captions", payload: { enabled: false } },
    ],
  },
  {
    id: "scene_cozy_night",
    name: "Cozy Night",
    description: "Comfort picks, warm lighting, relaxed pace",
    icon: "🕯️",
    linkedMode: "default",
    isPremiumPack: true,
    steps: [
      { type: "set_mode", payload: { mode: "default" } },
      { type: "set_delight", payload: { bucket: 45, context: "winding_down" } },
      { type: "set_volume", payload: { level: 40 } },
      { type: "set_captions", payload: { enabled: true } },
      { type: "navigate", payload: { tab: "home" } },
    ],
  },
];

// ============================================================================
// CUSTOM SCENES STORAGE
// ============================================================================

const CUSTOM_SCENES_KEY = "ampere.scenes.v1";

export function getCustomScenes(): Scene[] {
  return loadJson<Scene[]>(CUSTOM_SCENES_KEY) ?? [];
}

export function saveCustomScene(scene: Scene): void {
  const scenes = getCustomScenes();
  const idx = scenes.findIndex((s) => s.id === scene.id);
  if (idx >= 0) scenes[idx] = scene;
  else scenes.push(scene);
  saveJson(CUSTOM_SCENES_KEY, scenes);
  addLog("scene_saved", { sceneId: scene.id, sceneName: scene.name });
}

export function deleteCustomScene(sceneId: string): void {
  const scenes = getCustomScenes().filter((s) => s.id !== sceneId);
  saveJson(CUSTOM_SCENES_KEY, scenes);
  addLog("scene_deleted", { sceneId });
}

export function getAllScenes(): Scene[] {
  return [...BUILT_IN_SCENES, ...getCustomScenes()];
}

// ============================================================================
// SCENE EXECUTION
// ============================================================================

export type SceneStepHandler = (step: SceneStep) => Promise<void>;

export async function executeScene(
  scene: Scene,
  stepHandler: SceneStepHandler
): Promise<SceneExecutionLog> {
  const log: SceneExecutionLog = {
    sceneId: scene.id,
    sceneName: scene.name,
    executedAt: Date.now(),
    stepsCompleted: 0,
    totalSteps: scene.steps.length,
    success: false,
  };

  addLog("scene_execute_start", { sceneId: scene.id, sceneName: scene.name });

  try {
    for (const step of scene.steps) {
      if (step.type === "delay") {
        await new Promise((r) => setTimeout(r, (step.payload.ms as number) ?? 500));
      } else {
        await stepHandler(step);
      }
      log.stepsCompleted++;
    }
    log.success = true;
    addLog("scene_execute_complete", { sceneId: scene.id, stepsCompleted: log.stepsCompleted });
  } catch (err) {
    addLog("scene_execute_error", { sceneId: scene.id, stepsCompleted: log.stepsCompleted, error: String(err) });
  }

  return log;
}
