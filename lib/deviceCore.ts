// ============================================================================
// AMPÈRE DEVICE CORE — Add Device + Virtual TV Emulator (Freemium)
// File: lib/deviceCore.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionMethod = "qr" | "local_hub" | "cloud";

export interface DevicePairingState {
  method: ConnectionMethod | null;
  pairingCode: string | null;
  status: "idle" | "generating" | "waiting" | "confirmed" | "connected" | "disconnected" | "error";
  deviceName: string | null;
  connectedAt: number | null;
}

export interface LocalHubState {
  hubId: string;
  hubName: string;
  hubType: "appletv" | "androidtv" | "raspberrypi";
  status: "disconnected" | "connecting" | "connected" | "error";
  ipAddress: string;
  lastCommand: string | null;
  lastCommandAt: number | null;
}

export interface CloudRelayState {
  enabled: boolean;
  mode: "cloud_relay";
  macrosAvailable: string[];
  lastMacro: string | null;
  lastMacroAt: number | null;
}

export interface EmulatorState {
  playbackState: "idle" | "playing" | "paused" | "buffering";
  currentTitle: string | null;
  currentPlatform: string | null;
  currentMode: string | null;
  volume: number;
  captionsEnabled: boolean;
  events: EmulatorEvent[];
}

export interface EmulatorEvent {
  type: string;
  detail: string;
  at: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const DEVICE_KEY = "ampere.device.v1";
const EMULATOR_KEY = "ampere.emulator.v1";

export interface DeviceState {
  pairing: DevicePairingState;
  localHub: LocalHubState | null;
  cloudRelay: CloudRelayState;
}

export function getDeviceState(): DeviceState {
  const saved = loadJson<DeviceState>(DEVICE_KEY);
  if (saved && saved.pairing) return saved;
  return {
    pairing: { method: null, pairingCode: null, status: "idle", deviceName: null, connectedAt: null },
    localHub: null,
    cloudRelay: { enabled: false, mode: "cloud_relay", macrosAvailable: ["open_queue", "mode_change", "scene_execute"], lastMacro: null, lastMacroAt: null },
  };
}

export function saveDeviceState(state: DeviceState): void {
  saveJson(DEVICE_KEY, state);
}

export function getEmulatorState(): EmulatorState {
  const saved = loadJson<EmulatorState>(EMULATOR_KEY);
  if (saved && saved.playbackState) return saved;
  return {
    playbackState: "idle",
    currentTitle: null,
    currentPlatform: null,
    currentMode: null,
    volume: 50,
    captionsEnabled: false,
    events: [],
  };
}

export function saveEmulatorState(state: EmulatorState): void {
  saveJson(EMULATOR_KEY, state);
}

// ============================================================================
// A) QR COMPANION APP PAIRING
// ============================================================================

export function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function startQRPairing(): DeviceState {
  const state = getDeviceState();
  const code = generatePairingCode();
  state.pairing = {
    method: "qr",
    pairingCode: code,
    status: "waiting",
    deviceName: null,
    connectedAt: null,
  };
  saveDeviceState(state);
  addLog("device_pair_qr_generate", { code });
  return state;
}

export function confirmQRPairing(deviceName: string): DeviceState {
  const state = getDeviceState();
  state.pairing = {
    ...state.pairing,
    status: "connected",
    deviceName,
    connectedAt: Date.now(),
  };
  saveDeviceState(state);
  addLog("device_pair_qr_confirm", { deviceName });
  return state;
}

// ============================================================================
// B) LOCAL HUB SIMULATOR
// ============================================================================

export function connectLocalHub(hubType: "appletv" | "androidtv" | "raspberrypi"): DeviceState {
  const state = getDeviceState();
  const hubNames: Record<string, string> = {
    appletv: "Apple TV (Living Room)",
    androidtv: "Android TV Hub",
    raspberrypi: "Raspberry Pi Hub",
  };
  state.localHub = {
    hubId: `hub_${Date.now()}`,
    hubName: hubNames[hubType] ?? "Local Hub",
    hubType,
    status: "connected",
    ipAddress: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
    lastCommand: null,
    lastCommandAt: null,
  };
  state.pairing.method = "local_hub";
  state.pairing.status = "connected";
  state.pairing.deviceName = state.localHub.hubName;
  state.pairing.connectedAt = Date.now();
  saveDeviceState(state);
  addLog("device_local_connect", { hubType, hubName: state.localHub.hubName });
  return state;
}

export function disconnectLocalHub(): DeviceState {
  const state = getDeviceState();
  if (state.localHub) {
    addLog("device_local_disconnect", { hubType: state.localHub.hubType });
    state.localHub.status = "disconnected";
    state.pairing.status = "disconnected";
  }
  saveDeviceState(state);
  return state;
}

export function sendLocalHubCommand(command: string): DeviceState {
  const state = getDeviceState();
  if (state.localHub && state.localHub.status === "connected") {
    state.localHub.lastCommand = command;
    state.localHub.lastCommandAt = Date.now();
    saveDeviceState(state);
    addLog("device_local_command", { command });
  }
  return state;
}

// ============================================================================
// C) CLOUD FALLBACK
// ============================================================================

export function enableCloudRelay(): DeviceState {
  const state = getDeviceState();
  state.cloudRelay.enabled = true;
  state.pairing.method = "cloud";
  state.pairing.status = "connected";
  state.pairing.deviceName = "Cloud Relay";
  state.pairing.connectedAt = Date.now();
  saveDeviceState(state);
  addLog("device_cloud_enable");
  return state;
}

export function executeCloudMacro(macro: string): DeviceState {
  const state = getDeviceState();
  if (state.cloudRelay.enabled) {
    state.cloudRelay.lastMacro = macro;
    state.cloudRelay.lastMacroAt = Date.now();
    saveDeviceState(state);
    addLog("device_cloud_command", { macro });
  }
  return state;
}

// ============================================================================
// VIRTUAL TV EMULATOR
// ============================================================================

function addEmulatorEvent(state: EmulatorState, type: string, detail: string): void {
  state.events.unshift({ type, detail, at: Date.now() });
  if (state.events.length > 50) state.events = state.events.slice(0, 50);
}

export function emulatorPlay(title: string, platform: string): EmulatorState {
  const state = getEmulatorState();
  state.playbackState = "playing";
  state.currentTitle = title;
  state.currentPlatform = platform;
  addEmulatorEvent(state, "play", `Playing: ${title} on ${platform}`);
  saveEmulatorState(state);
  addLog("emulator_play", { title, platform });
  return state;
}

export function emulatorPause(): EmulatorState {
  const state = getEmulatorState();
  if (state.playbackState === "playing") {
    state.playbackState = "paused";
    addEmulatorEvent(state, "pause", `Paused: ${state.currentTitle}`);
    saveEmulatorState(state);
    addLog("emulator_pause");
  }
  return state;
}

export function emulatorResume(): EmulatorState {
  const state = getEmulatorState();
  if (state.playbackState === "paused") {
    state.playbackState = "playing";
    addEmulatorEvent(state, "resume", `Resumed: ${state.currentTitle}`);
    saveEmulatorState(state);
    addLog("emulator_resume");
  }
  return state;
}

export function emulatorStop(): EmulatorState {
  const state = getEmulatorState();
  addEmulatorEvent(state, "stop", `Stopped: ${state.currentTitle}`);
  state.playbackState = "idle";
  state.currentTitle = null;
  state.currentPlatform = null;
  saveEmulatorState(state);
  addLog("emulator_stop");
  return state;
}

export function emulatorSetMode(mode: string): EmulatorState {
  const state = getEmulatorState();
  state.currentMode = mode;
  addEmulatorEvent(state, "mode", `Mode changed: ${mode}`);
  saveEmulatorState(state);
  addLog("emulator_mode", { mode });
  return state;
}

export function emulatorSetVolume(volume: number): EmulatorState {
  const state = getEmulatorState();
  state.volume = Math.max(0, Math.min(100, volume));
  addEmulatorEvent(state, "volume", `Volume: ${state.volume}`);
  saveEmulatorState(state);
  return state;
}

export function emulatorToggleCaptions(): EmulatorState {
  const state = getEmulatorState();
  state.captionsEnabled = !state.captionsEnabled;
  addEmulatorEvent(state, "captions", `Captions: ${state.captionsEnabled ? "ON" : "OFF"}`);
  saveEmulatorState(state);
  return state;
}

export function emulatorExecuteScene(sceneName: string): EmulatorState {
  const state = getEmulatorState();
  addEmulatorEvent(state, "scene", `Scene triggered: ${sceneName}`);
  saveEmulatorState(state);
  addLog("emulator_scene", { sceneName });
  return state;
}

export function emulatorHandleDeviceConnection(connected: boolean, deviceName: string): EmulatorState {
  const state = getEmulatorState();
  addEmulatorEvent(state, "device", `Device ${connected ? "connected" : "disconnected"}: ${deviceName}`);
  saveEmulatorState(state);
  return state;
}
