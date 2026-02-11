import type { AttributionEvent, ProfileState, TVConnectState, ViewingEvent, WizardDraft } from "../types";
import { safeNowISO, uniq } from "./utils";

const STORAGE_KEY = "ampere_profile_v6";
const VIEWING_KEY = "ampere_viewing_v4";
const ATTR_KEY = "ampere_attrib_v1";
const SESSION_KEY = "ampere_session_v1";
const WIZ_KEY = "ampere_setup_wiz_v1";
const TVC_KEY = "ampere_tv_connect_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function defaultProfile(): ProfileState {
  return {
    name: "Demo User",
    profilePhoto: null,
    headerPhoto: null,
    favoritePlatformIds: ["netflix", "espn", "plutotv", "foxsports1"],
    favoriteLeagues: ["NFL", "NBA", "NCAAF", "NHL"],
    favoriteTeams: ["Los Angeles Lakers", "Boston Celtics", "Kansas City Chiefs"],
    connectedPlatformIds: {},
    notificationsEnabled: true,
  };
}

export function normalizeProfile(p: Partial<ProfileState> | null): ProfileState {
  const d = defaultProfile();

  const favoritePlatformIds = Array.isArray(p?.favoritePlatformIds) ? (p!.favoritePlatformIds.filter(Boolean) as string[]) : d.favoritePlatformIds;
  const favoriteLeagues = Array.isArray(p?.favoriteLeagues) ? p!.favoriteLeagues.filter(Boolean) : d.favoriteLeagues;
  const favoriteTeams = Array.isArray(p?.favoriteTeams) ? p!.favoriteTeams.filter(Boolean) : d.favoriteTeams;

  const connectedPlatformIds =
    p?.connectedPlatformIds && typeof p.connectedPlatformIds === "object"
      ? (p.connectedPlatformIds as Partial<Record<string, boolean>>)
      : {};

  return {
    ...d,
    ...p,
    favoritePlatformIds: uniq(favoritePlatformIds),
    favoriteLeagues: uniq(favoriteLeagues),
    favoriteTeams: uniq(favoriteTeams),
    connectedPlatformIds,
    notificationsEnabled: typeof p?.notificationsEnabled === "boolean" ? p!.notificationsEnabled : d.notificationsEnabled,
  };
}

export function loadProfile(): ProfileState {
  if (typeof window === "undefined") return defaultProfile();
  const parsed = safeJsonParse<Partial<ProfileState>>(window.localStorage.getItem(STORAGE_KEY));
  return normalizeProfile(parsed);
}

export function saveProfile(p: ProfileState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function loadViewing(): ViewingEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<any>(window.localStorage.getItem(VIEWING_KEY));
  return Array.isArray(parsed) ? (parsed as ViewingEvent[]) : [];
}

export function saveViewing(events: ViewingEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEWING_KEY, JSON.stringify(events.slice(-300)));
  } catch {}
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const from = window.sessionStorage.getItem(SESSION_KEY);
    if (from) return from;
    const id = `s_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Math.random().toString(16).slice(2)}`;
  }
}

export function loadAttribution(): AttributionEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<any>(window.localStorage.getItem(ATTR_KEY));
  return Array.isArray(parsed) ? (parsed as AttributionEvent[]) : [];
}

export function saveAttribution(events: AttributionEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(events.slice(-600)));
  } catch {}
}

export function loadWizardDraft(): WizardDraft | null {
  if (typeof window === "undefined") return null;
  const parsed = safeJsonParse<WizardDraft>(window.localStorage.getItem(WIZ_KEY));
  if (!parsed) return null;
  const step = (parsed.step ?? 1) as any;
  return {
    step: ([1, 2, 3, 4, 5].includes(step) ? step : 1) as any,
    name: String(parsed.name ?? ""),
    platforms: Array.isArray(parsed.platforms) ? (parsed.platforms.filter(Boolean) as string[]) : [],
    leagues: Array.isArray(parsed.leagues) ? parsed.leagues.filter(Boolean) : [],
    teams: Array.isArray(parsed.teams) ? parsed.teams.filter(Boolean) : [],
    updatedAt: String(parsed.updatedAt ?? safeNowISO()),
  };
}

export function saveWizardDraft(d: WizardDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WIZ_KEY, JSON.stringify(d));
  } catch {}
}

export function clearWizardDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WIZ_KEY);
  } catch {}
}

/* =========================
   TV Connect persistence
   ========================= */

export function defaultTVConnect(): TVConnectState {
  return { brandId: null, planId: "starter", paired: false, updatedAt: safeNowISO() };
}

export function loadTVConnect(): TVConnectState {
  if (typeof window === "undefined") return defaultTVConnect();
  const parsed = safeJsonParse<Partial<TVConnectState>>(window.localStorage.getItem("ampere_tv_connect_v1"));
  return {
    ...defaultTVConnect(),
    ...parsed,
    updatedAt: String(parsed?.updatedAt ?? safeNowISO()),
  };
}

export function saveTVConnect(s: TVConnectState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("ampere_tv_connect_v1", JSON.stringify(s));
  } catch {}
}
