import { loadJson, saveJson } from "./storage";

export type TelemetryEvent = { ts: number; event: string; data?: Record<string, unknown> };
export type TelemetryState = { events: TelemetryEvent[] };

const KEY = "ampere.telemetry.v2";
const MAX = 500;

export function bootstrapTelemetry(forceReset?: boolean): TelemetryState {
  if (forceReset) {
    const next: TelemetryState = { events: [] };
    saveJson(KEY, next);
    return next;
  }
  return getTelemetry();
}

export function getTelemetry(): TelemetryState {
  const t = loadJson<TelemetryState>(KEY);
  if (!t || !Array.isArray(t.events)) return { events: [] };
  return { events: t.events.slice(0, MAX) };
}

export function addLog(event: string, data?: Record<string, unknown>) {
  // Private mode: skip telemetry writes (except the private_mode toggle itself)
  if (event !== "private_mode_toggle") {
    try {
      const pm = loadJson<{ enabled: boolean }>("ampere.privateMode.v1");
      if (pm?.enabled) return;
    } catch { /* proceed */ }
  }
  const t = getTelemetry();
  const next: TelemetryState = {
    events: [{ ts: Date.now(), event, data }, ...t.events].slice(0, MAX),
  };
  saveJson(KEY, next);
}

export function exportTelemetryJson(): string {
  const t = getTelemetry();
  return JSON.stringify(t, null, 2);
}
