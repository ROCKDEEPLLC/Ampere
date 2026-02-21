// ============================================================================
// AMPÈRE LIVE PULSE — Live Events Feed + Alerts (Phase 4)
// File: lib/livePulse.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export interface LiveEvent {
  id: string;
  title: string;
  subtitle?: string;
  league?: string;
  platformId: string;
  status: "upcoming" | "live" | "halftime" | "final";
  startTime: number;
  score?: string;
  alertTypes: AlertType[];
  priority: "high" | "medium" | "low";
}

export type AlertType = "game_start" | "score_update" | "close_game" | "overtime" | "final_score" | "breaking" | "highlight";

export interface LiveAlert {
  id: string;
  eventId: string;
  type: AlertType;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}

export interface LivePulseState {
  events: LiveEvent[];
  alerts: LiveAlert[];
  subscribedLeagues: string[];
  subscribedTeams: string[];
  alertPreferences: Record<AlertType, boolean>;
}

// ============================================================================
// STORAGE
// ============================================================================

const PULSE_KEY = "ampere.livePulse.v1";

export function getLivePulseState(): LivePulseState {
  const saved = loadJson<LivePulseState>(PULSE_KEY);
  if (saved && Array.isArray(saved.events)) return saved;
  return {
    events: getDemoLiveEvents(),
    alerts: [],
    subscribedLeagues: ["NFL", "NBA", "Premier League"],
    subscribedTeams: ["Kansas City Chiefs", "Los Angeles Lakers", "Arsenal"],
    alertPreferences: {
      game_start: true,
      score_update: true,
      close_game: true,
      overtime: true,
      final_score: true,
      breaking: true,
      highlight: false,
    },
  };
}

export function saveLivePulseState(state: LivePulseState): void {
  saveJson(PULSE_KEY, state);
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

export function addAlert(alert: Omit<LiveAlert, "id" | "createdAt" | "read">): LiveAlert {
  const state = getLivePulseState();
  const newAlert: LiveAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    createdAt: Date.now(),
    read: false,
  };
  state.alerts.unshift(newAlert);
  if (state.alerts.length > 100) state.alerts = state.alerts.slice(0, 100);
  saveLivePulseState(state);
  addLog("livepulse_alert", { type: alert.type, title: alert.title });
  return newAlert;
}

export function markAlertRead(alertId: string): void {
  const state = getLivePulseState();
  const alert = state.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.read = true;
    saveLivePulseState(state);
  }
}

export function getUnreadAlertCount(): number {
  return getLivePulseState().alerts.filter((a) => !a.read).length;
}

export function toggleLeagueSubscription(league: string): void {
  const state = getLivePulseState();
  const idx = state.subscribedLeagues.indexOf(league);
  if (idx >= 0) state.subscribedLeagues.splice(idx, 1);
  else state.subscribedLeagues.push(league);
  saveLivePulseState(state);
  addLog("livepulse_league_toggle", { league, subscribed: idx < 0 });
}

export function toggleTeamSubscription(team: string): void {
  const state = getLivePulseState();
  const idx = state.subscribedTeams.indexOf(team);
  if (idx >= 0) state.subscribedTeams.splice(idx, 1);
  else state.subscribedTeams.push(team);
  saveLivePulseState(state);
  addLog("livepulse_team_toggle", { team, subscribed: idx < 0 });
}

// ============================================================================
// DEMO DATA
// ============================================================================

function getDemoLiveEvents(): LiveEvent[] {
  const now = Date.now();
  return [
    { id: "le1", title: "Chiefs vs Bills", subtitle: "AFC Championship", league: "NFL", platformId: "espnplus", status: "live", startTime: now - 3600000, score: "24 - 21", alertTypes: ["score_update", "close_game"], priority: "high" },
    { id: "le2", title: "Lakers vs Celtics", subtitle: "Regular Season", league: "NBA", platformId: "nbaleaguepass", status: "live", startTime: now - 5400000, score: "98 - 102", alertTypes: ["score_update"], priority: "high" },
    { id: "le3", title: "Arsenal vs Liverpool", subtitle: "Premier League", league: "Premier League", platformId: "peacock", status: "upcoming", startTime: now + 7200000, alertTypes: ["game_start"], priority: "medium" },
    { id: "le4", title: "Man City vs Chelsea", subtitle: "Premier League", league: "Premier League", platformId: "peacock", status: "final", startTime: now - 14400000, score: "2 - 1", alertTypes: ["final_score"], priority: "low" },
    { id: "le5", title: "Yankees vs Red Sox", subtitle: "MLB Regular Season", league: "MLB", platformId: "mlbtv", status: "upcoming", startTime: now + 18000000, alertTypes: ["game_start"], priority: "medium" },
    { id: "le6", title: "UFC 312: Main Card", subtitle: "Welterweight Title Fight", league: "UFC", platformId: "espnplus", status: "upcoming", startTime: now + 86400000, alertTypes: ["game_start"], priority: "medium" },
    { id: "le7", title: "Inter Miami vs LA Galaxy", subtitle: "MLS Regular Season", league: "MLS", platformId: "appletv", status: "live", startTime: now - 2700000, score: "1 - 1", alertTypes: ["score_update"], priority: "medium" },
    { id: "le8", title: "Real Madrid vs Barcelona", subtitle: "El Clásico — La Liga", league: "La Liga", platformId: "espnplus", status: "upcoming", startTime: now + 172800000, alertTypes: ["game_start"], priority: "high" },
  ];
}
