"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { AboutSection } from "../../components/AboutSection";
import {
  brandWideCandidates as _brandWide,
  brandMarkCandidates as _brandMark,
  platformIconCandidates as _platIcon,
  genreImageCandidates,
  leagueLogoCandidates as _leagueIcon,
  conferenceLogoCandidates as _confIcon,
  teamLogoCandidates as _teamIcon,
  headerIconCandidates as _headerIcon,
  footerIconCandidates as _footerIcon,
  voiceIconCandidates,
  settingsIconCandidates,
  assetPath,
} from "../../lib/assetPath";
import {
  GENRES as CATALOG_GENRES,
  PLATFORMS as CATALOG_PLATFORMS,
  ALL_PLATFORM_IDS as CATALOG_ALL_IDS,
  LEAGUES as CATALOG_LEAGUES,
  TEAMS_BY_LEAGUE as CATALOG_TEAMS,
  platformById as catalogPlatformById,
  platformIdFromLabel as catalogPlatformIdFromLabel,
  platformsForGenre as catalogPlatformsForGenre,
  providerUrlOpen,
  providerUrlSubscribe,
  redactUrl,
  normalizeKey as catalogNormalizeKey,
  canonicalLeagueForTeams,
  conferencesForLeague,
  teamsForConference,
  leagueHasConferences,
} from "../../lib/catalog";
import type { PlatformId, GenreKey, Platform, NCAAConference } from "../../lib/catalog";
import { GLOBAL_REGIONS, LANGUAGES } from "../../lib/globalRegions";
import { parseCommand } from "../../lib/intent";
import {
  PremiumHubContent, PricingContent, TasteEngineContent, TasteEngineHub, WhyThisPickContent,
  UniversalQueueContent, TimeToDelightContent, ModesContent, RemoteScenesContent,
  ConnectLadderContent, TrustPortabilityContent, FamilyProfilesContent,
  SocialContent, LivePulseContent, SemanticSearchContent,
  AddDeviceContent, VirtualEmulatorContent, BettingCompanionContent,
} from "../../components/InnovationSuite";
import { type PlanTier, getPlanState, setPlanState, canAccessFeature } from "../../lib/premiumPlan";
import { type ModeId } from "../../lib/modes";
import { type Scene, executeScene } from "../../lib/scenes";
import { type DelightBucket } from "../../lib/timeToDelight";
/* =========================
   Types
   ========================= */

type TabKey = "home" | "live" | "favs" | "search";

type Card = {
  id: string;
  title: string;
  subtitle?: string;
  platformId?: PlatformId;
  platformLabel?: string;
  badge?: "LIVE" | "UPCOMING" | "NEW" | string;
  badgeRight?: string;
  metaLeft?: string;
  metaRight?: string;
  league?: string;
  genre?: GenreKey;
  startTime?: string;
  timeRemaining?: string;
};

type ProfileState = {
  name: string;
  profilePhoto: string | null;
  headerPhoto: string | null;
  favoritePlatformIds: PlatformId[];
  favoriteLeagues: string[];
  favoriteTeams: string[];
  connectedPlatformIds: Partial<Record<PlatformId, boolean>>;
  notificationsEnabled: boolean;
};

type ViewingEvent = {
  id: string;
  title: string;
  platformId?: PlatformId;
  league?: string;
  at: string;
};

type AttributionEvent = {
  at: string;
  sessionId: string;
  event: string;
  props: Record<string, any>;
};

type WizardDraft = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  region?: string;
  language?: string;
  platforms: PlatformId[];
  leagues: string[];
  teams: string[];
  updatedAt: string;
};

/* =========================
   Small utilities
   ========================= */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function safeNowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
}

function normalizeKey(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function toggleInArray<T>(arr: T[], item: T) {
  const has = arr.includes(item);
  return has ? arr.filter((x) => x !== item) : [...arr, item];
}

/* =========================
   Use catalog imports
   ========================= */

const GENRES = CATALOG_GENRES;
const PLATFORMS = CATALOG_PLATFORMS;
const ALL_PLATFORM_IDS = CATALOG_ALL_IDS;
const LEAGUES = CATALOG_LEAGUES;
const TEAMS_BY_LEAGUE = CATALOG_TEAMS;

function platformById(id: PlatformId) {
  return catalogPlatformById(id) ?? null;
}

function platformIdFromLabel(label: string): PlatformId | null {
  return catalogPlatformIdFromLabel(label);
}

function platformsForGenre(genre: GenreKey | "All"): PlatformId[] {
  if (genre === "All") return ["all", ...ALL_PLATFORM_IDS, "livetv"];
  const ids = catalogPlatformsForGenre(genre as GenreKey);
  return ["all", ...uniq(ids), "livetv"];
}

/* =========================
   Asset candidate helpers (use lib/assetPath)
   ========================= */

function brandWideCandidates() {
  return _brandWide();
}

function brandMarkCandidates() {
  return _brandMark();
}

function platformIconCandidates(pid: PlatformId) {
  return _platIcon(pid);
}

function leagueLogoCandidates(league?: string) {
  return _leagueIcon(league);
}

const Genre_ICON_CANDIDATES: Partial<Record<string, string[]>> = Object.fromEntries(
  GENRES.map((g) => [g.key, genreImageCandidates(g.key)])
);

/* =========================
   SmartImg (never shows broken-image)
   ========================= */

const FAILED_SRC = new Set<string>();
function rememberFailed(src: string) {
  try {
    FAILED_SRC.add(src);
  } catch {}
}

function SmartImg({
  sources,
  alt = "",
  size = 32,
  rounded = 12,
  fit = "cover",
  fill,
  border = true,
  style,
  fallbackText,
}: {
  sources: string[];
  alt?: string;
  size?: number;
  rounded?: number;
  fit?: React.CSSProperties["objectFit"];
  fill?: boolean;
  border?: boolean;
  style?: React.CSSProperties;
  fallbackText?: string;
}) {
  const key = (sources ?? []).filter(Boolean).join("|");
  const [resolved, setResolved] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setResolved(null);

    const candidates = (sources ?? []).filter(Boolean).filter((s) => !FAILED_SRC.has(s));
    if (!candidates.length) return;

    let i = 0;
    const tryNext = () => {
      if (!alive) return;
      if (i >= candidates.length) return;

      const src = candidates[i++];
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        setResolved(src);
      };
      img.onerror = () => {
        rememberFailed(src);
        tryNext();
      };
      img.src = src;
    };

    tryNext();
    return () => {
      alive = false;
    };
  }, [key]);

  if (!resolved) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: fill ? "100%" : size,
          height: fill ? "100%" : size,
          borderRadius: rounded,
          background: "rgba(255,255,255,0.10)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 950,
          color: "rgba(255,255,255,0.75)",
          border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
          ...style,
        }}
      >
        {fallbackText ?? "•"}
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={resolved}
      alt={alt}
      width={fill ? undefined : size}
      height={fill ? undefined : size}
      style={{
        width: fill ? "100%" : size,
        height: fill ? "100%" : size,
        borderRadius: rounded,
        objectFit: fit,
        display: "block",
        border: border ? "1px solid rgba(255,255,255,0.10)" : "none",
        background: "rgba(255,255,255,0.06)",
        ...style,
      }}
    />
  );
}

/* =========================
   Local storage
   ========================= */

const STORAGE_KEY = "ampere_profile_v5";
const VIEWING_KEY = "ampere_viewing_v4";
const ATTR_KEY = "ampere_attrib_v1";
const SESSION_KEY = "ampere_session_v1";
const WIZ_KEY = "ampere_setup_wiz_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultProfile(): ProfileState {
  return {
    name: "Demo User",
    profilePhoto: null,
    headerPhoto: null,
    favoritePlatformIds: ["netflix", "espn", "blackmedia", "foxsports1"],
    favoriteLeagues: ["NFL", "NBA", "NCAAF", "NHL"],
    favoriteTeams: ["Los Angeles Lakers", "Boston Celtics", "Kansas City Chiefs"],
    connectedPlatformIds: {},
    notificationsEnabled: true,
  };
}

function normalizeProfile(p: Partial<ProfileState> | null): ProfileState {
  const d = defaultProfile();

  const favoritePlatformIds = Array.isArray(p?.favoritePlatformIds)
    ? (p!.favoritePlatformIds.filter(Boolean) as PlatformId[])
    : d.favoritePlatformIds;

  const favoriteLeagues = Array.isArray(p?.favoriteLeagues) ? p!.favoriteLeagues.filter(Boolean) : d.favoriteLeagues;
  const favoriteTeams = Array.isArray(p?.favoriteTeams) ? p!.favoriteTeams.filter(Boolean) : d.favoriteTeams;

  const connectedPlatformIds =
    p?.connectedPlatformIds && typeof p.connectedPlatformIds === "object"
      ? (p.connectedPlatformIds as Partial<Record<PlatformId, boolean>>)
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

function loadProfile(): ProfileState {
  if (typeof window === "undefined") return defaultProfile();
  const parsed = safeJsonParse<Partial<ProfileState>>(window.localStorage.getItem(STORAGE_KEY));
  return normalizeProfile(parsed);
}

function saveProfile(p: ProfileState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

function loadViewing(): ViewingEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<any>(window.localStorage.getItem(VIEWING_KEY));
  return Array.isArray(parsed) ? (parsed as ViewingEvent[]) : [];
}

function saveViewing(events: ViewingEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEWING_KEY, JSON.stringify(events.slice(-300)));
  } catch {}
}

function getSessionId(): string {
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

function loadAttribution(): AttributionEvent[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<any>(window.localStorage.getItem(ATTR_KEY));
  return Array.isArray(parsed) ? (parsed as AttributionEvent[]) : [];
}

function saveAttribution(events: AttributionEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(events.slice(-600)));
  } catch {}
}

function loadWizardDraft(): WizardDraft | null {
  if (typeof window === "undefined") return null;
  const parsed = safeJsonParse<WizardDraft>(window.localStorage.getItem(WIZ_KEY));
  if (!parsed) return null;
  const step = (parsed.step ?? 1) as any;
  return {
    step: ([1, 2, 3, 4, 5, 6].includes(step) ? step : 1) as any,
    name: String(parsed.name ?? ""),
    platforms: Array.isArray(parsed.platforms) ? (parsed.platforms.filter(Boolean) as PlatformId[]) : [],
    leagues: Array.isArray(parsed.leagues) ? parsed.leagues.filter(Boolean) : [],
    teams: Array.isArray(parsed.teams) ? parsed.teams.filter(Boolean) : [],
    updatedAt: String(parsed.updatedAt ?? safeNowISO()),
  };
}

function saveWizardDraft(d: WizardDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WIZ_KEY, JSON.stringify(d));
  } catch {}
}

function clearWizardDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WIZ_KEY);
  } catch {}
}

/* Provider URLs + teams now imported from catalog.ts */

function teamLogoCandidates(league: string, team: string): string[] {
  const l = normalizeKey(league);
  // kebab-case for file matching: "Buffalo Bills" → "buffalo-bills"
  const kebab = String(team ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const t = normalizeKey(team);
  const lk = String(league ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return [
    // Exact kebab patterns matching actual files: "kansas-city-chiefs-logo.png"
    assetPath(`/assets/teams/${l}/${kebab}-logo.png`),
    assetPath(`/assets/teams/${lk}/${kebab}-logo.png`),
    // NBA pattern: "nba-boston-celtics-logo-480x480.png"
    assetPath(`/assets/teams/${l}/${l}-${kebab}-logo-480x480.png`),
    assetPath(`/assets/teams/${l}/${l}-${kebab}-logo-300x300.png`),
    // Plain kebab
    assetPath(`/assets/teams/${l}/${kebab}.png`),
    assetPath(`/assets/teams/${lk}/${kebab}.png`),
    // Fallback: normalized key (no hyphens)
    assetPath(`/assets/teams/${l}/${t}.png`),
    assetPath(`/assets/teams/${l}/${t}.svg`),
    assetPath(`/assets/leagues/teams/${league}/${team}.png`),
    assetPath(`/logos/teams/${l}/${t}.png`),
  ];
}

function findTeamByFragment(leagueCanon: string, frag: string): string | null {
  const teams = TEAMS_BY_LEAGUE[leagueCanon] ?? [];
  const fk = normalizeKey(frag);
  if (!fk) return null;

  let hit = teams.find((t) => normalizeKey(t).includes(fk));
  if (hit) return hit;

  hit = teams.find((t) => normalizeKey(t).endsWith(fk));
  if (hit) return hit;

  const last = frag.trim().split(/\s+/).slice(-1)[0] ?? "";
  const lk = normalizeKey(last);
  if (lk) {
    hit = teams.find((t) => normalizeKey(t).endsWith(lk));
    if (hit) return hit;
  }

  return null;
}

function parseMatchupFromTitle(title: string): { a?: string; b?: string } {
  const raw = title.includes(":") ? title.split(":").slice(1).join(":").trim() : title.trim();
  const m = raw.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (!m) return {};
  return { a: m[1]?.trim(), b: m[2]?.trim() };
}

/* =========================
   Design tokens + global CSS
   ========================= */

const AMPERE_GLOBAL_CSS = `
:root{
  --bg0:#050505;
  --bg1:#0b0b0b;
  --surface: rgba(255,255,255,0.05);
  --surface2: rgba(255,255,255,0.08);
  --stroke: rgba(255,255,255,0.10);
  --stroke2: rgba(255,255,255,0.14);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.70);
  --muted2: rgba(255,255,255,0.55);

  --accent: rgba(58,167,255,1);
  --accentA: rgba(58,167,255,0.22);
  --accentB: rgba(58,167,255,0.12);

  --r-xl: 22px;
  --r-lg: 18px;
  --r-md: 14px;

  --shadow-lg: 0 20px 90px rgba(0,0,0,0.65);
  --shadow-md: 0 18px 60px rgba(0,0,0,0.55);

  --focus: rgba(58,167,255,0.90);
}
*{ box-sizing:border-box; }
html, body { overflow-x: hidden; max-width: 100vw; }
button, a, input { -webkit-tap-highlight-color: transparent; }
.ampere-focus:focus-visible{
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0,0,0,0.55);
}
@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.85; }
}
.menu-item-glow:hover {
  background: rgba(58,167,255,0.22) !important;
  border-color: rgba(58,167,255,0.40) !important;
  box-shadow: 0 0 10px rgba(58,167,255,0.25), 0 0 0 1px rgba(58,167,255,0.15) inset;
}
.menu-item-glow:active {
  background: rgba(58,167,255,0.32) !important;
  border-color: rgba(58,167,255,0.55) !important;
}
@keyframes bootProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}
@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}
/* ── Mobile-specific fixes ── */
@media (max-width: 860px) {
  .ampere-dropdown-panel {
    position: fixed !important;
    left: 8px !important;
    right: 8px !important;
    top: auto !important;
    bottom: 60px !important;
    min-width: 0 !important;
    max-width: none !important;
    max-height: 70vh !important;
  }
  .ampere-modal-body { padding: 10px !important; max-height: 82vh !important; }
  .ampere-modal-outer { padding: 6px !important; }
  .ampere-header-actions .pill-label-text { display: none; }
  .ampere-header-actions button { padding: 6px 8px !important; gap: 4px !important; font-size: 12px !important; }
  .ampere-footer-bar .pill-label-text { font-size: 10px !important; }
  .ampere-footer-bar button { gap: 4px !important; padding: 6px 4px !important; }
}
`;

/* =========================
   Icons
   ========================= */

function IconChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.7-1l-.3-2.5H9l-.3 2.5a8 8 0 0 0-1.7 1L4.6 9l-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 1L2.6 16.5l2 3.5 2.4-.7a8 8 0 0 0 1.7 1l.3 2.5h6l.3-2.5a8 8 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconLive() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 12a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.2-9.2C1 7.8 3.5 5 6.6 5c1.8 0 3.3.9 4.2 2.1C11.7 5.9 13.2 5 15 5c3.1 0 5.6 2.8 3.8 6.8C19 16.4 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.4-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconRemote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="10" cy="16" r="1" fill="currentColor" />
      <circle cx="14" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

/* =========================
   Responsive density
   ========================= */

function useViewport() {
  // Always start with desktop value to prevent SSR/client hydration mismatch.
  // The useEffect below immediately corrects to the real viewport width on mount.
  const [w, setW] = useState<number>(1200);

  useEffect(() => {
    setW(window.innerWidth);
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const isMobile = w < 860;
  const isSmallMobile = w < 480;

  const density = useMemo(() => {
    if (isSmallMobile) {
      return { pad: 8, gap: 10, h1: 20, h2: 16, small: 11, cardMinW: 160, heroH: 100 };
    }
    if (isMobile) {
      return { pad: 12, gap: 14, h1: 24, h2: 18, small: 12, cardMinW: 200, heroH: 120 };
    }
    return { pad: 16, gap: 18, h1: 30, h2: 20, small: 13, cardMinW: 260, heroH: 140 };
  }, [isMobile, isSmallMobile]);

  return { isMobile, density };
}

/* =========================
   Modal
   ========================= */

function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = 980,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const prevBodyOverflowRef = useRef<string>("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const titleId = useMemo(() => `modal_${normalizeKey(title)}_${Math.random().toString(16).slice(2)}`, [title]);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = (document.activeElement as HTMLElement) ?? null;
    prevBodyOverflowRef.current = document.body.style.overflow ?? "";
    document.body.style.overflow = "hidden";

    const getFocusable = (root: HTMLElement) => {
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
      return nodes.filter((el) => {
        const disabled = (el as HTMLButtonElement).disabled;
        const ariaDisabled = el.getAttribute("aria-disabled") === "true";
        const hidden = el.getAttribute("aria-hidden") === "true";
        return !disabled && !ariaDisabled && !hidden && el.offsetParent !== null;
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root) return;

        const focusables = getFocusable(root);
        if (!focusables.length) {
          e.preventDefault();
          root.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || !root.contains(active) || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || !root.contains(active) || active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);

    requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusables = getFocusable(root);
      const active = document.activeElement as HTMLElement | null;
      if (active && root.contains(active)) return;
      if (focusables.length) focusables[0].focus();
      else root.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBodyOverflowRef.current ?? "";
      requestAnimationFrame(() => lastActiveRef.current?.focus?.());
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="ampere-modal-outer"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(10px)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: `min(${maxWidth}px, 100%)`,
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--stroke)",
          background: "rgba(12,12,12,0.98)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          outline: "none",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 60%), rgba(0,0,0,0.35)",
          }}
        >
          <div id={titleId} style={{ fontSize: 18, fontWeight: 950, color: "white" }}>
            {title}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            className="ampere-focus"
            aria-label="Close modal"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>
        <div className="ampere-modal-body" style={{ padding: 14, maxHeight: "72vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Pills / chips / dropdown
   ========================= */

function PillButton({
  label,
  iconSources,
  iconNode,
  active,
  onClick,
  fullWidth,
  multiline,
  ariaLabel,
  subtle,
}: {
  label: string;
  iconSources?: string[];
  iconNode?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  multiline?: boolean;
  ariaLabel?: string;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ampere-focus"
      aria-label={ariaLabel ?? label}
      aria-pressed={!!active}
      style={{
        width: fullWidth ? "100%" : undefined,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: active ? "1px solid rgba(58,167,255,0.6)" : "1px solid rgba(255,255,255,0.10)",
        background: active
          ? "rgba(58,167,255,0.30)"
          : subtle
          ? "rgba(5,5,5,0.70)"
          : "linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(10,10,10,0.90) 100%)",
        color: "white",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 950,
        userSelect: "none",
        minWidth: 0,
        position: "relative",
        boxShadow: active
          ? "0 0 12px rgba(58,167,255,0.35), 0 0 0 1px rgba(58,167,255,0.25) inset"
          : "0 1px 3px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset",
        backdropFilter: "blur(8px)",
      }}
    >
      {iconNode ? (
        <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", borderRadius: 6, boxShadow: "0 0 6px rgba(58,167,255,0.20)", border: "1px solid rgba(58,167,255,0.15)" }}>
          {iconNode}
        </span>
      ) : iconSources && iconSources.length ? (
        <span style={{ flex: "0 0 auto", borderRadius: 6, boxShadow: "0 0 6px rgba(58,167,255,0.20)", border: "1px solid rgba(58,167,255,0.15)", overflow: "hidden", display: "inline-flex" }}>
          <SmartImg sources={iconSources} size={20} rounded={6} fit="contain" fallbackText={label.slice(0, 1).toUpperCase()} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: "rgba(255,255,255,0.08)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            flex: "0 0 auto",
            boxShadow: "0 0 6px rgba(58,167,255,0.15)",
            border: "1px solid rgba(58,167,255,0.10)",
          }}
        >
          •
        </span>
      )}

      <span
        className="pill-label-text"
        style={{
          flex: "1 1 auto",
          opacity: 0.95,
          whiteSpace: multiline ? "normal" : "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: multiline ? 1.15 : 1,
          textAlign: "center",
          paddingRight: active ? 12 : 0,
        }}
      >
        {label}
      </span>

      {active ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "rgba(58,167,255,0.95)",
            boxShadow: "0 0 0 3px rgba(58,167,255,0.14)",
          }}
        />
      ) : null}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <button
      type="button"
      className="ampere-focus"
      onClick={onRemove}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(58,167,255,0.22)",
        background: "rgba(58,167,255,0.10)",
        color: "white",
        fontWeight: 950,
        cursor: onRemove ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
      aria-label={onRemove ? `Remove ${label}` : label}
    >
      <span style={{ opacity: 0.95 }}>{label}</span>
      {onRemove ? <span style={{ opacity: 0.85, fontWeight: 950 }}>✕</span> : null}
    </button>
  );
}

/* =========================
   Reusable QWERTY On-Screen Keyboard
   ========================= */

function QwertyKeyboard({
  value,
  onChange,
  onSubmit,
  isMobile,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  isMobile: boolean;
  placeholder?: string;
}) {
  const [pressedK, setPressedK] = useState<string | null>(null);
  const [kbVisible, setKbVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const rows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["Z","X","C","V","B","N","M","⌫"],
    ["SPACE","CLEAR", ...(onSubmit ? ["GO"] : [])],
  ];

  // Dismiss keyboard when focus leaves the entire keyboard wrapper
  const handleBlur = (e: React.FocusEvent) => {
    const related = e.relatedTarget as Node | null;
    if (wrapperRef.current && related && wrapperRef.current.contains(related)) return;
    setKbVisible(false);
  };

  return (
    <div ref={wrapperRef} onBlur={handleBlur} style={{ display: "grid", gap: 6 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setKbVisible(true)}
        onKeyDown={(e) => { if (e.key === "Enter" && onSubmit) onSubmit(); }}
        placeholder={placeholder ?? "Tap to search…"}
        className="ampere-focus"
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: kbVisible ? "1px solid rgba(58,167,255,0.5)" : "1px solid var(--stroke2)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          outline: "none",
          fontWeight: 850,
          width: "100%",
          transition: "border-color 0.2s ease",
        }}
      />
      <div
        style={{
          width: "100%",
          display: "grid",
          gap: 4,
          overflow: "hidden",
          maxHeight: kbVisible ? 300 : 0,
          opacity: kbVisible ? 1 : 0,
          transform: kbVisible ? "translateY(0)" : "translateY(-8px)",
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: kbVisible ? "auto" : "none",
        }}
      >
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {row.map((k) => (
              <button
                key={k}
                type="button"
                className="ampere-focus"
                onClick={() => {
                  setPressedK(k);
                  setTimeout(() => setPressedK(null), 200);
                  if (k === "⌫") onChange(value.slice(0, -1));
                  else if (k === "SPACE") onChange(value + " ");
                  else if (k === "CLEAR") { onChange(""); setKbVisible(false); }
                  else if (k === "GO" && onSubmit) { onSubmit(); setKbVisible(false); }
                  else onChange(value + k.toLowerCase());
                }}
                style={{
                  padding: k.length > 1 ? "8px 14px" : "8px 0",
                  width: k.length > 1 ? undefined : isMobile ? 28 : 36,
                  minWidth: k.length > 1 ? 56 : undefined,
                  flex: k === "SPACE" ? "1 1 120px" : undefined,
                  borderRadius: 10,
                  border: pressedK === k
                    ? "1px solid rgba(58,167,255,0.7)"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: pressedK === k
                    ? "rgba(58,167,255,0.35)"
                    : k === "GO" ? "rgba(58,167,255,0.18)" : "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: isMobile ? 12 : 14,
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: pressedK === k
                    ? "0 0 12px rgba(58,167,255,0.5), 0 0 24px rgba(58,167,255,0.2)"
                    : "none",
                  transition: "all 0.15s ease",
                  transform: pressedK === k ? "scale(1.08)" : "scale(1)",
                }}
              >
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const DropdownCtx = React.createContext<{ close: () => void } | null>(null);

function Dropdown({
  label,
  iconLeft,
  children,
  minWidth = 280,
}: {
  label: string;
  iconLeft?: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number; safeMinW: number }>({ top: 60, right: 8, safeMinW: 280 });

  // Recalculate position when panel opens
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    setPos({
      top: rect.bottom + 10,
      right: Math.max(8, vw - rect.right),
      safeMinW: Math.min(minWidth, vw - 16),
    });
  }, [open, minWidth]);

  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as any)) return;
      if (panelRef.current?.contains(e.target as any)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", on);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="ampere-focus"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 999,
          border: open ? "1px solid rgba(58,167,255,0.6)" : "1px solid var(--stroke)",
          background: open ? "rgba(58,167,255,0.28)" : "rgba(255,255,255,0.04)",
          color: "white",
          cursor: "pointer",
          fontWeight: 950,
          whiteSpace: "nowrap",
          boxShadow: open ? "0 0 12px rgba(58,167,255,0.30), 0 0 0 1px rgba(58,167,255,0.20) inset" : undefined,
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {iconLeft ? <span style={{ display: "inline-flex" }}>{iconLeft}</span> : null}
        <span className="pill-label-text" style={{ opacity: 0.95 }}>{label}</span>
        <IconChevronDown />
      </button>

      {open ? createPortal(
        <>
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
            onMouseDown={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="menu"
            className="ampere-dropdown-panel"
            style={{
              position: "fixed",
              top: pos.top,
              right: pos.right,
              minWidth: pos.safeMinW,
              maxWidth: "calc(100vw - 16px)",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(10,10,10,0.995)",
              backdropFilter: "blur(16px)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              zIndex: 9999,
              maxHeight: "min(75vh, 640px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch" as any,
            }}
          >
            <DropdownCtx.Provider value={{ close: () => setOpen(false) }}>
              <div style={{ padding: 10, display: "grid", gap: 8 }}>{children}</div>
            </DropdownCtx.Provider>
          </div>
        </>,
        document.body
      ) : null}
    </div>
  );
}

function MenuItem({
  title,
  subtitle,
  onClick,
  right,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const ctx = React.useContext(DropdownCtx);

  return (
    <button
      type="button"
      onClick={() => {
        ctx?.close(); // ✅ close before opening modal
        onClick?.();
      }}
      className="ampere-focus menu-item-glow"
      role="menuitem"
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.10)",
        padding: 12,
        color: "white",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 950, opacity: 0.94 }}>{title}</div>
        {subtitle ? <div style={{ marginTop: 4, fontWeight: 850, opacity: 0.68, fontSize: 12 }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ opacity: 0.9, fontWeight: 950 }}>{right}</div> : null}
    </button>
  );
}

/* =========================
   Filter accordion
   ========================= */

function FilterAccordion({
  title,
  right,
  children,
  defaultOpen,
  isMobile,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isMobile: boolean;
}) {
  // Always start open to match SSR (isMobile is always false on first render)
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <button
        type="button"
        onClick={() => (isMobile ? setOpen((s) => !s) : null)}
        className="ampere-focus"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
          background: "transparent",
          border: "none",
          color: "white",
          cursor: isMobile ? "pointer" : "default",
          padding: 0,
        }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 18, fontWeight: 950 }}>{title}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, opacity: 0.8, fontWeight: 900, fontSize: 13 }}>
          {right}
          <span style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 120ms ease",
            display: isMobile ? "inline-flex" : "none",
          }}>
            <IconChevronDown />
          </span>
        </span>
      </button>

      {open ? children : null}
    </div>
  );
}

/* =========================
   Cards + grids
   ========================= */

function CardThumb({
  card,
  heroH,
  onOpen,
}: {
  card: Card;
  heroH: number;
  onOpen: (c: Card) => void;
}) {
  const platform = card.platformId ? platformById(card.platformId) : undefined;
  const badgeRight = card.badgeRight ?? platform?.label ?? card.platformLabel ?? "";

  const platformWatermarkSources = card.platformId
    ? [...platformIconCandidates(card.platformId), ...brandWideCandidates()]
    : [...brandWideCandidates(), ...brandMarkCandidates()];

  const leagueCanon = card.league ? canonicalLeagueForTeams(card.league) : null;
  const matchup = parseMatchupFromTitle(card.title);
  const t1 = leagueCanon && matchup.a ? findTeamByFragment(leagueCanon, matchup.a) : null;
  const t2 = leagueCanon && matchup.b ? findTeamByFragment(leagueCanon, matchup.b) : null;
  const team1Sources = leagueCanon && t1 ? teamLogoCandidates(leagueCanon, t1) : [];
  const team2Sources = leagueCanon && t2 ? teamLogoCandidates(leagueCanon, t2) : [];

  const leagueSources = leagueLogoCandidates(card.league);
  const platformIcon = card.platformId ? platformIconCandidates(card.platformId) : [];

  return (
    <button
      type="button"
      onClick={() => onOpen(card)}
      className="ampere-focus"
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: "1px solid var(--stroke)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          height: heroH,
          background:
            "radial-gradient(900px 260px at 30% 0%, rgba(58,167,255,0.18), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.20))",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.22, pointerEvents: "none", display: "grid", placeItems: "center", padding: 16 }}>
          <SmartImg
            sources={platformWatermarkSources}
            size={900}
            rounded={0}
            border={false}
            fit="contain"
            fill
            style={{ filter: "saturate(0.95) contrast(1.05)" }}
            fallbackText="AMPÈRE"
          />
        </div>

        {team1Sources.length > 0 && team2Sources.length > 0 ? (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: 10, top: 10, bottom: 10, width: "45%", opacity: 0.28, display: "grid", placeItems: "center" }}>
              <SmartImg sources={team1Sources} size={600} rounded={0} border={false} fit="contain" fill />
            </div>
            <div style={{ position: "absolute", right: 10, top: 10, bottom: 10, width: "45%", opacity: 0.28, display: "grid", placeItems: "center" }}>
              <SmartImg sources={team2Sources} size={600} rounded={0} border={false} fit="contain" fill />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", opacity: 0.45, fontWeight: 950, letterSpacing: 2, fontSize: 12 }}>
              VS
            </div>
          </div>
        ) : null}

        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 8 }}>
          {card.badge ? (
            <span
              style={{
                padding: "5px 9px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background:
                  card.badge === "LIVE"
                    ? "rgba(255,72,72,0.22)"
                    : card.badge === "UPCOMING"
                    ? "rgba(58,167,255,0.20)"
                    : "rgba(255,255,255,0.12)",
                color: "white",
                fontWeight: 950,
                fontSize: 11,
                letterSpacing: 0.6,
              }}
            >
              {card.badge}
            </span>
          ) : null}
        </div>

        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {badgeRight ? (
            <span
              style={{
                padding: "5px 9px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.40)",
                color: "white",
                fontWeight: 950,
                fontSize: 11,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={badgeRight}
            >
              {badgeRight}
            </span>
          ) : null}
        </div>

        <div style={{ position: "absolute", left: 10, bottom: 8, display: "flex", gap: 6, alignItems: "center" }}>
          {team1Sources.length > 0 ? <SmartImg sources={team1Sources} size={22} rounded={8} fit="contain" fallbackText="" /> : null}
          {team2Sources.length > 0 ? <SmartImg sources={team2Sources} size={22} rounded={8} fit="contain" fallbackText="" /> : null}
          {leagueSources.length ? <SmartImg sources={leagueSources} size={26} rounded={10} fit="contain" fallbackText={(card.league ?? "L")[0]} /> : null}
          {platformIcon.length ? <SmartImg sources={platformIcon} size={26} rounded={10} fit="contain" fallbackText={(platform?.label ?? "P")[0]} /> : null}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ color: "white", fontWeight: 950, fontSize: 15, lineHeight: 1.15 }}>{card.title}</div>

        {card.subtitle ? <div style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, fontWeight: 850, fontSize: 12 }}>{card.subtitle}</div> : null}

        {card.metaLeft || card.metaRight ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 8,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 900,
              fontSize: 11,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.metaLeft ?? ""}</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.metaRight ?? ""}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

function Section({
  title,
  rightText,
  onRightClick,
  children,
}: {
  title: string;
  rightText?: string;
  onRightClick?: () => void;
  children: React.ReactNode;
}) {
  const showHeader = !!title || !!rightText;
  if (!showHeader) return <>{children}</>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 950, color: "white" }}>{title}</div>
        {rightText ? (
          <button
            type="button"
            onClick={onRightClick}
            className="ampere-focus"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.76)",
              cursor: "pointer",
              fontWeight: 950,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {rightText}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CardGrid({
  cards,
  cardMinW,
  heroH,
  onOpen,
  skeleton,
}: {
  cards: Card[];
  cardMinW: number;
  heroH: number;
  onOpen: (c: Card) => void;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${cardMinW}px, 100%), 1fr))`, gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 18,
              border: "1px solid var(--stroke)",
              background: "rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: heroH, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              <div style={{ height: 14, background: "rgba(255,255,255,0.08)", borderRadius: 8 }} />
              <div style={{ height: 12, width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: 8 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${cardMinW}px, 100%), 1fr))`, gap: 12 }}>
      {cards.map((c) => (
        <CardThumb key={c.id} card={c} heroH={heroH} onOpen={onOpen} />
      ))}
      {!cards.length ? <div style={{ opacity: 0.75, fontWeight: 950 }}>No items.</div> : null}
    </div>
  );
}

function PagedCardGrid({
  cards,
  cardMinW,
  heroH,
  onOpen,
  pageSize = 24,
}: {
  cards: Card[];
  cardMinW: number;
  heroH: number;
  onOpen: (c: Card) => void;
  pageSize?: number;
}) {
  const [shown, setShown] = useState(pageSize);
  useEffect(() => setShown(pageSize), [cards, pageSize]);

  const slice = cards.slice(0, shown);
  const more = shown < cards.length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CardGrid cards={slice} cardMinW={cardMinW} heroH={heroH} onOpen={onOpen} />
      {more ? (
        <button
          type="button"
          onClick={() => setShown((n) => Math.min(cards.length, n + pageSize))}
          className="ampere-focus"
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.10)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Load more ({slice.length}/{cards.length})
        </button>
      ) : null}
    </div>
  );
}

/* =========================
   Tracking + ranking + demo catalog
   ========================= */

function track(event: string, props: Record<string, any>) {
  try {
    // eslint-disable-next-line no-console
    console.log("[ampere]", event, props);
  } catch {}

  try {
    if (typeof window === "undefined") return;
    const sessionId = getSessionId();
    const nextEvt: AttributionEvent = { at: safeNowISO(), sessionId, event, props: props ?? {} };
    const existing = loadAttribution();
    saveAttribution([...existing, nextEvt]);
  } catch {}
}

function uniqByCardKey(cards: Card[]) {
  const m = new Map<string, Card>();
  for (const c of cards) {
    const k = [normalizeKey(c.title), c.platformId ?? normalizeKey(c.platformLabel ?? ""), normalizeKey(c.league ?? ""), normalizeKey(c.genre ?? "")].join("|");
    if (!m.has(k)) m.set(k, c);
  }
  return Array.from(m.values());
}

function logViewing(card: Card) {
  try {
    const events = loadViewing();
    const next: ViewingEvent = { id: card.id, title: card.title, platformId: card.platformId, league: card.league, at: safeNowISO() };
    saveViewing([...events, next]);
    track("viewing_log", { id: card.id, platformId: card.platformId ?? null });
  } catch {}
}

function rankForYou(cards: Card[], profile: ProfileState, viewing: ViewingEvent[]): Card[] {
  const favPlatforms = new Set(profile.favoritePlatformIds);
  const favLeagues = new Set(profile.favoriteLeagues.map(normalizeKey));
  const favTeams = new Set(profile.favoriteTeams.map(normalizeKey));

  const recent = viewing.slice(-120);
  const seenKey = new Map<string, number>();
  for (let i = 0; i < recent.length; i++) {
    const v = recent[i];
    const k = `${normalizeKey(v.title)}|${v.platformId ?? ""}|${normalizeKey(v.league ?? "")}`;
    seenKey.set(k, (seenKey.get(k) ?? 0) + 1);
  }

  const scored = cards.map((c, idx) => {
    let s = 0;

    if (c.platformId && favPlatforms.has(c.platformId)) s += 10;
    if (c.league && favLeagues.has(normalizeKey(c.league))) s += 8;

    const titleK = normalizeKey(c.title);
    const subK = normalizeKey(c.subtitle ?? "");
    for (const t of favTeams) {
      if (t && (titleK.includes(t) || subK.includes(t))) {
        s += 7;
        break;
      }
    }

    if (c.badge === "LIVE") s += 4;
    if (c.badge === "UPCOMING") s += 2;

    const k = `${normalizeKey(c.title)}|${c.platformId ?? ""}|${normalizeKey(c.league ?? "")}`;
    const seen = seenKey.get(k) ?? 0;
    s -= Math.min(6, seen * 2);

    s += (idx % 7) * 0.01;
    return { c, s };
  });

  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.c);
}

function buildDemoCatalog(): {
  forYou: Card[];
  liveNow: Card[];
  continueWatching: Card[];
  trending: Card[];
  blackMediaCards: Card[];
} {
  const mk = (p: Partial<Card> & { title: string }): Card => ({
    id: `c_${Math.random().toString(16).slice(2)}_${normalizeKey(p.title)}`,
    ...p,
    title: p.title,
  });

  // ── For You (one preview per major platform) ──
  const forYou: Card[] = [
    // Basic
    mk({ title: "The Bear", subtitle: "Season highlights", platformId: "hulu", genre: "Basic", metaLeft: "Comedy-drama", metaRight: "HD" }),
    mk({ title: "Stranger Things 5", subtitle: "New season premiere", platformId: "netflix", genre: "Basic", metaLeft: "Sci-fi", metaRight: "4K" }),
    mk({ title: "The Lord of the Rings", subtitle: "Rings of Power S2", platformId: "primevideo", genre: "Basic", metaLeft: "Fantasy", metaRight: "4K HDR" }),
    mk({ title: "Loki Season 3", subtitle: "New episodes weekly", platformId: "disneyplus", genre: "Basic", metaLeft: "Marvel", metaRight: "4K" }),
    mk({ title: "The Last of Us", subtitle: "Episode 6 premiere", platformId: "max", genre: "Premium", metaLeft: "Drama", metaRight: "HD" }),
    mk({ title: "Yellowstone", subtitle: "Season finale", platformId: "peacock", genre: "Basic", metaLeft: "Western", metaRight: "HD" }),
    mk({ title: "Lioness", subtitle: "New CIA thriller", platformId: "paramountplus", genre: "Basic", metaLeft: "Action", metaRight: "HD" }),
    mk({ title: "Severance", subtitle: "Mind-bending S2", platformId: "appletv", genre: "Premium", metaLeft: "Thriller", metaRight: "4K" }),
    mk({ title: "MrBeast Challenge", subtitle: "Most viewed", platformId: "youtube", genre: "Free", metaLeft: "Entertainment", metaRight: "4K" }),
    // Premium
    mk({ title: "BMF Season 3", subtitle: "New episodes", platformId: "starz", genre: "Premium", metaLeft: "Crime", metaRight: "HD" }),
    mk({ title: "Walking Dead: Daryl", subtitle: "Paris adventure", platformId: "amcplus", genre: "Premium", metaLeft: "Horror", metaRight: "HD" }),
    mk({ title: "BET Awards Special", subtitle: "Full show replay", platformId: "betplus", genre: "Premium", metaLeft: "Awards", metaRight: "HD" }),
    mk({ title: "Condor S3", subtitle: "Spy thriller", platformId: "mgmplus", genre: "Premium", metaLeft: "Thriller", metaRight: "HD" }),
    // Movies
    mk({ title: "Criterion Collection", subtitle: "Classic cinema", platformId: "criterion", genre: "Movies", metaLeft: "Curated", metaRight: "Restored" }),
    mk({ title: "MUBI Weekly Pick", subtitle: "Festival winner", platformId: "mubi", genre: "Arthouse", metaLeft: "Indie", metaRight: "Curated" }),
    mk({ title: "Vudu: New Releases", subtitle: "Rent or buy", platformId: "vudu", genre: "Movies", metaLeft: "Movies", metaRight: "New" }),
    // Documentaries
    mk({ title: "Planet Earth: Space", subtitle: "Documentary series", platformId: "pbspassport", genre: "Documentaries", metaLeft: "Doc", metaRight: "4K" }),
    mk({ title: "CuriosityStream: Cosmos", subtitle: "Deep space exploration", platformId: "curiositystream", genre: "Documentaries", metaLeft: "Science", metaRight: "4K" }),
    mk({ title: "MagellanTV: War Stories", subtitle: "History deep dive", platformId: "magellantv", genre: "Documentaries", metaLeft: "History", metaRight: "HD" }),
    // Anime & AsianTV
    mk({ title: "Demon Slayer S4", subtitle: "New episodes", platformId: "crunchyroll", genre: "Anime & AsianTV", metaLeft: "Anime", metaRight: "Sub/Dub" }),
    mk({ title: "HIDIVE: Oshi no Ko", subtitle: "Exclusive premiere", platformId: "hidive", genre: "Anime & AsianTV", metaLeft: "Anime", metaRight: "Sub" }),
    mk({ title: "Viki: K-Drama Hits", subtitle: "Top Korean drama", platformId: "viki", genre: "Anime & AsianTV", metaLeft: "K-Drama", metaRight: "Sub" }),
    mk({ title: "iQIYI: C-Drama Weekly", subtitle: "Chinese drama pick", platformId: "iqiyi", genre: "Anime & AsianTV", metaLeft: "C-Drama", metaRight: "Sub" }),
    mk({ title: "AsianCrush: Action", subtitle: "Martial arts cinema", platformId: "asiancrush", genre: "Anime & AsianTV", metaLeft: "Action", metaRight: "HD" }),
    // Kids
    mk({ title: "Kidoodle Adventure", subtitle: "Safe fun for kids", platformId: "kidoodletv", genre: "Kids", metaLeft: "Kids", metaRight: "Free" }),
    mk({ title: "PBS Kids: Wild Kratts", subtitle: "Animal adventures", platformId: "pbskids", genre: "Kids", metaLeft: "Education", metaRight: "Free" }),
    mk({ title: "Noggin: Blue's Clues", subtitle: "Interactive learning", platformId: "noggin", genre: "Kids", metaLeft: "Preschool", metaRight: "Ad-free" }),
    mk({ title: "YouTube Kids: Sing Along", subtitle: "Music & dance", platformId: "youtubekids", genre: "Kids", metaLeft: "Music", metaRight: "Free" }),
    // Sports
    mk({ title: "UFC Countdown", subtitle: "Fight week special", platformId: "espnplus", league: "UFC", genre: "Sports", metaLeft: "UFC", metaRight: "LIVE soon", badge: "UPCOMING" }),
    mk({ title: "NFL+ RedZone", subtitle: "Every touchdown", platformId: "nflplus", league: "NFL", genre: "Sports", metaLeft: "NFL", metaRight: "Live" }),
    mk({ title: "NBA League Pass", subtitle: "Full game replays", platformId: "nbaleaguepass", league: "NBA", genre: "Sports", metaLeft: "NBA", metaRight: "On Demand" }),
    mk({ title: "MLB.TV: Highlights", subtitle: "Best plays tonight", platformId: "mlbtv", league: "MLB", genre: "Sports", metaLeft: "MLB", metaRight: "4K" }),
    mk({ title: "DAZN: Boxing Main Event", subtitle: "PPV night", platformId: "dazn", genre: "Sports", metaLeft: "Boxing", metaRight: "HD" }),
    // Gaming
    mk({ title: "Gaming: Speedrun Marathon", subtitle: "Live marathon", platformId: "twitch", genre: "Gaming", metaLeft: "Gaming", metaRight: "LIVE", badge: "LIVE" }),
    mk({ title: "Kick: Top Streamer", subtitle: "Live gameplay", platformId: "kick", genre: "Gaming", metaLeft: "Streaming", metaRight: "Live" }),
    // Free
    mk({ title: "Tubi: Action Movies", subtitle: "Free blockbusters", platformId: "tubi", genre: "Free", metaLeft: "Action", metaRight: "Free" }),
    mk({ title: "Pluto TV: Comedy Central", subtitle: "Live channel", platformId: "plutotv", genre: "Free", metaLeft: "Comedy", metaRight: "Free" }),
    mk({ title: "Roku Channel: Originals", subtitle: "Exclusive series", platformId: "rokuchannel", genre: "Free", metaLeft: "Original", metaRight: "Free" }),
    mk({ title: "Freevee: Bosch Legacy", subtitle: "Amazon originals", platformId: "freevee", genre: "Free", metaLeft: "Thriller", metaRight: "Free" }),
    mk({ title: "Xumo: News Live", subtitle: "24/7 news stream", platformId: "xumo", genre: "Free", metaLeft: "News", metaRight: "Free" }),
    mk({ title: "Plex: Discover", subtitle: "Universal watchlist", platformId: "plex", genre: "Free", metaLeft: "Mixed", metaRight: "Free" }),
    mk({ title: "Crackle: Snatch", subtitle: "Crime comedy", platformId: "crackle", genre: "Free", metaLeft: "Crime", metaRight: "Free" }),
    // Horror / Cult
    mk({ title: "Shudder: Creepshow", subtitle: "Horror anthology", platformId: "shudder", genre: "Horror / Cult", metaLeft: "Horror", metaRight: "New" }),
    mk({ title: "Screambox: Slasher", subtitle: "Cult favorites", platformId: "screambox", genre: "Horror / Cult", metaLeft: "Slasher", metaRight: "HD" }),
    mk({ title: "Arrow Player: Giallo", subtitle: "Italian horror", platformId: "arrow", genre: "Horror / Cult", metaLeft: "Cult", metaRight: "Restored" }),
    // LGBT
    mk({ title: "LGBTQ+ Picks", subtitle: "Tonight's selection", platformId: "dekkoo", genre: "LGBT", metaLeft: "LGBT", metaRight: "Curated" }),
    mk({ title: "HERE TV: Drama", subtitle: "Original series", platformId: "heretv", genre: "LGBT", metaLeft: "Drama", metaRight: "HD" }),
    mk({ title: "OUTtv: Weekend", subtitle: "New premiere", platformId: "outtv", genre: "LGBT", metaLeft: "LGBT", metaRight: "New" }),
    mk({ title: "Revry: Music Festival", subtitle: "Live concert", platformId: "revry", genre: "LGBT", metaLeft: "Music", metaRight: "Live" }),
    // Arthouse
    mk({ title: "OVID: Global Cinema", subtitle: "World premieres", platformId: "ovid", genre: "Arthouse", metaLeft: "World", metaRight: "Exclusive" }),
    mk({ title: "Kanopy: Film School", subtitle: "Free via library", platformId: "kanopy", genre: "Arthouse", metaLeft: "Cinema", metaRight: "Free" }),
    mk({ title: "Fandor: Directors Cut", subtitle: "Indie showcase", platformId: "fandor", genre: "Arthouse", metaLeft: "Indie", metaRight: "Curated" }),
    // Live TV
    mk({ title: "YouTube TV: NBA", subtitle: "Full game access", platformId: "youtubetv", genre: "LiveTV", metaLeft: "Sports", metaRight: "Live" }),
    mk({ title: "Hulu + Live TV", subtitle: "Live channels + library", platformId: "hululive", genre: "LiveTV", metaLeft: "Bundle", metaRight: "Live" }),
    mk({ title: "Sling: Orange + Blue", subtitle: "Live TV package", platformId: "sling", genre: "LiveTV", metaLeft: "Cable", metaRight: "Live" }),
    mk({ title: "FuboTV: Premier League", subtitle: "Match day", platformId: "fubotv", genre: "LiveTV", metaLeft: "Soccer", metaRight: "4K" }),
    // Black Media
    mk({ title: "Kweli TV: African Film", subtitle: "Pan-African stories", platformId: "kwelitv", genre: "Black Media", metaLeft: "African", metaRight: "HD" }),
    mk({ title: "UrbanFlix: Originals", subtitle: "Black indie cinema", platformId: "urbanflixtv", genre: "Black Media", metaLeft: "Indie", metaRight: "HD" }),
    mk({ title: "Brown Sugar: Classic", subtitle: "Blaxploitation era", platformId: "brownsugar", genre: "Black Media", metaLeft: "Classic", metaRight: "HD" }),
    mk({ title: "UMC: Faith & Family", subtitle: "Inspirational", platformId: "umc", genre: "Black Media", metaLeft: "Faith", metaRight: "HD" }),
    mk({ title: "AfrolandTV: Culture", subtitle: "Global Black stories", platformId: "afrolandtv", genre: "Black Media", metaLeft: "Culture", metaRight: "New" }),
    mk({ title: "Americanu: Diaspora", subtitle: "Diaspora narratives", platformId: "americanu", genre: "Black Media", metaLeft: "Diaspora", metaRight: "HD" }),
    mk({ title: "HBCU GO Sports", subtitle: "HBCU athletics", platformId: "hbcugosports", genre: "Sports", metaLeft: "HBCU", metaRight: "Live", badge: "LIVE" }),
  ];

  // ── Live Now ──
  const liveNow: Card[] = [
    mk({ title: "NFL: Chiefs vs Bills", subtitle: "Weeknight football", platformId: "espn", league: "NFL", genre: "Sports", badge: "LIVE", metaLeft: "NFL", metaRight: "Live", timeRemaining: "Q3 • 10:22" }),
    mk({ title: "NBA: Lakers vs Celtics", subtitle: "Rivalry night", platformId: "youtubetv", league: "NBA", genre: "LiveTV", badge: "LIVE", metaLeft: "NBA", metaRight: "Live", timeRemaining: "2nd • 04:18" }),
    mk({ title: "NHL: Bruins vs Rangers", subtitle: "Original Six vibes", platformId: "nhl", league: "NHL", genre: "Sports", badge: "LIVE", metaLeft: "NHL", metaRight: "Live", timeRemaining: "3rd • 07:11" }),
    mk({ title: "MLB: Yankees vs Dodgers", subtitle: "Crosstown classic", platformId: "mlbtv", league: "MLB", genre: "Sports", badge: "LIVE", metaLeft: "MLB", metaRight: "Live", timeRemaining: "5th • 2-1" }),
    mk({ title: "Premier League: Arsenal vs Chelsea", subtitle: "London derby", platformId: "fubotv", league: "Premier League", genre: "Sports", badge: "LIVE", metaLeft: "EPL", metaRight: "Live", timeRemaining: "65'" }),
    mk({ title: "Ligue 1: PSG vs Marseille", subtitle: "Le Classique", platformId: "fubotv", league: "France Ligue 1", genre: "Sports", badge: "LIVE", metaLeft: "Ligue 1", metaRight: "Live", timeRemaining: "38'" }),
    mk({ title: "NCAAF: Georgia vs Alabama", subtitle: "SEC showdown", platformId: "espnplus", league: "NCAAF", genre: "Sports", badge: "LIVE", metaLeft: "NCAAF • SEC", metaRight: "Live", timeRemaining: "Q2 • 05:41" }),
    mk({ title: "NCAAB: Duke vs North Carolina", subtitle: "ACC rivalry", platformId: "espnplus", league: "NCAAB", genre: "Sports", badge: "LIVE", metaLeft: "NCAAB • ACC", metaRight: "Live", timeRemaining: "H2 • 08:22" }),
    mk({ title: "KHL: CSKA vs SKA", subtitle: "Russian hockey", platformId: "espnplus", league: "KHL", genre: "Sports", badge: "LIVE", metaLeft: "KHL", metaRight: "Live", timeRemaining: "2nd • 12:05" }),
    mk({ title: "FS1: Soccer Night", subtitle: "Live match window", platformId: "foxsports1", genre: "LiveTV", badge: "LIVE", metaLeft: "FS1", metaRight: "Live" }),
    mk({ title: "UFC Fight Night", subtitle: "Main card", platformId: "espnplus", league: "UFC", genre: "Sports", badge: "LIVE", metaLeft: "UFC", metaRight: "Live" }),
    mk({ title: "MLS: Inter Miami vs Galaxy", subtitle: "Messi in action", platformId: "appletv", league: "MLS", genre: "Sports", badge: "LIVE", metaLeft: "MLS", metaRight: "Live", timeRemaining: "52'" }),
    mk({ title: "EFL: Bolton vs Luton", subtitle: "League One clash", platformId: "espnplus", league: "EFL League One", genre: "Sports", badge: "LIVE", metaLeft: "EFL", metaRight: "Live", timeRemaining: "70'" }),
  ];

  // ── Continue Watching ──
  const continueWatching: Card[] = [
    mk({ title: "Stranger Things 5", subtitle: "Continue Episode 4", platformId: "netflix", genre: "Basic", metaLeft: "Sci-fi", metaRight: "Resume" }),
    mk({ title: "The Batman", subtitle: "Continue at 01:12:33", platformId: "max", genre: "Movies", metaLeft: "Movie", metaRight: "Resume" }),
    mk({ title: "Demon Slayer S4", subtitle: "Continue queue", platformId: "crunchyroll", genre: "Anime & AsianTV", metaLeft: "Anime", metaRight: "Resume" }),
    mk({ title: "Criterion Collection", subtitle: "Continue watchlist", platformId: "criterion", genre: "Arthouse", metaLeft: "Arthouse", metaRight: "Resume" }),
    mk({ title: "Severance S2", subtitle: "Continue Episode 3", platformId: "appletv", genre: "Premium", metaLeft: "Thriller", metaRight: "Resume" }),
    mk({ title: "The Bear S3", subtitle: "Continue Episode 7", platformId: "hulu", genre: "Basic", metaLeft: "Drama", metaRight: "Resume" }),
  ];

  // ── Trending ──
  const trending: Card[] = [
    mk({ title: "Top 10 Today", subtitle: "Across streaming", platformId: "netflix", genre: "Basic", metaLeft: "Trending", metaRight: "Now" }),
    mk({ title: "Horror / Cult Night", subtitle: "New arrivals", platformId: "shudder", genre: "Horror / Cult", metaLeft: "Horror", metaRight: "New" }),
    mk({ title: "Free Movies Marathon", subtitle: "Watch free", platformId: "tubi", genre: "Free", metaLeft: "Free", metaRight: "No sign-up" }),
    mk({ title: "Kids: Wild Kratts", subtitle: "Nature adventures", platformId: "pbskids", genre: "Kids", metaLeft: "Kids", metaRight: "Safe" }),
    mk({ title: "Live Gaming: Esports", subtitle: "Championship finals", platformId: "youtube", genre: "Gaming", badge: "LIVE", metaLeft: "Gaming", metaRight: "Live" }),
    mk({ title: "OUTtv: Weekend Premiere", subtitle: "New episode drop", platformId: "outtv", genre: "LGBT", metaLeft: "LGBT", metaRight: "New" }),
    mk({ title: "Disney+: Inside Out 3", subtitle: "Animated sequel", platformId: "disneyplus", genre: "Basic", metaLeft: "Animation", metaRight: "4K" }),
    mk({ title: "Max: House of Dragon", subtitle: "Season 3 premiere", platformId: "max", genre: "Premium", metaLeft: "Fantasy", metaRight: "4K HDR" }),
    mk({ title: "Peacock: Olympic Replays", subtitle: "Best moments", platformId: "peacock", genre: "Sports", metaLeft: "Olympics", metaRight: "4K" }),
    mk({ title: "Paramount+: Knuckles", subtitle: "Sonic spinoff", platformId: "paramountplus", genre: "Basic", metaLeft: "Animation", metaRight: "HD" }),
  ];

  // ── Black Media ──
  const blackMediaCards: Card[] = [
    mk({ title: "Black Star Network: Live", subtitle: "News + culture", platformId: "blackstarnetwork", genre: "Black Media", badge: "LIVE", metaLeft: "Live", metaRight: "Now" }),
    mk({ title: "MANSA Originals", subtitle: "Curated stories", platformId: "mansa", genre: "Black Media", metaLeft: "Originals", metaRight: "New" }),
    mk({ title: "ALLBLK: Drama Picks", subtitle: "Binge-ready", platformId: "allblk", genre: "Black Media", metaLeft: "Drama", metaRight: "HD" }),
    mk({ title: "HBCU Game of the Week", subtitle: "Showcase", platformId: "hbcugosports", league: "HBCUGoSports", genre: "Sports", badge: "UPCOMING", metaLeft: "HBCU", metaRight: "Soon", startTime: "Sat 7:30 PM" }),
    mk({ title: "Brown Sugar: Classics", subtitle: "70s & 80s cinema", platformId: "brownsugar", genre: "Black Media", metaLeft: "Classic", metaRight: "HD" }),
    mk({ title: "BET+ Original Series", subtitle: "Exclusive premiere", platformId: "betplus", genre: "Black Media", metaLeft: "Original", metaRight: "New" }),
    mk({ title: "Kweli TV: Pan-African", subtitle: "World cinema", platformId: "kwelitv", genre: "Black Media", metaLeft: "World", metaRight: "HD" }),
    mk({ title: "UrbanFlix: New Wave", subtitle: "Indie Black cinema", platformId: "urbanflixtv", genre: "Black Media", metaLeft: "Indie", metaRight: "New" }),
  ];

  return { forYou, liveNow, continueWatching, trending, blackMediaCards };
}

/* =========================
   MAIN APP COMPONENT
   ========================= */

export default function AmpereApp() {
  const { isMobile, density } = useViewport();

  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [activeGenre, setActiveGenre] = useState<GenreKey>("All");
  const [activePlatform, setActivePlatform] = useState<PlatformId>("all");
  const [activeLeague, setActiveLeague] = useState<string>("ALL");

  const [profile, setProfile] = useState<ProfileState>(() => loadProfile());

  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [openSeeAll, setOpenSeeAll] = useState<null | "Genre" | "platforms" | "for-you" | "live-now" | "continue" | "trending" | "black-media">(null);

  const [openVoice, setOpenVoice] = useState(false);
  const [openRemote, setOpenRemote] = useState(false);
  const [openFavorites, setOpenFavorites] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openConnect, setOpenConnect] = useState(false);
  const [openSetup, setOpenSetup] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);
  const [openProfileSettings, setOpenProfileSettings] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [openAppStore, setOpenAppStore] = useState(false);
  const [openSwitchProfile, setOpenSwitchProfile] = useState(false);
  const [openKidMode, setOpenKidMode] = useState(false);
  const [openTVBrand, setOpenTVBrand] = useState(false);

  // InnovationSuite screens
  const [openPremiumHub, setOpenPremiumHub] = useState(false);
  const [openPricing, setOpenPricing] = useState(false);
  const [openTasteEngine, setOpenTasteEngine] = useState(false);
  const [openUniversalQueue, setOpenUniversalQueue] = useState(false);
  const [openTimeToDelight, setOpenTimeToDelight] = useState(false);
  const [openModes, setOpenModes] = useState(false);
  const [openRemoteScenes, setOpenRemoteScenes] = useState(false);
  const [openConnectLadder, setOpenConnectLadder] = useState(false);
  const [openTrustPortability, setOpenTrustPortability] = useState(false);
  const [openFamilyProfiles, setOpenFamilyProfiles] = useState(false);
  const [openSocial, setOpenSocial] = useState(false);
  const [openLivePulse, setOpenLivePulse] = useState(false);
  const [openSemanticSearch, setOpenSemanticSearch] = useState(false);
  const [openAddDevice, setOpenAddDevice] = useState(false);
  const [openVirtualEmulator, setOpenVirtualEmulator] = useState(false);
  const [openBettingCompanion, setOpenBettingCompanion] = useState(false);

  const isPremiumUser = () => canAccessFeature("taste_engine");

  const [powerState, setPowerState] = useState<"off" | "booting" | "on">("off");

  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftRegion, setDraftRegion] = useState<string>("north_america");
  const [draftRegions, setDraftRegions] = useState<string[]>(["north_america"]);
  const [wizPlatShown, setWizPlatShown] = useState(isMobile ? 6 : 12);
  const [draftLanguage, setDraftLanguage] = useState<string>("en");
  const [draftPlatforms, setDraftPlatforms] = useState<PlatformId[]>(profile.favoritePlatformIds);
  const [draftLeagues, setDraftLeagues] = useState<string[]>(profile.favoriteLeagues);
  const [draftTeams, setDraftTeams] = useState<string[]>(profile.favoriteTeams);

  const [wizShownByLeague, setWizShownByLeague] = useState<Record<string, number>>({});
  const [wizTeamSearch, setWizTeamSearch] = useState("");

  const [GenreShown, setGenreShown] = useState<number>(isMobile ? 6 : 10);
  const [platformsShown, setPlatformsShown] = useState<number>(isMobile ? 8 : 12);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const demo = useMemo(() => buildDemoCatalog(), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "AMPÈRE";
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  // Sync draft with profile ONLY when wizard is closed (so in-progress wizard isn't overwritten)
  useEffect(() => {
    if (openSetup) return;
    setDraftName(profile.name);
    setDraftPlatforms(profile.favoritePlatformIds);
    setDraftLeagues(profile.favoriteLeagues);
    setDraftTeams(profile.favoriteTeams);
  }, [profile, openSetup]);

  useEffect(() => {
    setGenreShown(isMobile ? 6 : 10);
    setPlatformsShown(isMobile ? 8 : 12);
  }, [isMobile]);

  useEffect(() => {
    const visible = platformsForGenre(activeGenre);
    const ok = activePlatform === "all" || visible.includes(activePlatform);
    if (!ok) setActivePlatform("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre]);

  // Wizard: initialize "shown teams per league" when step 4 entered
  useEffect(() => {
    if (setupStep !== 4) return;
    const initial = 4;
    const next: Record<string, number> = {};
    for (const l of draftLeagues) {
      const canon = canonicalLeagueForTeams(l) ?? l;
      next[canon] = next[canon] ?? initial;
    }
    setWizShownByLeague(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupStep, draftLeagues.join("|"), isMobile]);

  // Wizard persistence: load on open
  useEffect(() => {
    if (!openSetup) return;
    const saved = loadWizardDraft();
    if (saved) {
      setSetupStep(saved.step);
      setDraftName(saved.name || profile.name);
      setDraftRegion(saved.region || "north_america");
      setDraftLanguage(saved.language || "en");
      setDraftPlatforms(saved.platforms.length ? saved.platforms : profile.favoritePlatformIds);
      setDraftLeagues(saved.leagues.length ? saved.leagues : profile.favoriteLeagues);
      setDraftTeams(saved.teams.length ? saved.teams : profile.favoriteTeams);
    } else {
      setSetupStep(1);
      setDraftName(profile.name);
      setDraftRegion("north_america");
      setDraftLanguage("en");
      setDraftPlatforms(profile.favoritePlatformIds);
      setDraftLeagues(profile.favoriteLeagues);
      setDraftTeams(profile.favoriteTeams);
    }
    setWizTeamSearch("");
  }, [openSetup]); // intentionally not including profile as dependency

  // Wizard persistence: save while open
  useEffect(() => {
    if (!openSetup) return;
    saveWizardDraft({
      step: setupStep,
      name: draftName,
      region: draftRegion,
      language: draftLanguage,
      platforms: uniq(draftPlatforms.filter(Boolean)),
      leagues: uniq(draftLeagues.filter(Boolean)),
      teams: uniq(draftTeams.filter(Boolean)),
      updatedAt: safeNowISO(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSetup, setupStep, draftName, draftPlatforms.join("|"), draftLeagues.join("|"), draftTeams.join("|")]);

  const viewing = useMemo(() => (typeof window === "undefined" ? [] : loadViewing()), [openCard]);
  const forYouRanked = useMemo(() => rankForYou(demo.forYou, profile, viewing), [demo.forYou, profile, viewing]);

  const visiblePlatformIds = useMemo(() => platformsForGenre(activeGenre), [activeGenre]);

  const visiblePlatforms = useMemo(() => {
    const ids = visiblePlatformIds
      .filter((id) => id !== "all" && id !== "livetv")
      .map((id) => platformById(id))
      .filter(Boolean) as Platform[];
    return ids;
  }, [visiblePlatformIds]);

  const matchesPlatform = (c: Card) => (activePlatform === "all" ? true : c.platformId === activePlatform);
  const matchesGenre = (c: Card) => (activeGenre === "All" ? true : c.genre ? c.genre === activeGenre : true);
  const matchesLeague = (c: Card) => (activeLeague === "ALL" ? true : normalizeKey(c.league ?? "") === normalizeKey(activeLeague));

  const forYou = useMemo(() => forYouRanked.filter(matchesGenre).filter(matchesPlatform), [forYouRanked, activeGenre, activePlatform]);
  const liveNow = useMemo(() => demo.liveNow.filter(matchesGenre).filter(matchesPlatform).filter(matchesLeague), [demo.liveNow, activeGenre, activePlatform, activeLeague]);
  const continueWatching = useMemo(() => demo.continueWatching.filter(matchesGenre).filter(matchesPlatform), [demo.continueWatching, activeGenre, activePlatform]);
  const trending = useMemo(() => demo.trending.filter(matchesGenre).filter(matchesPlatform), [demo.trending, activeGenre, activePlatform]);
  const blackMediaCards = useMemo(() => demo.blackMediaCards.filter(matchesGenre).filter(matchesPlatform), [demo.blackMediaCards, activeGenre, activePlatform]);

  const favOnlyPlatformSet = useMemo(() => new Set(profile.favoritePlatformIds), [profile.favoritePlatformIds]);
  const forYouFavs = useMemo(() => forYouRanked.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [forYouRanked, favOnlyPlatformSet]);
  const liveFavs = useMemo(() => demo.liveNow.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [demo.liveNow, favOnlyPlatformSet]);
  const continueFavs = useMemo(() => demo.continueWatching.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [demo.continueWatching, favOnlyPlatformSet]);
  const trendingFavs = useMemo(() => demo.trending.filter((c) => (c.platformId ? favOnlyPlatformSet.has(c.platformId) : false)), [demo.trending, favOnlyPlatformSet]);

  const allSearchCards = useMemo(
    () => uniqByCardKey([...demo.forYou, ...demo.liveNow, ...demo.continueWatching, ...demo.trending, ...demo.blackMediaCards]),
    [demo]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = allSearchCards.filter(matchesGenre).filter(matchesPlatform);
    if (!q) return base.slice(0, 36);
    const out = base.filter((c) =>
      `${c.title} ${c.subtitle ?? ""} ${c.platformLabel ?? ""} ${c.league ?? ""} ${c.genre ?? ""}`.toLowerCase().includes(q)
    );
    return out.slice(0, 60);
  }, [searchQuery, allSearchCards, activeGenre, activePlatform]);

  const seeAllItems = useMemo(() => {
    if (!openSeeAll) return [];
    if (openSeeAll === "Genre") return [];
    if (openSeeAll === "platforms") return [];
    if (openSeeAll === "for-you") return activeTab === "favs" ? forYouFavs : forYou;
    if (openSeeAll === "live-now") return activeTab === "favs" ? liveFavs : liveNow;
    if (openSeeAll === "continue") return activeTab === "favs" ? continueFavs : continueWatching;
    if (openSeeAll === "black-media") return blackMediaCards;
    if (openSeeAll === "trending") return activeTab === "search" ? searchResults : activeTab === "favs" ? trendingFavs : trending;
    return [];
  }, [openSeeAll, forYou, liveNow, continueWatching, trending, activeTab, blackMediaCards, searchResults, forYouFavs, liveFavs, continueFavs, trendingFavs]);

  const openCardAndLog = (c: Card) => {
    logViewing(c);
    setOpenCard(c);
  };

  const toggleConnected = (pid: PlatformId, on?: boolean) => {
    setProfile((prev) => {
      const nextOn = typeof on === "boolean" ? on : !prev.connectedPlatformIds?.[pid];
      const next: ProfileState = { ...prev, connectedPlatformIds: { ...prev.connectedPlatformIds, [pid]: nextOn } };
      saveProfile(next);
      track("connected_toggle", { platformId: pid, on: nextOn });
      return next;
    });
  };

  const submitSearch = () => {
    const q = searchInput.trim();
    setSearchQuery(q);
    track("search_submit", { q });
  };

  const openProviderForCard = (card: Card) => {
    if (typeof window === "undefined") return;
    const pid = card.platformId ?? platformIdFromLabel(card.platformLabel ?? "") ?? null;
    const url = providerUrlOpen(pid, card.title);
    track("handoff_open", { platformId: pid, title: card.title, url: redactUrl(url) });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const subscribeProvider = (card: Card) => {
    if (typeof window === "undefined") return;
    const pid = card.platformId ?? platformIdFromLabel(card.platformLabel ?? "") ?? null;
    const url = providerUrlSubscribe(pid);
    track("handoff_subscribe", { platformId: pid, url: redactUrl(url) });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openPlatformHandoff = (pid: PlatformId, mode: "open" | "subscribe") => {
    if (typeof window === "undefined") return;
    const url = mode === "open" ? providerUrlOpen(pid, platformById(pid)?.label ?? pid) : providerUrlSubscribe(pid);
    track("connect_handoff", { platformId: pid, mode, url: redactUrl(url) });
    toggleConnected(pid, true);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const headerInputRef = useRef<HTMLInputElement | null>(null);
  const bootVideoRef = useRef<HTMLVideoElement | null>(null);

  const avatarSources = profile.profilePhoto ? [profile.profilePhoto] : [...brandMarkCandidates()];
  const headerBg = profile.headerPhoto
    ? `linear-gradient(135deg, rgba(0,0,0,0.62), rgba(0,0,0,0.84)), url(${profile.headerPhoto}) center/cover no-repeat`
    : "linear-gradient(135deg, #050505 0%, #151515 55%, #070707 100%)";

  const showBack =
    !!openCard ||
    !!openSeeAll ||
    openVoice ||
    openRemote ||
    openFavorites ||
    openNotifications ||
    openConnect ||
    openSetup ||
    openAbout ||
    openProfileSettings ||
    openArchive ||
    openAppStore ||
    openSwitchProfile ||
    openKidMode ||
    openTVBrand ||
    openPremiumHub ||
    openPricing ||
    openTasteEngine ||
    openUniversalQueue ||
    openTimeToDelight ||
    openModes ||
    openRemoteScenes ||
    openConnectLadder ||
    openTrustPortability ||
    openFamilyProfiles ||
    openSocial ||
    openLivePulse ||
    openSemanticSearch ||
    openAddDevice ||
    openVirtualEmulator ||
    openBettingCompanion;

  const onBack = () => {
    if (openCard) return setOpenCard(null);
    if (openSeeAll) return setOpenSeeAll(null);
    if (openVoice) return setOpenVoice(false);
    if (openRemote) return setOpenRemote(false);
    if (openFavorites) return setOpenFavorites(false);
    if (openNotifications) return setOpenNotifications(false);
    if (openConnect) return setOpenConnect(false);
    if (openSetup) return setOpenSetup(false);
    if (openAbout) return setOpenAbout(false);
    if (openProfileSettings) return setOpenProfileSettings(false);
    if (openArchive) return setOpenArchive(false);
    if (openAppStore) return setOpenAppStore(false);
    if (openSwitchProfile) return setOpenSwitchProfile(false);
    if (openKidMode) return setOpenKidMode(false);
    if (openTVBrand) return setOpenTVBrand(false);
    if (openPremiumHub) return setOpenPremiumHub(false);
    if (openPricing) return setOpenPricing(false);
    if (openTasteEngine) return setOpenTasteEngine(false);
    if (openUniversalQueue) return setOpenUniversalQueue(false);
    if (openTimeToDelight) return setOpenTimeToDelight(false);
    if (openModes) return setOpenModes(false);
    if (openRemoteScenes) return setOpenRemoteScenes(false);
    if (openConnectLadder) return setOpenConnectLadder(false);
    if (openTrustPortability) return setOpenTrustPortability(false);
    if (openFamilyProfiles) return setOpenFamilyProfiles(false);
    if (openSocial) return setOpenSocial(false);
    if (openLivePulse) return setOpenLivePulse(false);
    if (openSemanticSearch) return setOpenSemanticSearch(false);
    if (openAddDevice) return setOpenAddDevice(false);
    if (openVirtualEmulator) return setOpenVirtualEmulator(false);
    if (openBettingCompanion) return setOpenBettingCompanion(false);
  };

  const resetFilters = () => {
    setActiveGenre("All");
    setActivePlatform("all");
    setActiveLeague("ALL");
    track("filters_reset", {});
  };

  const selectedChips: { label: string; onRemove: () => void }[] = [];
  if (activeGenre !== "All") selectedChips.push({ label: `Genre: ${activeGenre}`, onRemove: () => setActiveGenre("All") });
  if (activePlatform !== "all")
    selectedChips.push({ label: `Platform: ${platformById(activePlatform)?.label ?? activePlatform}`, onRemove: () => setActivePlatform("all") });
  if (activeTab === "live" && activeLeague !== "ALL") selectedChips.push({ label: `League: ${activeLeague}`, onRemove: () => setActiveLeague("ALL") });

  const isRailSeeAll = !!openSeeAll && openSeeAll !== "Genre" && openSeeAll !== "platforms";

  useEffect(() => {
    if (powerState !== "booting") return;
    track("power_booting", {});
    // Programmatically trigger video play as fallback for autoplay restrictions
    const vid = bootVideoRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {/* autoplay blocked — timer handles transition */});
    }
    // Boot timer: video plays for 10s before auto-transition to the app
    const t = setTimeout(() => {
      setPowerState("on");
      track("power_on", {});
    }, 10000);
    return () => clearTimeout(t);
  }, [powerState]);

  const powerOff = () => {
    track("power_off", {});
    setOpenCard(null);
    setOpenSeeAll(null);
    setOpenVoice(false);
    setOpenRemote(false);
    setOpenFavorites(false);
    setOpenNotifications(false);
    setOpenConnect(false);
    setOpenSetup(false);
    setOpenAbout(false);
    setOpenProfileSettings(false);
    setOpenArchive(false);
    setOpenAppStore(false);
    setOpenPremiumHub(false);
    setOpenPricing(false);
    setOpenTasteEngine(false);
    setOpenUniversalQueue(false);
    setOpenTimeToDelight(false);
    setOpenModes(false);
    setOpenRemoteScenes(false);
    setOpenConnectLadder(false);
    setOpenTrustPortability(false);
    setOpenFamilyProfiles(false);
    setOpenSocial(false);
    setOpenLivePulse(false);
    setOpenSemanticSearch(false);
    setOpenAddDevice(false);
    setOpenVirtualEmulator(false);
    setOpenBettingCompanion(false);
    setPowerState("off");
  };

  const finishWizard = () => {
    const name = draftName.trim() ? draftName.trim() : profile.name;
    const next: ProfileState = normalizeProfile({
      ...profile,
      name,
      favoritePlatformIds: uniq(draftPlatforms),
      favoriteLeagues: uniq(draftLeagues),
      favoriteTeams: uniq(draftTeams),
    });
    setProfile(next);
    saveProfile(next);
    track("wizard_finish", { name, platforms: next.favoritePlatformIds.length, leagues: next.favoriteLeagues.length, teams: next.favoriteTeams.length });
    clearWizardDraft();
    setOpenSetup(false);
    setSetupStep(1);
  };

  const canNextWizard = () => {
    if (setupStep === 1) return !!draftName.trim();
    if (setupStep === 2) return draftRegions.length > 0; // region selection (multi)
    if (setupStep === 3) return draftPlatforms.length > 0;
    if (setupStep === 4) return true; // leagues optional
    if (setupStep === 5) return true; // teams optional
    return true;
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
        background: "linear-gradient(135deg, var(--bg0) 0%, #161616 55%, #070707 100%)",
        color: "white",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      <style>{AMPERE_GLOBAL_CSS}</style>

      {/* Power overlay */}
      {powerState !== "on" ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background:
              "radial-gradient(900px 460px at 30% 0%, rgba(58,167,255,0.20), rgba(0,0,0,0.0) 60%), linear-gradient(135deg, #050505 0%, #151515 55%, #070707 100%)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            style={{
              width: "min(740px, 100%)",
              borderRadius: "var(--r-xl)",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.45)",
              boxShadow: "var(--shadow-lg)",
              padding: 18,
              display: "grid",
              gap: 14,
              textAlign: "center",
            }}
          >
            <div style={{ display: "grid", placeItems: "center" }}>
              <div style={{ width: "min(520px, 92%)", height: isMobile ? 44 : 54 }}>
                <SmartImg sources={brandWideCandidates()} size={900} rounded={0} border={false} fit="contain" fill fallbackText="AMPÈRE" />
              </div>
            </div>

            {powerState === "off" ? (
              <>
                <div style={{ fontWeight: 950, fontSize: 16, opacity: 0.92 }}>Ready when you are.</div>
                <button
                  type="button"
                  className="ampere-focus"
                  onClick={() => setPowerState("booting")}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 999,
                    border: "1px solid rgba(58,167,255,0.30)",
                    background: "rgba(58,167,255,0.14)",
                    color: "white",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Power On
                </button>
                <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 13 }}>Demo boot flow (Power On → splash → app).</div>
              </>
            ) : (
              <>
                {/* Boot video — 10s power-on sequence */}
                {/* Video source: public/assets/boot/power_on.mp4 */}
                <div style={{ borderRadius: 18, overflow: "hidden", background: "black", maxHeight: 360 }}>
                  <video
                    key="boot-video"
                    ref={bootVideoRef}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    style={{ width: "100%", maxHeight: 360, objectFit: "contain" }}
                    onEnded={() => { setPowerState("on"); track("power_on_video_ended", {}); }}
                  >
                    <source src={assetPath("/assets/boot/power_on.mp4") + "?v=4"} type="video/mp4" />
                  </video>
                </div>
                <div style={{ fontWeight: 950, fontSize: 16, opacity: 0.92 }}>Powering on...</div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "0%",
                      borderRadius: 999,
                      background: "rgba(58,167,255,0.55)",
                      boxShadow: "0 0 0 1px rgba(58,167,255,0.12) inset",
                      animation: "bootProgress 10s ease-in-out forwards",
                    }}
                  />
                </div>
                <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 13 }}>Loading your rails, favorites, and connected platforms...</div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Hidden upload inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const dataUrl = await fileToResizedDataUrl(f, 220);
            setProfile((prev) => {
              const next = { ...prev, profilePhoto: dataUrl };
              saveProfile(next);
              track("avatar_set", {});
              return next;
            });
          } catch {
            track("avatar_set_failed", {});
          }
        }}
      />
      <input
        ref={headerInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const dataUrl = await fileToResizedDataUrl(f, 1400);
            setProfile((prev) => {
              const next = { ...prev, headerPhoto: dataUrl };
              saveProfile(next);
              track("header_image_set", {});
              return next;
            });
          } catch {
            track("header_image_set_failed", {});
          }
        }}
      />

      {/* HEADER */}
      <header
        style={{
          paddingLeft: density.pad,
          paddingRight: density.pad,
          paddingBottom: density.pad,
          paddingTop: "max(env(safe-area-inset-top), 10px)",
          background: headerBg,
          borderBottom: "1px solid var(--stroke)",
          position: "relative",
          zIndex: 50,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 55%), rgba(0,0,0,0.36)",
            backdropFilter: "blur(10px)",
            padding: density.pad,
            display: "flex",
            flexWrap: isMobile ? "wrap" : "nowrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? 8 : 12,
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, minWidth: 0, flex: "0 1 auto", overflow: "hidden" }}>
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="ampere-focus"
                aria-label="Back"
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            ) : null}

            <div
              style={{
                width: isMobile ? 44 : 52,
                height: isMobile ? 44 : 52,
                borderRadius: "50%",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <SmartImg sources={brandMarkCandidates()} size={isMobile ? 44 : 52} rounded={999} border={false} fit="contain" fallbackText="A" />
            </div>

            <div style={{ minWidth: 0, display: "grid", gap: 4, flex: "1 1 auto", overflow: "hidden" }}>
              <div style={{ width: "100%", maxWidth: isMobile ? 160 : 280, height: isMobile ? 24 : 36 }}>
                <SmartImg sources={brandWideCandidates()} size={900} rounded={0} border={false} fit="contain" fill fallbackText="AMPÈRE" />
              </div>

              <div
                style={{
                  opacity: 0.72,
                  fontWeight: 900,
                  fontSize: density.small,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Profile: <span style={{ color: "white", opacity: 0.95 }}>{profile.name}</span>
              </div>
            </div>
          </div>

          <div className="ampere-header-actions" style={{ display: "flex", gap: isMobile ? 6 : 10, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-end", alignItems: "center", flex: isMobile ? "1 1 100%" : "0 1 auto" }}>
            <PillButton label="Voice" iconNode={<SmartImg sources={voiceIconCandidates()} size={18} rounded={0} border={false} fit="contain" fallbackText="" />} onClick={() => setOpenVoice(true)} ariaLabel="Voice" />
            <PillButton label="Remote" iconNode={<IconRemote />} onClick={() => setOpenRemote(true)} ariaLabel="Remote" />

            <Dropdown label="Settings" iconLeft={<SmartImg sources={settingsIconCandidates()} size={18} rounded={0} border={false} fit="contain" fallbackText="⚙" />}>
              <MenuItem title="Favorites" subtitle="Edit platforms / leagues / teams" onClick={() => setOpenFavorites(true)} right="›" />
              <MenuItem title="Notifications" subtitle="Alerts when favorite teams play" onClick={() => setOpenNotifications(true)} right="›" />
              <MenuItem title="Connect Platforms" subtitle="Open / Subscribe to streaming services" onClick={() => setOpenConnect(true)} right="›" />
              <MenuItem title="Archive" subtitle="History + attribution log" onClick={() => setOpenArchive(true)} right="›" />
              <MenuItem title="App Store" subtitle="Browse additional apps" onClick={() => setOpenAppStore(true)} right="›" />
              <MenuItem title="Trust & Privacy" subtitle="Data portability & private mode" onClick={() => setOpenTrustPortability(true)} right="›" />
              <MenuItem title="Betting Companion" subtitle="Track bets, P&L, quick stakes" onClick={() => setOpenBettingCompanion(true)} right="›" />

              {/* ── Premium grouped section ── */}
              <div style={{ marginTop: 4, marginBottom: 2 }}>
                <div style={{ padding: "6px 12px 4px", fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1.2, color: "#ffcc44", opacity: 0.85 }}>★ Premium</div>
                <div style={{ display: "grid", gap: 6 }}>
                  <MenuItem title="Premium Hub" subtitle="Plan details & taste packs" onClick={() => setOpenPremiumHub(true)} right="★" />
                  <MenuItem title="Taste Engine" subtitle="Preferences, modes, scenes & more" onClick={() => setOpenTasteEngine(true)} right="›" />
                  <MenuItem title="Pricing" subtitle="Compare plans & add-ons" onClick={() => setOpenPricing(true)} right="›" />
                  <MenuItem title="Add Device" subtitle="QR pair, local hub, cloud relay" onClick={() => setOpenAddDevice(true)} right="›" />
                  <MenuItem title="Virtual TV Emulator" subtitle="CC, translator & playback controls" onClick={() => setOpenVirtualEmulator(true)} right="›" />
                </div>
              </div>
            </Dropdown>

            <Dropdown
              label="Profile"
              iconLeft={
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <SmartImg sources={avatarSources} size={22} rounded={9} border={true} fit="cover" fallbackText={profile.name.slice(0, 1).toUpperCase()} />
                </span>
              }
            >
              <MenuItem title="Profile Settings" subtitle="Name, avatar, header image" onClick={() => setOpenProfileSettings(true)} right="›" />
              <MenuItem title="Switch Profile" subtitle="PIN-protected profile switching" onClick={() => setOpenSwitchProfile(true)} right="›" />
              <MenuItem title="Kid Mode" subtitle="Simplified UI for children" onClick={() => setOpenKidMode(true)} right="›" />
              <MenuItem title="Set-Up Wizard" subtitle="Resume onboarding" onClick={() => setOpenSetup(true)} right="›" />
              <MenuItem title="About AMPÈRE" subtitle="Backstory, inventors, and architecture" onClick={() => setOpenAbout(true)} right="i" />
            </Dropdown>

            {/* Power Off direct button - right of Profile */}
            <button
              type="button"
              className="ampere-focus"
              onClick={powerOff}
              aria-label="Power Off"
              title="Power Off"
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,72,72,0.22)",
                background: "rgba(255,72,72,0.08)",
                color: "#ff8888",
                fontWeight: 950,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              {"\u23FB"}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: density.pad,
          display: "grid",
          gap: density.gap,
          minWidth: 0,
        }}
      >
        {/* FILTERS (hidden on Favs tab) */}
        {activeTab !== "favs" ? (
        <div
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gap: 12,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: density.h2, fontWeight: 950 }}>Filters</div>
            <button
              type="button"
              onClick={resetFilters}
              className="ampere-focus"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.10)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
              aria-label="Reset filters"
              title="Reset"
            >
              <IconReset /> Reset
            </button>
          </div>

          {selectedChips.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {selectedChips.map((c) => (
                <Chip key={c.label} label={c.label} onRemove={c.onRemove} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>
              No active filters. <span style={{ opacity: 0.85 }}>Use Genre + Platforms (and League on Live) to narrow.</span>
            </div>
          )}

          <FilterAccordion title="Genre" isMobile={isMobile} defaultOpen={!isMobile} right={<span>{activeGenre === "All" ? "Any" : activeGenre}</span>}>
            <Section title="" rightText="See all" onRightClick={() => setOpenSeeAll("Genre")}>
              {(() => {
                const allGenres = GENRES.map((g) => g.key);
                const total = allGenres.length;
                const shown = clamp(GenreShown, 1, total);
                const slice = allGenres.slice(0, shown);
                const more = shown < total;

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
                    {slice.map((k) => (
                      <PillButton
                        key={k}
                        label={k}
                        iconSources={Genre_ICON_CANDIDATES[k] ?? []}
                        active={activeGenre === k}
                        onClick={() => setActiveGenre(k)}
                        fullWidth
                      />
                    ))}
                    {more ? (
                      <PillButton
                        label={`Load More (${slice.length}/${total})`}
                        iconNode={<IconPlus />}
                        subtle
                        onClick={() => setGenreShown((n) => Math.min(total, n + (isMobile ? 6 : 10)))}
                        fullWidth
                        ariaLabel="Load more Genre categories"
                      />
                    ) : null}
                  </div>
                );
              })()}
            </Section>
          </FilterAccordion>

          <FilterAccordion
            title="Platforms"
            isMobile={isMobile}
            defaultOpen={!isMobile}
            right={<span>{activePlatform === "all" ? "Any" : platformById(activePlatform)?.label ?? activePlatform}</span>}
          >
            <Section title="" rightText="See all" onRightClick={() => setOpenSeeAll("platforms")}>
              {(() => {
                const total = visiblePlatforms.length;
                const shown = clamp(platformsShown, 1, Math.max(1, total));
                const slice = visiblePlatforms.slice(0, shown);
                const more = shown < total;

                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))",
                      gap: 6,
                    }}
                  >
                    {slice.map((p) => (
                      <PillButton
                        key={`${activeGenre}_${p.id}`}
                        label={p.label}
                        iconSources={platformIconCandidates(p.id)}
                        active={activePlatform === p.id}
                        onClick={() => setActivePlatform(p.id)}
                        fullWidth
                        multiline
                      />
                    ))}
                    {more ? (
                      <PillButton
                        label={`Load More (${slice.length}/${total})`}
                        iconNode={<IconPlus />}
                        subtle
                        onClick={() => setPlatformsShown((n) => Math.min(total, n + (isMobile ? 8 : 12)))}
                        fullWidth
                        multiline
                        ariaLabel="Load more platforms"
                      />
                    ) : null}
                  </div>
                );
              })()}
            </Section>
          </FilterAccordion>

          {activeTab === "live" ? (
            <FilterAccordion title="League" isMobile={isMobile} defaultOpen={!isMobile} right={<span>{activeLeague === "ALL" ? "Any" : activeLeague}</span>}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 6 }}>
                {LEAGUES.map((l) => (
                  <PillButton key={l} label={l} active={normalizeKey(activeLeague) === normalizeKey(l)} onClick={() => setActiveLeague(l)} fullWidth />
                ))}
              </div>
            </FilterAccordion>
          ) : null}
        </div>
        ) : null}

        {/* PAGE HEADER + SEARCH BAR */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: density.h1, fontWeight: 950 }}>
            {activeTab === "home" ? "Home" : activeTab === "live" ? "Live" : activeTab === "favs" ? "Favs" : "Search"}
          </div>

          {activeTab === "search" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", width: "min(900px, 100%)" }}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                placeholder="Search titles, platforms, leagues…"
                className="ampere-focus"
                style={{
                  flex: "1 1 280px",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--stroke2)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  outline: "none",
                  fontWeight: 850,
                  minWidth: 240,
                }}
              />
              <button
                type="button"
                onClick={submitSearch}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(58,167,255,0.22)",
                  background: "rgba(58,167,255,0.12)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="ampere-focus"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>

              {/* QWERTY On-Screen Keyboard */}
              <div style={{ width: "100%", display: "grid", gap: 4, padding: "8px 0" }}>
                {[
                  ["Q","W","E","R","T","Y","U","I","O","P"],
                  ["A","S","D","F","G","H","J","K","L"],
                  ["Z","X","C","V","B","N","M","⌫"],
                  ["SPACE","CLEAR","GO"],
                ].map((row, ri) => (
                  <div key={ri} style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {row.map((k) => (
                      <button
                        key={k}
                        type="button"
                        className="ampere-focus"
                        onClick={() => {
                          setPressedKey(k);
                          setTimeout(() => setPressedKey(null), 200);
                          if (k === "⌫") setSearchInput((s) => s.slice(0, -1));
                          else if (k === "SPACE") setSearchInput((s) => s + " ");
                          else if (k === "CLEAR") { setSearchInput(""); setSearchQuery(""); }
                          else if (k === "GO") submitSearch();
                          else setSearchInput((s) => s + k.toLowerCase());
                        }}
                        style={{
                          padding: k.length > 1 ? "8px 14px" : "8px 0",
                          width: k.length > 1 ? undefined : isMobile ? 28 : 36,
                          minWidth: k.length > 1 ? 56 : undefined,
                          flex: k === "SPACE" ? "1 1 120px" : undefined,
                          borderRadius: 8,
                          border: pressedKey === k
                            ? "1px solid rgba(58,167,255,0.7)"
                            : "1px solid rgba(255,255,255,0.12)",
                          background: pressedKey === k
                            ? "rgba(58,167,255,0.35)"
                            : k === "GO" ? "rgba(58,167,255,0.15)" : "rgba(255,255,255,0.06)",
                          color: "white",
                          fontWeight: 800,
                          fontSize: isMobile ? 12 : 14,
                          cursor: "pointer",
                          textAlign: "center",
                          boxShadow: pressedKey === k
                            ? "0 0 12px rgba(58,167,255,0.5), 0 0 24px rgba(58,167,255,0.2)"
                            : "none",
                          transition: "all 0.15s ease",
                          transform: pressedKey === k ? "scale(1.08)" : "scale(1)",
                        }}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ width: "100%", opacity: 0.75, fontWeight: 900, fontSize: 13 }}>
                {searchQuery ? (
                  <>
                    Results: <span style={{ color: "white" }}>{searchResults.length}</span>
                    {searchResults.length === 0 ? <span style={{ marginLeft: 8 }}>No matches. Try another query.</span> : null}
                  </>
                ) : (
                  <>Tip: press Enter to submit.</>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* RAILS */}
        {activeTab === "home" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title="For You" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYou.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Live Now" rightText="See all" onRightClick={() => setOpenSeeAll("live-now")}>
              <CardGrid cards={liveNow.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueWatching.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}

        {activeTab === "live" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title="Live Now" rightText="See all" onRightClick={() => setOpenSeeAll("live-now")}>
              <CardGrid cards={liveNow} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="For You (Sports-weighted)" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYou.filter((c) => !!c.league).slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueWatching.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid
                cards={trending.filter((c) => c.genre === "Sports" || c.genre === "LiveTV").slice(0, 18)}
                cardMinW={density.cardMinW}
                heroH={density.heroH}
                onOpen={openCardAndLog}
                skeleton={loading}
              />
            </Section>
          </div>
        ) : null}

        {activeTab === "favs" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            {/* Favorite Genres filter bar */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.85 }}>Favorite Genres</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(() => {
                  // Show genres from the user's favorite platforms
                  const favGenres = new Set<string>();
                  for (const pid of profile.favoritePlatformIds) {
                    const p = platformById(pid);
                    if (p?.genres) for (const g of p.genres) favGenres.add(g);
                  }
                  const genres = favGenres.size ? [...favGenres].sort() : ["All"];
                  return genres.map((g) => (
                    <PillButton
                      key={`favgenre_${g}`}
                      label={g}
                      active={activeGenre === g}
                      onClick={() => setActiveGenre(activeGenre === g ? "All" : g as GenreKey)}
                    />
                  ));
                })()}
              </div>
            </div>

            {/* Favorite Platforms filter bar */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.85 }}>Favorite Platforms</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <PillButton label="All" active={activePlatform === "all"} onClick={() => setActivePlatform("all")} />
                {profile.favoritePlatformIds.slice(0, 12).map((pid) => {
                  const p = platformById(pid);
                  return (
                    <PillButton
                      key={`favplat_bar_${pid}`}
                      label={p?.label ?? pid}
                      iconSources={platformIconCandidates(pid)}
                      active={activePlatform === pid}
                      onClick={() => setActivePlatform(activePlatform === pid ? "all" : pid)}
                    />
                  );
                })}
              </div>
            </div>

            <Section title="For You" rightText="See all" onRightClick={() => setOpenSeeAll("for-you")}>
              <CardGrid cards={forYouFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Live Now" rightText="See all" onRightClick={() => setOpenSeeAll("live-now")}>
              <CardGrid cards={liveFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Continue Watching" rightText="See all" onRightClick={() => setOpenSeeAll("continue")}>
              <CardGrid cards={continueFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trendingFavs.slice(0, 10)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Black Media Preview" rightText="See all" onRightClick={() => setOpenSeeAll("black-media")}>
              <CardGrid cards={blackMediaCards} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}

        {activeTab === "search" ? (
          <div style={{ display: "grid", gap: density.gap }}>
            <Section title={searchQuery ? `Results for “${searchQuery}”` : "Search Preview"} rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={searchResults} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>

            <Section title="Trending" rightText="See all" onRightClick={() => setOpenSeeAll("trending")}>
              <CardGrid cards={trending.slice(0, 18)} cardMinW={density.cardMinW} heroH={density.heroH} onOpen={openCardAndLog} skeleton={loading} />
            </Section>
          </div>
        ) : null}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          paddingLeft: density.pad,
          paddingRight: density.pad,
          paddingTop: density.pad,
          paddingBottom: "max(env(safe-area-inset-bottom), 10px)",
          borderTop: "1px solid var(--stroke)",
          background: "rgba(0,0,0,0.60)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          className="ampere-footer-bar"
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: isMobile ? 6 : 10,
          }}
        >
          <PillButton label="HOME" iconNode={<SmartImg sources={_footerIcon("home")} size={20} rounded={0} border={false} fit="contain" fallbackText="" />} active={activeTab === "home"} onClick={() => setActiveTab("home")} fullWidth ariaLabel="Home tab" />
          <PillButton label="LIVE" iconNode={<SmartImg sources={_footerIcon("livetv")} size={20} rounded={0} border={false} fit="contain" fallbackText="" />} active={activeTab === "live"} onClick={() => setActiveTab("live")} fullWidth ariaLabel="Live tab" />
          <PillButton label="FAVS" iconNode={<SmartImg sources={_footerIcon("favs")} size={20} rounded={0} border={false} fit="contain" fallbackText="" />} active={activeTab === "favs"} onClick={() => setActiveTab("favs")} fullWidth ariaLabel="Favs tab" />
          <PillButton label="SEARCH" iconNode={<SmartImg sources={_footerIcon("search")} size={20} rounded={0} border={false} fit="contain" fallbackText="" />} active={activeTab === "search"} onClick={() => setActiveTab("search")} fullWidth ariaLabel="Search tab" />
        </div>
      </footer>

      {/* =========================
         MODALS
         ========================= */}

      <Modal
        open={isRailSeeAll}
        title={
          openSeeAll === "for-you"
            ? "See All — For You"
            : openSeeAll === "live-now"
            ? "See All — Live Now"
            : openSeeAll === "continue"
            ? "See All — Continue"
            : openSeeAll === "black-media"
            ? "See All — Black Media"
            : "See All — Trending"
        }
        onClose={() => setOpenSeeAll(null)}
      >
        <PagedCardGrid cards={seeAllItems} cardMinW={density.cardMinW} heroH={Math.max(100, density.heroH + 12)} onOpen={openCardAndLog} />
      </Modal>

      {/* Genre modal */}
      <Modal open={openSeeAll === "Genre"} title="See All — Genre" onClose={() => setOpenSeeAll(null)} maxWidth={920}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950, opacity: 0.92 }}>
              Current: <span style={{ color: "white" }}>{activeGenre === "All" ? "Any" : activeGenre}</span>
            </div>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setActiveGenre("All");
                setOpenSeeAll(null);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.10)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Clear (Any)
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(210px, 100%), 1fr))", gap: 10 }}>
            {GENRES.map((g) => (
              <PillButton
                key={g.key}
                label={g.key}
                iconSources={Genre_ICON_CANDIDATES[g.key] ?? []}
                active={activeGenre === g.key}
                onClick={() => {
                  setActiveGenre(g.key);
                  setOpenSeeAll(null);
                }}
                fullWidth
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Platforms modal */}
      <Modal
        open={openSeeAll === "platforms"}
        title={`See All — Platforms (${activeGenre === "All" ? "All" : activeGenre})`}
        onClose={() => setOpenSeeAll(null)}
        maxWidth={980}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950, opacity: 0.92 }}>
              Current:{" "}
              <span style={{ color: "white" }}>
                {activePlatform === "all" ? "Any" : platformById(activePlatform)?.label ?? activePlatform}
              </span>
            </div>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setActivePlatform("all");
                setOpenSeeAll(null);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.10)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Clear (Any)
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {platformsForGenre(activeGenre)
              .filter((id) => id !== "all" && id !== "livetv")
              .map((id) => platformById(id))
              .filter(Boolean)
              .map((p) => (
                <PillButton
                  key={`seeall_${activeGenre}_${p!.id}`}
                  label={p!.label}
                  iconSources={platformIconCandidates(p!.id)}
                  active={activePlatform === p!.id}
                  onClick={() => {
                    setActivePlatform(p!.id);
                    setOpenSeeAll(null);
                  }}
                  fullWidth
                  multiline
                />
              ))}
          </div>
        </div>
      </Modal>

      {/* Card Details */}
      <Modal open={!!openCard} title={openCard ? openCard.title : "Details"} onClose={() => setOpenCard(null)} maxWidth={980}>
        {openCard ? (
          (() => {
            const pid = openCard.platformId ?? platformIdFromLabel(openCard.platformLabel ?? "") ?? null;
            const platform = pid ? platformById(pid) : null;
            const league = openCard.league ?? "";
            const isFavPlatform = pid ? profile.favoritePlatformIds.includes(pid) : false;
            const isConnected = pid ? !!profile.connectedPlatformIds?.[pid] : false;

            const watermark = pid ? [...platformIconCandidates(pid), ...brandWideCandidates()] : [...brandWideCandidates(), ...brandMarkCandidates()];

            return (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid var(--stroke)",
                    background: "radial-gradient(900px 260px at 30% 0%, rgba(58,167,255,0.18), rgba(0,0,0,0) 60%), rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ position: "relative", height: isMobile ? 160 : 220 }}>
                    <div style={{ position: "absolute", inset: 0, opacity: 0.24 }}>
                      <SmartImg sources={watermark} size={1200} rounded={0} border={false} fit="contain" fill fallbackText="AMPÈRE" />
                    </div>

                    <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {openCard.badge ? (
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.18)",
                            background:
                              openCard.badge === "LIVE"
                                ? "rgba(255,72,72,0.22)"
                                : openCard.badge === "UPCOMING"
                                ? "rgba(58,167,255,0.20)"
                                : "rgba(255,255,255,0.12)",
                            color: "white",
                            fontWeight: 950,
                            fontSize: 12,
                            letterSpacing: 0.6,
                          }}
                        >
                          {openCard.badge}
                        </span>
                      ) : null}

                      {openCard.genre ? (
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.40)",
                            color: "white",
                            fontWeight: 950,
                            fontSize: 12,
                          }}
                        >
                          {openCard.genre}
                        </span>
                      ) : null}
                    </div>

                    <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 10, alignItems: "center" }}>
                      {league ? <SmartImg sources={leagueLogoCandidates(league)} size={32} rounded={12} fit="contain" fallbackText={league.slice(0, 1)} /> : null}
                      {pid ? <SmartImg sources={platformIconCandidates(pid)} size={32} rounded={12} fit="contain" fallbackText={(platform?.label ?? "P")[0]} /> : null}
                      <div style={{ fontWeight: 950, opacity: 0.92 }}>
                        {platform?.label ?? openCard.platformLabel ?? (pid ?? "")}
                        {pid ? (
                          <span style={{ marginLeft: 10, opacity: 0.75, fontWeight: 900, fontSize: 12 }}>
                            {isConnected ? "Connected" : "Not connected (demo)"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 14, display: "grid", gap: 10 }}>
                    {openCard.subtitle ? <div style={{ opacity: 0.82, fontWeight: 900 }}>{openCard.subtitle}</div> : null}

                    {openCard.metaLeft || openCard.metaRight || openCard.startTime || openCard.timeRemaining ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.78, fontWeight: 900, fontSize: 13 }}>
                        {openCard.metaLeft ? <span>{openCard.metaLeft}</span> : null}
                        {openCard.metaRight ? <span>• {openCard.metaRight}</span> : null}
                        {openCard.startTime ? <span>• Starts: {openCard.startTime}</span> : null}
                        {openCard.timeRemaining ? <span>• {openCard.timeRemaining}</span> : null}
                      </div>
                    ) : null}

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <button
                        type="button"
                        className="ampere-focus"
                        onClick={() => openProviderForCard(openCard)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "1px solid rgba(58,167,255,0.22)",
                          background: "rgba(58,167,255,0.12)",
                          color: "white",
                          fontWeight: 950,
                          cursor: "pointer",
                        }}
                      >
                        Open on {platform?.label ?? "Provider"}
                      </button>

                      <button
                        type="button"
                        className="ampere-focus"
                        onClick={() => subscribeProvider(openCard)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          color: "white",
                          fontWeight: 950,
                          cursor: "pointer",
                        }}
                      >
                        Subscribe / Plans
                      </button>

                      {pid ? (
                        <button
                          type="button"
                          className="ampere-focus"
                          onClick={() => {
                            setProfile((prev) => {
                              const exists = prev.favoritePlatformIds.includes(pid);
                              const nextFavs = exists ? prev.favoritePlatformIds.filter((x) => x !== pid) : (uniq([...prev.favoritePlatformIds, pid]) as PlatformId[]);
                              const next: ProfileState = { ...prev, favoritePlatformIds: nextFavs };
                              saveProfile(next);
                              track("favorite_platform_toggle", { platformId: pid, on: !exists });
                              return next;
                            });
                          }}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: "1px solid rgba(58,167,255,0.22)",
                            background: isFavPlatform ? "rgba(58,167,255,0.14)" : "rgba(0,0,0,0.28)",
                            color: "white",
                            fontWeight: 950,
                            cursor: "pointer",
                            gridColumn: isMobile ? "auto" : "1 / -1",
                          }}
                        >
                          {isFavPlatform ? "Remove from Favorite Platforms" : "Add to Favorite Platforms"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </Modal>

      <Modal open={openVoice} title="Voice" onClose={() => setOpenVoice(false)} maxWidth={820}>
        <VoiceCenter
          onCommand={(cmd) => {
            track("voice_command", { cmd });
            const parsed = parseCommand(cmd);
            switch (parsed.kind) {
              case "route":
                if (parsed.route === "home") setActiveTab("home");
                else if (parsed.route === "live") setActiveTab("live");
                else if (parsed.route === "favs") setActiveTab("favs");
                else if (parsed.route === "search") setActiveTab("search");
                else if (parsed.route === "genre") setOpenSeeAll("Genre");
                break;
              case "search":
                setActiveTab("search");
                setSearchInput(parsed.query);
                setSearchQuery(parsed.query);
                break;
              case "openModal":
                if (parsed.modal === "connectPlatforms") setOpenConnect(true);
                else if (parsed.modal === "profileSettings") setOpenProfileSettings(true);
                else if (parsed.modal === "about") setOpenAbout(true);
                else if (parsed.modal === "archive") setOpenArchive(true);
                else if (parsed.modal === "setupWizard") setOpenSetup(true);
                else if (parsed.modal === "appStore") setOpenAppStore(true);
                break;
              case "power":
                if (parsed.value === "off") powerOff();
                else setPowerState("booting");
                break;
              default:
                break;
            }
            setOpenVoice(false);
          }}
        />
      </Modal>

      <Modal open={openRemote} title="Remote" onClose={() => setOpenRemote(false)} maxWidth={820}>
        <RemotePad
          onAction={(a) => {
            track("remote_action", { a });
            if (a === "HOME") setActiveTab("home");
            else if (a === "LIVE") setActiveTab("live");
            else if (a === "FAVS") setActiveTab("favs");
            else if (a === "SEARCH") setActiveTab("search");
            else if (a === "BACK") onBack();
            else if (a === "POWER") powerOff();
            else if (a === "OK") { /* confirm / select current item */ }
          }}
        />
      </Modal>

      <Modal open={openFavorites} title="Favorites" onClose={() => setOpenFavorites(false)} maxWidth={980}>
        <FavoritesEditor
          isMobile={isMobile}
          profile={profile}
          onSave={(next) => {
            const normalized = normalizeProfile(next);
            setProfile(normalized);
            saveProfile(normalized);
            track("favorites_save", {
              platforms: normalized.favoritePlatformIds.length,
              leagues: normalized.favoriteLeagues.length,
              teams: normalized.favoriteTeams.length,
            });
            setOpenFavorites(false);
          }}
        />
      </Modal>

      <Modal open={openNotifications} title="Notifications" onClose={() => setOpenNotifications(false)} maxWidth={900}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Demo toggle (stored locally). In a real product this would schedule push notifications (mobile) or OS-level TV notifications.
          </div>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => {
              setProfile((prev) => {
                const next: ProfileState = { ...prev, notificationsEnabled: !prev.notificationsEnabled };
                saveProfile(next);
                track("notifications_toggle", { on: next.notificationsEnabled });
                return next;
              });
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: profile.notificationsEnabled ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            {profile.notificationsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </Modal>

      <Modal open={openConnect} title="Connect Platforms" onClose={() => setOpenConnect(false)} maxWidth={980}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Click <b>Open</b> or <b>Subscribe</b> to hand off to the provider. When you return, we mark the platform connected (demo).
          </div>

          {/* TV Connect Plan Options */}
          <div style={{ borderRadius: 18, border: "1px solid rgba(58,167,255,0.20)", background: "rgba(58,167,255,0.06)", padding: 14, display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 950, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📡</span> TV Connect Plans
            </div>
            <div style={{ opacity: 0.85, fontWeight: 900, lineHeight: 1.5, fontSize: 13 }}>
              Connect your smart TV for real-time control. Choose the plan that fits your setup.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(min(220px,100%), 1fr))", gap: 10 }}>
              {[
                { name: "Basic", price: "Free", features: ["Web remote control", "Manual platform switching", "Viewing history", "Up to 3 platforms", "Device connection (QR, Hub, Cloud)", "Virtual TV Emulator"], color: "rgba(255,255,255,0.08)" },
                { name: "Pro", price: "$4.99/mo", features: ["InstantSwitch (< 300ms)", "Voice & gesture control", "Unlimited platforms", "Sports Hub + Game Day Mode", "Up to 3 user profiles"], color: "rgba(58,167,255,0.10)" },
                { name: "Family", price: "$7.99/mo", features: ["Everything in Pro", "Multi-profile support", "Two Regional Streaming Platform / Channel Options", "Parental controls + Kid Mode", "$0.99/mo per additional user profile", "Offline cached schedules", "Priority support"], color: "rgba(138,43,226,0.10)" },
                { name: "Premium", price: "$9.99/mo", features: ["Everything in Pro + Family", "Unlimited Regional Streaming Platform / Channel Options", "Additional Ampère Features Free for a year", "Taste Engine + Why This Pick", "Universal Queue + Time-to-Delight", "Context Modes + Remote Scenes", "Trust/Privacy vault + Export"], color: "rgba(255,179,0,0.12)" },
              ].map((plan) => (
                <div
                  key={plan.name}
                  style={{
                    borderRadius: 18,
                    border: plan.name === "Pro" ? "2px solid rgba(58,167,255,0.35)" : "1px solid rgba(255,255,255,0.12)",
                    background: plan.color,
                    padding: 14,
                    display: "grid",
                    gap: 8,
                    position: "relative",
                  }}
                >
                  {plan.name === "Pro" ? (
                    <div style={{ position: "absolute", top: -10, right: 14, padding: "4px 10px", borderRadius: 999, background: "rgba(58,167,255,0.25)", border: "1px solid rgba(58,167,255,0.40)", fontWeight: 950, fontSize: 10, letterSpacing: 1 }}>POPULAR</div>
                  ) : null}
                  <div style={{ fontWeight: 950, fontSize: 18 }}>{plan.name}</div>
                  <div style={{ fontWeight: 950, fontSize: 22, color: "rgba(58,167,255,0.95)" }}>{plan.price}</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontWeight: 900, opacity: 0.85, fontSize: 12, lineHeight: 1.7 }}>
                    {plan.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <button
                    type="button"
                    className="ampere-focus"
                    onClick={() => track("tv_connect_plan_select", { plan: plan.name })}
                    style={{
                      marginTop: 6,
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: plan.name === "Pro" ? "1px solid rgba(58,167,255,0.30)" : "1px solid rgba(255,255,255,0.14)",
                      background: plan.name === "Pro" ? "rgba(58,167,255,0.15)" : "rgba(255,255,255,0.06)",
                      color: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    {plan.price === "Free" ? "Current Plan" : "Select Plan"}
                  </button>
                </div>
              ))}
            </div>

            {/* Ala-Carte Add-Ons */}
            <div style={{ fontWeight: 950, fontSize: 15, marginTop: 8 }}>À La Carte & Add-Ons</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(min(220px,100%), 1fr))", gap: 10 }}>
              {[
                { name: "Solo Plan", price: "$2.99/mo", features: ["1 user profile", "Everything in Pro Plan"], color: "rgba(58,167,255,0.08)" },
                { name: "Family Add-On", price: "$0.99/mo per profile", features: ["$0.99/mo per additional user profile", "Add profiles to any existing plan"], color: "rgba(138,43,226,0.08)" },
                { name: "Game Day Sports Betting", price: "$4.99/mo", features: ["Includes everything in all other plans", "One-tap \"Add Bet\" from any game card", "Bets Drawer — slide-up panel for all active & settled bets", "Quick stake buttons: $5 / $10 / $25 / $50 / $100", "Paste-to-add bet slip (copy from sportsbook)", "Game-linked bet overlay on Live cards", "Smart reminders: tip-off, first pitch, kickoff alerts", "Quick settle + P/L tracking per bet", "Bankroll + session stats dashboard", "Tags & notes per bet (e.g. \"parlay\", \"lock\")", "Clone bet — one-tap re-bet with same or adjusted stake", "Export tools: JSON, CSV, and clipboard"], color: "rgba(0,200,80,0.10)" },
              ].map((addon) => (
                <div key={addon.name} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: addon.color, padding: 14 }}>
                  <div style={{ fontWeight: 950, fontSize: 15, marginBottom: 2 }}>{addon.name}</div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "rgba(58,167,255,1)", marginBottom: 6 }}>{addon.price}</div>
                  {addon.features.map((f, i) => <div key={i} style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>• {f}</div>)}
                </div>
              ))}
            </div>

            <div style={{ opacity: 0.70, fontWeight: 900, fontSize: 11, lineHeight: 1.5 }}>
              <b>Architecture:</b> Native companion app uses mDNS/SSDP for TV discovery, CEC/eARC for control, vendor APIs (WebOS, Tizen, Android TV, tvOS), or a local hub device. OAuth 2.0 + secure credential vault for platform auth.
            </div>
          </div>

          {/* Platform Grid */}
          <div style={{ fontWeight: 950, fontSize: 16 }}>All Platforms ({ALL_PLATFORM_IDS.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 10 }}>
            {ALL_PLATFORM_IDS.map((pid) => {
              const p = platformById(pid);
              const on = !!profile.connectedPlatformIds?.[pid];
              return (
                <div
                  key={`conn_${pid}`}
                  style={{
                    borderRadius: 18,
                    border: on ? "1px solid rgba(58,167,255,0.22)" : "1px solid rgba(255,255,255,0.12)",
                    background: on ? "rgba(58,167,255,0.04)" : "rgba(255,255,255,0.04)",
                    padding: 12,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <SmartImg sources={platformIconCandidates(pid)} size={34} rounded={12} fit="contain" fallbackText={(p?.label ?? pid)[0]} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, opacity: 0.94, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p?.label ?? pid}</div>
                      <div style={{ fontWeight: 900, opacity: on ? 0.9 : 0.6, fontSize: 12 }}>{on ? "Connected" : "Not connected"}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      type="button"
                      className="ampere-focus"
                      onClick={() => openPlatformHandoff(pid, "open")}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(58,167,255,0.22)",
                        background: "rgba(58,167,255,0.12)",
                        color: "white",
                        fontWeight: 950,
                        cursor: "pointer",
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="ampere-focus"
                      onClick={() => openPlatformHandoff(pid, "subscribe")}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        fontWeight: 950,
                        cursor: "pointer",
                      }}
                    >
                      Subscribe
                    </button>
                  </div>

                  <button
                    type="button"
                    className="ampere-focus"
                    onClick={() => toggleConnected(pid)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: on ? "rgba(58,167,255,0.10)" : "rgba(0,0,0,0.22)",
                      color: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                    }}
                  >
                    {on ? "Mark Disconnected" : "Mark Connected"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {openAbout && <AboutSection onClose={() => setOpenAbout(false)} />}

      <Modal open={openArchive} title="Archive" onClose={() => setOpenArchive(false)} maxWidth={980}>
        <ArchiveContent />
      </Modal>

      {/* Switch Profile Modal */}
      <Modal open={openSwitchProfile} title="Switch Profile" onClose={() => setOpenSwitchProfile(false)} maxWidth={600}>
        <SwitchProfileContent
          currentName={profile.name}
          onSwitch={(name) => {
            const next = normalizeProfile({ ...profile, name });
            setProfile(next);
            saveProfile(next);
            track("profile_switch", { name });
            setOpenSwitchProfile(false);
            // If switching to Kids profile, activate Kid Mode genre filtering
            if (name.toLowerCase() === "kids") {
              setActiveGenre("Kids");
            }
          }}
          onClose={() => setOpenSwitchProfile(false)}
          onCreateNew={() => { setOpenSwitchProfile(false); setOpenSetup(true); }}
        />
      </Modal>

      {/* Kid Mode Modal */}
      <Modal open={openKidMode} title="Kid Mode" onClose={() => setOpenKidMode(false)} maxWidth={800}>
        <KidModeContent
          onActivate={() => {
            track("kid_mode_activate", {});
            setOpenKidMode(false);
          }}
          onClose={() => setOpenKidMode(false)}
        />
      </Modal>

      {/* TV Brand Connection Modal */}
      <Modal open={openTVBrand} title="TV Connection" onClose={() => setOpenTVBrand(false)} maxWidth={700}>
        <TVBrandContent onClose={() => setOpenTVBrand(false)} />
      </Modal>

      {/* InnovationSuite Modals */}
      <Modal open={openPremiumHub} title="Premium Hub" onClose={() => setOpenPremiumHub(false)} maxWidth={800}>
        <PremiumHubContent onOpenPricing={() => { setOpenPremiumHub(false); setOpenPricing(true); }} />
      </Modal>

      <Modal open={openPricing} title="Pricing" onClose={() => setOpenPricing(false)} maxWidth={900}>
        <PricingContent onSelect={(tier: PlanTier) => { setPlanState(tier); }} />
      </Modal>

      {/* Taste Engine Hub — all premium features route through this */}
      <Modal open={openTasteEngine || openModes || openRemoteScenes || openConnectLadder || openLivePulse || openUniversalQueue || openTimeToDelight || openFamilyProfiles} title="Taste Engine" onClose={() => { setOpenTasteEngine(false); setOpenModes(false); setOpenRemoteScenes(false); setOpenConnectLadder(false); setOpenLivePulse(false); setOpenUniversalQueue(false); setOpenTimeToDelight(false); setOpenFamilyProfiles(false); }} maxWidth={900}>
        <TasteEngineHub
          locked={!isPremiumUser()}
          onUpgrade={() => { setOpenTasteEngine(false); setOpenModes(false); setOpenRemoteScenes(false); setOpenConnectLadder(false); setOpenLivePulse(false); setOpenUniversalQueue(false); setOpenTimeToDelight(false); setOpenFamilyProfiles(false); setOpenPricing(true); }}
          initialTab={openModes ? "modes" : openRemoteScenes ? "scenes" : openConnectLadder ? "connect" : openLivePulse ? "livepulse" : openUniversalQueue ? "queue" : openTimeToDelight ? "delight" : openFamilyProfiles ? "family" : "taste"}
        />
      </Modal>

      {/* Trust & Privacy — also accessible from Settings dropdown directly */}
      <Modal open={openTrustPortability} title="Trust & Privacy" onClose={() => setOpenTrustPortability(false)} maxWidth={800}>
        <TrustPortabilityContent locked={!isPremiumUser()} onUpgrade={() => { setOpenTrustPortability(false); setOpenPricing(true); }} />
      </Modal>

      <Modal open={openSocial} title="Social" onClose={() => setOpenSocial(false)} maxWidth={800}>
        <SocialContent locked={!isPremiumUser()} onUpgrade={() => { setOpenSocial(false); setOpenPricing(true); }} />
      </Modal>

      <Modal open={openSemanticSearch} title="Semantic Search" onClose={() => setOpenSemanticSearch(false)} maxWidth={800}>
        <SemanticSearchContent locked={!isPremiumUser()} onUpgrade={() => { setOpenSemanticSearch(false); setOpenPricing(true); }} />
      </Modal>

      <Modal open={openAddDevice} title="Add Device" onClose={() => setOpenAddDevice(false)} maxWidth={800}>
        <AddDeviceContent />
      </Modal>

      <Modal open={openVirtualEmulator} title="Virtual TV Emulator" onClose={() => setOpenVirtualEmulator(false)} maxWidth={800}>
        <VirtualEmulatorContent />
      </Modal>

      <Modal open={openBettingCompanion} title="Betting Companion" onClose={() => setOpenBettingCompanion(false)} maxWidth={800}>
        <BettingCompanionContent locked={!canAccessFeature("premium_hub")} onUpgrade={() => { setOpenBettingCompanion(false); setOpenPricing(true); }} />
      </Modal>

      {/* App Store Modal */}
      <Modal open={openAppStore} title="App Store" onClose={() => setOpenAppStore(false)} maxWidth={980}>
        <AppStoreContent isMobile={isMobile} connectedPlatformIds={profile.connectedPlatformIds} onInstall={(pid: string) => {
          toggleConnected(pid, true);
          track("appstore_install", { platformId: pid });
        }} />
      </Modal>

      <Modal open={openProfileSettings} title="Profile Settings" onClose={() => setOpenProfileSettings(false)} maxWidth={820}>
        <ProfileSettingsContent
          profile={profile}
          onSave={(next) => {
            const normalized = normalizeProfile(next);
            setProfile(normalized);
            saveProfile(normalized);
            track("profile_save", {});
            setOpenProfileSettings(false);
          }}
          onPickAvatar={() => avatarInputRef.current?.click()}
          onPickHeader={() => headerInputRef.current?.click()}
        />
      </Modal>

      <Modal open={openSetup} title={`Set-Up Wizard — Step ${setupStep} of 6`} onClose={() => setOpenSetup(false)} maxWidth={980}>
        <SetupWizardContent
          isMobile={isMobile}
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          draftName={draftName}
          setDraftName={setDraftName}
          draftRegion={draftRegion}
          setDraftRegion={setDraftRegion}
          draftRegions={draftRegions}
          setDraftRegions={setDraftRegions}
          draftLanguage={draftLanguage}
          setDraftLanguage={setDraftLanguage}
          draftPlatforms={draftPlatforms}
          setDraftPlatforms={setDraftPlatforms}
          draftLeagues={draftLeagues}
          setDraftLeagues={setDraftLeagues}
          draftTeams={draftTeams}
          setDraftTeams={setDraftTeams}
          wizShownByLeague={wizShownByLeague}
          setWizShownByLeague={setWizShownByLeague}
          wizTeamSearch={wizTeamSearch}
          setWizTeamSearch={setWizTeamSearch}
          wizPlatShown={wizPlatShown}
          setWizPlatShown={setWizPlatShown}
          canNext={canNextWizard()}
          onFinish={finishWizard}
          onStartOver={() => {
            clearWizardDraft();
            setSetupStep(1);
            setDraftName(profile.name);
            setDraftRegion("north_america");
            setDraftLanguage("en");
            setDraftPlatforms(profile.favoritePlatformIds);
            setDraftLeagues(profile.favoriteLeagues);
            setDraftTeams(profile.favoriteTeams);
            setWizTeamSearch("");
            track("wizard_start_over", {});
          }}
        />

      </Modal>
    </div>
  );
}

/* =========================
   Helper components
   ========================= */

function ProfileSettingsContent({
  profile,
  onSave,
  onPickAvatar,
  onPickHeader,
}: {
  profile: ProfileState;
  onSave: (next: ProfileState) => void;
  onPickAvatar: () => void;
  onPickHeader: () => void;
}) {
  const [name, setName] = useState(profile.name);

  useEffect(() => setName(profile.name), [profile.name]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.78, fontWeight: 900 }}>Update your profile details (stored locally in this demo).</div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="ampere-focus"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--stroke2)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
            fontWeight: 900,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={onPickAvatar}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Upload Avatar
        </button>
        <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 900 }}>Recommended: 400 × 400 px</div>

        <button
          type="button"
          className="ampere-focus"
          onClick={onPickHeader}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Upload Header
        </button>
        <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 900 }}>Recommended: 1500 × 500 px</div>

        <button
          type="button"
          className="ampere-focus"
          onClick={() => onSave({ ...profile, profilePhoto: null })}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.28)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear Avatar
        </button>

        <button
          type="button"
          className="ampere-focus"
          onClick={() => onSave({ ...profile, headerPhoto: null })}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.28)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear Header
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => onSave({ ...profile, name: name.trim() ? name.trim() : profile.name })}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.12)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ArchiveContent() {
  const [viewing, setViewing] = useState<ViewingEvent[]>([]);
  const [attrib, setAttrib] = useState<AttributionEvent[]>([]);

  useEffect(() => {
    setViewing(loadViewing().slice().reverse());
    setAttrib(loadAttribution().slice().reverse());
  }, []);

  const exportJson = (obj: any, filename: string) => {
    if (typeof window === "undefined") return;
    try {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.78, fontWeight: 900 }}>Local demo archive: viewing history + attribution/telemetry events.</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => exportJson({ viewing }, "ampere_viewing.json")}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.10)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Export Viewing
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => exportJson({ attribution: attrib }, "ampere_attribution.json")}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.10)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Export Attribution
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => {
            saveViewing([]);
            saveAttribution([]);
            setViewing([]);
            setAttrib([]);
            track("archive_cleared", {});
          }}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear Archive
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 950 }}>Viewing History</div>
          {!viewing.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No viewing events yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {viewing.slice(0, 30).map((v, i) => (
                <div key={`${v.id}_${i}`} style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)" }}>
                  <div style={{ fontWeight: 950, opacity: 0.94 }}>{v.title}</div>
                  <div style={{ opacity: 0.70, fontWeight: 900, fontSize: 12 }}>
                    {v.platformId ? platformById(v.platformId)?.label ?? v.platformId : "—"} {v.league ? `• ${v.league}` : ""} • {v.at}
                  </div>
                </div>
              ))}
              {viewing.length > 30 ? <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>Showing 30 of {viewing.length}.</div> : null}
            </div>
          )}
        </div>

        <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 950 }}>Attribution / Telemetry</div>
          {!attrib.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No attribution events yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {attrib.slice(0, 30).map((a, i) => (
                <div key={`${a.at}_${i}`} style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)" }}>
                  <div style={{ fontWeight: 950, opacity: 0.94 }}>{a.event}</div>
                  <div style={{ opacity: 0.70, fontWeight: 900, fontSize: 12 }}>
                    {a.at} • session {a.sessionId}
                  </div>
                  <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", opacity: 0.82, fontWeight: 900, fontSize: 12 }}>
                    {JSON.stringify(a.props, null, 2)}
                  </pre>
                </div>
              ))}
              {attrib.length > 30 ? <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>Showing 30 of {attrib.length}.</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   TV Brand Connection
   ========================= */

const TV_BRANDS = [
  { id: "samsung", name: "Samsung", features: ["SmartThings", "Tizen OS", "Multi-View", "Ambient Mode"] },
  { id: "lg", name: "LG", features: ["webOS", "ThinQ AI", "Magic Remote", "Gallery Mode"] },
  { id: "sony", name: "Sony", features: ["Google TV", "BRAVIA CORE", "Acoustic Surface", "PS5 Link"] },
  { id: "tcl", name: "TCL", features: ["Google TV", "Roku TV", "AIPQ Engine", "Game Master"] },
  { id: "hisense", name: "Hisense", features: ["VIDAA", "Google TV", "ULED", "Game Mode Pro"] },
  { id: "vizio", name: "VIZIO", features: ["SmartCast", "AirPlay 2", "HomeKit", "WatchFree+"] },
  { id: "roku", name: "Roku TV", features: ["Roku OS", "The Roku Channel", "Voice Remote Pro", "HomeKit"] },
  { id: "fire", name: "Fire TV (Amazon)", features: ["Fire OS", "Alexa", "Luna Gaming", "Ring Integration"] },
  { id: "appletv", name: "Apple TV", features: ["tvOS", "AirPlay", "SharePlay", "HomeKit Hub"] },
  { id: "chromecast", name: "Chromecast / Google TV", features: ["Google TV", "Ambient Mode", "Cast", "Google Home"] },
  { id: "philips", name: "Philips", features: ["Android TV", "Ambilight", "Google Assistant", "DTS Play-Fi"] },
  { id: "panasonic", name: "Panasonic", features: ["My Home Screen", "HCX Pro AI", "Filmmaker Mode"] },
];

function TVBrandContent({ onClose }: { onClose: () => void }) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const brand = TV_BRANDS.find((b) => b.id === selectedBrand);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Connect AMPERE to your television for CEC control, deep-link launching, and casting.
      </div>

      <div style={{ fontWeight: 950 }}>Select your TV brand</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
        {TV_BRANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className="ampere-focus"
            onClick={() => { setSelectedBrand(b.id); setConnected(false); }}
            style={{
              padding: "14px 10px",
              borderRadius: 16,
              border: selectedBrand === b.id ? "2px solid rgba(58,167,255,0.7)" : "1px solid rgba(255,255,255,0.12)",
              background: selectedBrand === b.id ? "rgba(58,167,255,0.28)" : "rgba(255,255,255,0.04)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
              textAlign: "center",
              fontSize: 13,
            }}
          >
            {b.name}
          </button>
        ))}
      </div>

      {brand ? (
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 16, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{brand.name}</div>
          <div style={{ fontWeight: 900, opacity: 0.8, fontSize: 13 }}>Supported features:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {brand.features.map((f) => (
              <span key={f} style={{ padding: "6px 10px", borderRadius: 10, background: "rgba(58,167,255,0.12)", border: "1px solid rgba(58,167,255,0.22)", fontWeight: 900, fontSize: 12 }}>{f}</span>
            ))}
          </div>

          {connected ? (
            <div style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.30)", fontWeight: 950, textAlign: "center" }}>
              Connected to {brand.name}
            </div>
          ) : (
            <button
              type="button"
              className="ampere-focus"
              onClick={() => setConnected(true)}
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid rgba(58,167,255,0.22)",
                background: "rgba(58,167,255,0.18)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Connect to {brand.name}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

const APP_STORE_EXTRAS: Platform[] = [
  // Local Stations
  { id: "abclocal", label: "ABC Local", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "cbslocal", label: "CBS Local", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "nbclocal", label: "NBC Local", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "foxlocal", label: "FOX Local", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "pbslocal", label: "PBS Local Stations", kind: "livetv", genres: ["LiveTV", "Free", "Documentaries"] },
  { id: "theweatherchannel", label: "The Weather Channel", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "newsmax", label: "Newsmax", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "comet", label: "Comet TV", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "courttv", label: "Court TV", kind: "livetv", genres: ["LiveTV", "Free"] },
  { id: "ion", label: "ION Television", kind: "livetv", genres: ["LiveTV", "Free"] },
  // Lifestyle
  { id: "discoveryplus", label: "Discovery+", kind: "streaming", genres: ["Basic", "Documentaries"] },
  { id: "magnolia", label: "Magnolia Network", kind: "streaming", genres: ["Basic"] },
  { id: "foodnetwork", label: "Food Network", kind: "streaming", genres: ["Basic"] },
  { id: "hgtv", label: "HGTV", kind: "streaming", genres: ["Basic"] },
  { id: "tlc", label: "TLC", kind: "streaming", genres: ["Basic"] },
  { id: "hallmark", label: "Hallmark Movies Now", kind: "streaming", genres: ["Movies"] },
  { id: "gaia", label: "Gaia", kind: "niche", genres: ["Documentaries"] },
  { id: "tastemade", label: "Tastemade", kind: "streaming", genres: ["Free"] },
  { id: "peloton", label: "Peloton", kind: "niche", genres: ["Basic"] },
  { id: "beachbod", label: "BODi (Beachbody)", kind: "niche", genres: ["Basic"] },
  // Music & Audio
  { id: "spotify", label: "Spotify", kind: "streaming", genres: ["Free"] },
  { id: "tidalapp", label: "TIDAL", kind: "streaming", genres: ["Premium"] },
  { id: "pandora", label: "Pandora", kind: "streaming", genres: ["Free"] },
  { id: "iheartradio", label: "iHeartRadio", kind: "streaming", genres: ["Free"] },
  // Education
  { id: "masterclass", label: "MasterClass", kind: "niche", genres: ["Documentaries"] },
  { id: "skillshare", label: "Skillshare", kind: "niche", genres: ["Documentaries"] },
  { id: "curiouscast", label: "CuriosityStream", kind: "niche", genres: ["Documentaries"] },
];

function AppStoreContent({ isMobile, onInstall, connectedPlatformIds }: { isMobile: boolean; onInstall: (pid: string) => void; connectedPlatformIds?: Partial<Record<string, boolean>> }) {
  const [search, setSearch] = useState("");
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showInstalled, setShowInstalled] = useState(false);

  // 2 rows max: mobile=2 cols, desktop=3 cols
  const defaultVisible = isMobile ? 4 : 6;

  const allApps = useMemo(() => [...PLATFORMS, ...APP_STORE_EXTRAS], []);

  // Build set of already-connected/installed platform IDs
  const alreadyConnected = useMemo(() => {
    const s = new Set<string>();
    if (connectedPlatformIds) { for (const [k, v] of Object.entries(connectedPlatformIds)) { if (v) s.add(k); } }
    return s;
  }, [connectedPlatformIds]);

  // Build set of local platform ids for the selected region
  const regionLocalIds = useMemo(() => {
    if (regionFilter === "all") return null;
    const region = GLOBAL_REGIONS.find((r) => r.id === regionFilter);
    return region ? new Set([...region.popularPlatforms, ...region.localPlatforms]) : null;
  }, [regionFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...allApps].sort((a, b) => a.label.localeCompare(b.label));
    // Filter out already-installed apps unless user toggles "show installed"
    if (!showInstalled) {
      list = list.filter((p) => !alreadyConnected.has(p.id) && !installedIds.has(p.id));
    }
    if (regionLocalIds) {
      list = list.filter((p) => regionLocalIds.has(p.id));
    }
    if (!q) return list;
    return list.filter(
      (p) => p.label.toLowerCase().includes(q) || (p.kind ?? "").includes(q) || (p.genres ?? []).some((g) => g.toLowerCase().includes(q))
    );
  }, [search, allApps, regionLocalIds, alreadyConnected, installedIds, showInstalled]);

  const categories = useMemo(() => {
    const cats: Record<string, Platform[]> = {};
    for (const p of filtered) {
      const cat = p.kind === "sports" ? "Sports" : p.kind === "kids" ? "Kids & Family" : p.kind === "gaming" ? "Gaming" : p.kind === "livetv" ? "Live TV & Local Stations" : p.kind === "niche" ? "Specialty & Lifestyle" : "Streaming";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(p);
    }
    return cats;
  }, [filtered]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
          Browse and install streaming apps not yet on your home screen.{alreadyConnected.size > 0 ? ` (${alreadyConnected.size} already installed)` : ""}
        </div>
        <button type="button" onClick={() => setShowInstalled(!showInstalled)} style={{ padding: "6px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: showInstalled ? "rgba(58,167,255,0.15)" : "rgba(255,255,255,0.06)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 11 }}>
          {showInstalled ? "Hide Installed" : "Show Installed"}
        </button>
      </div>

      {/* Region filter tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => setRegionFilter("all")}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: regionFilter === "all" ? "2px solid rgba(58,167,255,0.7)" : "1px solid rgba(255,255,255,0.14)",
            background: regionFilter === "all" ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.04)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          All Regions
        </button>
        {GLOBAL_REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="ampere-focus"
            onClick={() => setRegionFilter(r.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: regionFilter === r.id ? "2px solid rgba(58,167,255,0.7)" : "1px solid rgba(255,255,255,0.14)",
              background: regionFilter === r.id ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.04)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {r.emoji} {r.name}
          </button>
        ))}
      </div>

      <QwertyKeyboard
        value={search}
        onChange={setSearch}
        isMobile={isMobile}
        placeholder="Search apps by name, category, or genre..."
      />

      <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>
        Showing {filtered.length} app(s){regionFilter !== "all" ? ` for ${GLOBAL_REGIONS.find((r) => r.id === regionFilter)?.name ?? regionFilter}` : ""}
      </div>

      {Object.entries(categories).map(([cat, platforms]) => {
        const isExpanded = expandedCats.has(cat);
        const visible = isExpanded ? platforms : platforms.slice(0, defaultVisible);
        const hasMore = platforms.length > defaultVisible && !isExpanded;
        return (
          <div key={cat} style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>{cat} ({platforms.length})</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${isMobile ? 140 : 220}px, 100%), 1fr))`, gap: 10 }}>
              {visible.map((p) => {
                const justInstalled = installedIds.has(p.id);
                return (
                  <div
                    key={`appstore_${p.id}`}
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <SmartImg sources={platformIconCandidates(p.id)} size={36} rounded={12} fit="contain" fallbackText={p.label[0]} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, opacity: 0.94, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.label}</div>
                        <div style={{ fontWeight: 900, opacity: 0.6, fontSize: 11 }}>{p.kind ?? "streaming"} {p.genres?.length ? `• ${p.genres[0]}` : ""}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ampere-focus"
                      onClick={() => {
                        onInstall(p.id);
                        setInstalledIds((prev) => new Set([...prev, p.id]));
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: justInstalled ? "1px solid rgba(58,167,255,0.30)" : "1px solid rgba(255,255,255,0.14)",
                        background: justInstalled ? "rgba(58,167,255,0.28)" : "rgba(255,255,255,0.06)",
                        color: "white",
                        fontWeight: 950,
                        cursor: "pointer",
                      }}
                    >
                      {justInstalled ? "Installed" : "Install"}
                    </button>
                  </div>
                );
              })}
            </div>
            {hasMore ? (
              <button
                type="button"
                className="ampere-focus menu-item-glow"
                onClick={() => setExpandedCats((prev) => new Set([...prev, cat]))}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(58,167,255,0.22)",
                  background: "rgba(58,167,255,0.10)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                  width: "fit-content",
                }}
              >
                Load More ({visible.length}/{platforms.length})
              </button>
            ) : null}
          </div>
        );
      })}

      {!filtered.length ? (
        <div style={{ opacity: 0.75, fontWeight: 900, padding: 20, textAlign: "center" }}>No apps match your search.</div>
      ) : null}
    </div>
  );
}

/* =========================
   Switch Profile (PIN-protected)
   ========================= */

const DEMO_PROFILES = [
  { id: "main", name: "Main", avatar: "", pin: "1234", role: "parent" as const },
  { id: "partner", name: "Partner", avatar: "", pin: "5678", role: "parent" as const },
  { id: "kids", name: "Kids", avatar: "", pin: "", role: "child" as const },
  { id: "guest", name: "Guest", avatar: "", pin: "", role: "viewer" as const },
];

function SwitchProfileContent({
  currentName,
  onSwitch,
  onClose,
  onCreateNew,
}: {
  currentName: string;
  onSwitch: (name: string) => void;
  onClose: () => void;
  onCreateNew?: () => void;
}) {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const selected = DEMO_PROFILES.find((p) => p.id === selectedProfile);
  const needsPin = selected && selected.pin.length > 0;

  const handlePinSubmit = () => {
    if (!selected) return;
    if (selected.pin && pinInput !== selected.pin) {
      setPinError(true);
      setPinInput("");
      return;
    }
    onSwitch(selected.name);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Who&apos;s watching? Select a profile to switch. PIN-protected profiles require entry.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
        {DEMO_PROFILES.map((p, _idx) => {
          const isCurrent = p.name.toLowerCase() === currentName.toLowerCase();
          const isSelected = selectedProfile === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className="ampere-focus"
              onClick={() => {
                setSelectedProfile(p.id);
                setPinInput("");
                setPinError(false);
              }}
              style={{
                padding: 16,
                borderRadius: 18,
                border: isSelected ? "2px solid rgba(58,167,255,0.7)" : "1px solid rgba(255,255,255,0.12)",
                background: isSelected ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.04)",
                color: "white",
                fontWeight: 950,
                cursor: "pointer",
                textAlign: "center",
                display: "grid",
                gap: 8,
                opacity: isCurrent ? 0.5 : 1,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(58,167,255,0.18)", display: "grid", placeItems: "center", margin: "0 auto", fontWeight: 950, fontSize: 20 }}>
                {p.name[0]}
              </div>
              <div style={{ fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                {isCurrent ? "Current" : p.pin ? "PIN" : p.role}
              </div>
            </button>
          );
        })}
        {/* Create New Profile */}
        {onCreateNew && (
          <button type="button" className="ampere-focus" onClick={onCreateNew} style={{ padding: 16, borderRadius: 18, border: "1px dashed rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.02)", color: "white", fontWeight: 950, cursor: "pointer", textAlign: "center", display: "grid", gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(58,167,255,0.12)", display: "grid", placeItems: "center", margin: "0 auto", fontWeight: 950, fontSize: 24 }}>+</div>
            <div style={{ fontSize: 14 }}>New Profile</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Set-Up Wizard</div>
          </button>
        )}
      </div>

      {selectedProfile && needsPin ? (
        <div style={{ display: "grid", gap: 10, borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 16 }}>
          <div style={{ fontWeight: 950 }}>Enter PIN for {selected?.name}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 14,
                  border: pinError ? "2px solid rgba(255,60,60,0.6)" : "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.35)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  fontWeight: 950,
                  color: "white",
                }}
              >
                {pinInput[i] ? "\u2022" : ""}
              </div>
            ))}
          </div>
          {pinError ? (
            <div style={{ color: "rgba(255,80,80,0.9)", fontWeight: 900, fontSize: 13, textAlign: "center" }}>
              Incorrect PIN. Try again.
            </div>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, maxWidth: 240, margin: "0 auto" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key) => (
              <button
                key={`pin_${key}`}
                type="button"
                className="ampere-focus"
                onClick={() => {
                  if (key === null) return;
                  if (key === "del") { setPinInput((prev) => prev.slice(0, -1)); setPinError(false); return; }
                  if (pinInput.length >= 4) return;
                  const next = pinInput + String(key);
                  setPinInput(next);
                  setPinError(false);
                  // Auto-submit when 4 digits entered
                  if (next.length === 4 && selected) {
                    if (next === selected.pin) { onSwitch(selected.name); }
                    else { setPinError(true); setPinInput(""); }
                  }
                }}
                disabled={key === null}
                style={{
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: key === null ? "transparent" : "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  fontSize: 18,
                  cursor: key === null ? "default" : "pointer",
                  visibility: key === null ? "hidden" : "visible",
                }}
              >
                {key === "del" ? "\u232b" : key}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selectedProfile && !needsPin ? (
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => selected && onSwitch(selected.name)}
            style={{
              padding: "12px 20px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: "rgba(58,167,255,0.14)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            Switch to {selected?.name}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   Kid Mode
   ========================= */

function KidModeContent({
  onActivate,
  onClose,
}: {
  onActivate: () => void;
  onClose: () => void;
}) {
  const [pinInput, setPinInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const parentPin = "1234"; // Demo PIN

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {!confirmed ? (
        <>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Kid Mode provides a simplified, safe browsing experience with age-appropriate content only.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ borderRadius: 18, border: "1px solid rgba(58,167,255,0.18)", background: "rgba(58,167,255,0.06)", padding: 16, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>What changes</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontWeight: 900, opacity: 0.85, lineHeight: 1.8, fontSize: 13 }}>
                <li>Simplified navigation (3 tabs)</li>
                <li>Large, colorful tiles</li>
                <li>No search keyboard</li>
                <li>Content filtered to G/PG only</li>
                <li>No purchase/subscribe buttons</li>
              </ul>
            </div>
            <div style={{ borderRadius: 18, border: "1px solid rgba(138,43,226,0.18)", background: "rgba(138,43,226,0.06)", padding: 16, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>Parental controls</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontWeight: 900, opacity: 0.85, lineHeight: 1.8, fontSize: 13 }}>
                <li>PIN required to exit</li>
                <li>Screen time limits</li>
                <li>Activity log visible to parents</li>
                <li>Bedtime auto-lock</li>
                <li>Content whitelist support</li>
              </ul>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Time limit</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["30 min", "1 hour", "2 hours", "No limit"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className="ampere-focus"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: t === "1 hour" ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.04)",
                    color: "white",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="ampere-focus"
            onClick={() => setConfirmed(true)}
            style={{
              padding: "14px 20px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: "rgba(58,167,255,0.14)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Activate Kid Mode
          </button>
        </>
      ) : (
        <div style={{ display: "grid", gap: 14, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 48 }}>&#x1F476;</div>
          <div style={{ fontWeight: 950, fontSize: 20 }}>Kid Mode Active</div>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            The interface has been simplified for children. Enter the parent PIN to exit Kid Mode.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.35)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  fontWeight: 950,
                  color: "white",
                }}
              >
                {pinInput[i] ? "\u2022" : ""}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, maxWidth: 240, margin: "0 auto" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key) => (
              <button
                key={`kidpin_${key}`}
                type="button"
                className="ampere-focus"
                onClick={() => {
                  if (key === null) return;
                  if (key === "del") { setPinInput((prev) => prev.slice(0, -1)); return; }
                  if (pinInput.length >= 4) return;
                  const next = pinInput + String(key);
                  setPinInput(next);
                  if (next.length === 4) {
                    if (next === parentPin) { onActivate(); }
                    else { setPinInput(""); }
                  }
                }}
                disabled={key === null}
                style={{
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: key === null ? "transparent" : "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 950,
                  fontSize: 18,
                  cursor: key === null ? "default" : "pointer",
                  visibility: key === null ? "hidden" : "visible",
                }}
              >
                {key === "del" ? "\u232b" : key}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ampere-focus"
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function AboutContent() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Hero banner with logo */}
      <div style={{ display: "grid", placeItems: "center", padding: "12px 0" }}>
        <div style={{ width: "min(400px, 90%)", height: 50 }}>
          <SmartImg sources={brandWideCandidates()} size={900} rounded={0} border={false} fit="contain" fill fallbackText="AMPERE" />
        </div>
      </div>

      <div style={{ fontWeight: 950, fontSize: 22, textAlign: "center" }}>Choice & Control \u2013 Simplified.</div>

      {/* Image placeholder slots */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", height: 120, display: "grid", placeItems: "center" }}>
          <SmartImg sources={brandMarkCandidates()} size={80} rounded={18} border={false} fit="contain" fallbackText="A" />
        </div>
        <div style={{ borderRadius: 18, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", height: 120, display: "grid", placeItems: "center" }}>
          <div style={{ opacity: 0.5, fontWeight: 950, fontSize: 11, textAlign: "center" }}>Drop promo image here<br />(Phase 2)</div>
        </div>
      </div>

      <div style={{ opacity: 0.88, fontWeight: 900, lineHeight: 1.65 }}>
        <b>AMPERE</b> is named after <b>Andre-Marie Ampere</b>, who discovered the laws of electromagnetism. The app is a revolutionary unified remote control that brings all major streaming platforms into a single, seamless interface.
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Core Problem Statement</div>
        <div style={{ opacity: 0.86, fontWeight: 900, lineHeight: 1.55 }}>
          Modern streaming services lack the simple channel-flipping functionality of traditional cable TV. When viewers want to watch multiple live events simultaneously (like two sports games on different platforms), they face a cumbersome process of exiting one app, opening another, navigating to content, and waiting for loading.
        </div>
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Solution</div>
        <div style={{ opacity: 0.86, fontWeight: 900, lineHeight: 1.55 }}>
          AMPERE creates a unified interface that maintains active connections to multiple streaming services simultaneously, allowing for instantaneous switching between content with minimal latency -- replicating and enhancing the traditional channel-surfing experience for the streaming era.
        </div>
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Key Features</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.86, fontWeight: 900, lineHeight: 1.65 }}>
          <li><b>InstantSwitch Technology:</b> Maintains multiple active streams in a suspended state for near-instantaneous switching (under 300ms).</li>
          <li><b>Multi-Profile Management:</b> Separate watchlists, favorites, personalized recommendations, custom UI themes.</li>
          <li><b>Sports-Centric Features:</b> Live Sports Hub, Game Day Mode, real-time scores, PiP for monitoring multiple games.</li>
          <li><b>Voice and Gesture Control:</b> "Switch to ESPN", "Show NBA scores", "Flip to last game", swipe controls.</li>
          <li><b>Offline Mode:</b> Cached schedules, recently toggled content, offline alerts.</li>
          <li><b>Parental Controls:</b> PIN-protected profiles, content filters, time limits, Kid Mode UI.</li>
        </ul>
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Technical Architecture</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 13, opacity: 0.92 }}>Frontend</div>
            <ul style={{ margin: 0, paddingLeft: 16, opacity: 0.82, fontWeight: 900, fontSize: 13, lineHeight: 1.5 }}>
              <li>React Native (iOS/Android)</li>
              <li>WebOS, tvOS, Android TV</li>
              <li>Redux state management</li>
              <li>React Navigation</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 950, fontSize: 13, opacity: 0.92 }}>Backend</div>
            <ul style={{ margin: 0, paddingLeft: 16, opacity: 0.82, fontWeight: 900, fontSize: 13, lineHeight: 1.5 }}>
              <li>Node.js + Express</li>
              <li>GraphQL API</li>
              <li>MongoDB + Redis</li>
              <li>AWS Lambda serverless</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Build: 2026.02.24</div>
        <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>
          AMPERE Demo v0.2.0. All platform connections are simulated for demo purposes.
        </div>
        <div style={{ opacity: 0.5, fontWeight: 900, fontSize: 11, fontFamily: "monospace" }}>
          Branch: claude/implement-all-changes-eM92h
        </div>
      </div>
    </div>
  );
}

function VoiceCenter({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [cmd, setCmd] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<"female" | "male" | "neutral">("female");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const recognitionRef = useRef<any>(null);
  const speakResponse = useCallback((text: string) => {
    if (!voiceResponseEnabled || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const voiceMap: Record<string, (v: SpeechSynthesisVoice) => boolean> = {
      female: (v) => /female|samantha|victoria|karen|fiona/i.test(v.name),
      male: (v) => /male|daniel|david|james|alex/i.test(v.name) && !/female/i.test(v.name),
      neutral: (v) => /google.*us|en-us/i.test(v.name),
    };
    const match = voices.find(voiceMap[selectedVoice]) ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
    if (match) utterance.voice = match;
    utterance.rate = 1.0;
    utterance.pitch = selectedVoice === "female" ? 1.1 : selectedVoice === "male" ? 0.9 : 1.0;
    synth.cancel();
    synth.speak(utterance);
  }, [voiceResponseEnabled, selectedVoice]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setSpeechSupported(true);
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += t;
          } else {
            interim += t;
          }
        }
        if (final) {
          const trimmed = final.trim();
          setCmd(trimmed);
          setTranscript(trimmed);
          setConversationHistory((prev) => [...prev.slice(-8), { role: "user", text: trimmed }]);
          onCommand(trimmed);
          // Generate conversational voice response
          const lower = trimmed.toLowerCase();
          let response = `Got it. "${trimmed}" executed.`;
          if (/search|find|look/i.test(lower)) response = `Searching for ${trimmed.replace(/search|find|look for/i, "").trim()}. Here are your results.`;
          else if (/home|go home/i.test(lower)) response = "Taking you home.";
          else if (/live|go live/i.test(lower)) response = "Switching to live content.";
          else if (/fav|favorites/i.test(lower)) response = "Here are your favorites.";
          else if (/switch to|open/i.test(lower)) response = `Opening ${trimmed.replace(/switch to|open/i, "").trim()}.`;
          else if (/power off|shut down/i.test(lower)) response = "Powering off. Goodbye!";
          else if (/hello|hi|hey/i.test(lower)) response = "Hey there! What can I help you with?";
          else if (/what can you do|help/i.test(lower)) response = "I can search for content, switch platforms, navigate tabs, and control playback. Just say what you need!";
          setConversationHistory((prev) => [...prev.slice(-8), { role: "assistant", text: response }]);
          speakResponse(response);
          setIsListening(false);
        } else {
          setTranscript(interim);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        {speechSupported
          ? "Tap the microphone to speak a command, or type below."
          : "Speech recognition is not supported in this browser. Type a command below."}
      </div>

      {speechSupported ? (
        <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={toggleListening}
            className="ampere-focus"
            aria-label={isListening ? "Stop listening" : "Start listening"}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: isListening ? "3px solid rgba(255,72,72,0.60)" : "3px solid rgba(58,167,255,0.40)",
              background: isListening
                ? "radial-gradient(circle, rgba(255,72,72,0.25), rgba(255,72,72,0.08))"
                : "radial-gradient(circle, rgba(58,167,255,0.20), rgba(58,167,255,0.06))",
              color: "white",
              fontWeight: 950,
              fontSize: 28,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              animation: isListening ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
          >
            <SmartImg
              sources={voiceIconCandidates()}
              size={36}
              rounded={0}
              border={false}
              fit="contain"
              fallbackText={isListening ? "..." : "MIC"}
            />
          </button>
          <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.85 }}>
            {isListening ? "Listening..." : "Tap to speak"}
          </div>
          {transcript ? (
            <div style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid var(--stroke)", background: "rgba(0,0,0,0.30)", fontWeight: 900, opacity: 0.9 }}>
              {transcript}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 950, fontSize: 13 }}>Or type a command:</div>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && cmd.trim()) onCommand(cmd.trim());
          }}
          placeholder='"Switch to ESPN", "Search UFC", "Go live", "Home", "Favs"'
          className="ampere-focus"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--stroke2)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            outline: "none",
            fontWeight: 850,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => { if (cmd.trim()) onCommand(cmd.trim()); }}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.12)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Run
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => { setCmd(""); setTranscript(""); }}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ opacity: 0.75, fontWeight: 900, fontSize: 13 }}>
        Quick actions:{" "}
        {["search nba", "switch to espn", "show nba scores", "go live", "home", "favs", "power off"].map((x) => (
          <button
            key={x}
            type="button"
            className="ampere-focus"
            onClick={() => {
              setCmd(x);
              onCommand(x);
              const response = `Got it. "${x}" executed.`;
              setConversationHistory((prev) => [...prev.slice(-8), { role: "user" as const, text: x }, { role: "assistant" as const, text: response }]);
              speakResponse(response);
            }}
            style={{
              marginLeft: 8,
              marginTop: 6,
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.22)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            {x}
          </button>
        ))}
      </div>

      {/* Voice Response Settings */}
      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>Voice Response</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Enable voice responses to commands</div>
          <button type="button" onClick={() => setVoiceResponseEnabled(!voiceResponseEnabled)} style={{ padding: "6px 14px", borderRadius: 14, border: voiceResponseEnabled ? "1px solid rgba(0,200,0,0.3)" : "1px solid rgba(255,255,255,0.14)", background: voiceResponseEnabled ? "rgba(0,200,0,0.15)" : "rgba(255,255,255,0.06)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 12 }}>
            {voiceResponseEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {voiceResponseEnabled && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>Voice Selection</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["female", "male", "neutral"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setSelectedVoice(v)} style={{ padding: "8px 14px", borderRadius: 14, border: selectedVoice === v ? "1px solid rgba(58,167,255,0.5)" : "1px solid rgba(255,255,255,0.14)", background: selectedVoice === v ? "rgba(58,167,255,0.15)" : "rgba(255,255,255,0.06)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 12, textTransform: "capitalize" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 14, display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 950, fontSize: 14 }}>Conversation</div>
          {conversationHistory.slice(-6).map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ fontWeight: 950, fontSize: 11, minWidth: 20, color: msg.role === "user" ? "rgba(58,167,255,1)" : "#44dd88" }}>{msg.role === "user" ? "You" : "AI"}</div>
              <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{msg.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RemotePad({ onAction }: { onAction: (a: string) => void }) {
  const DPadBtn = ({ label, icon, big }: { label: string; icon?: string; big?: boolean }) => (
    <button
      type="button"
      className="ampere-focus"
      onClick={() => onAction(label)}
      aria-label={label}
      style={{
        padding: big ? "16px" : "12px",
        borderRadius: big ? 22 : 14,
        border: label === "OK" ? "2px solid rgba(58,167,255,0.40)" : "1px solid rgba(255,255,255,0.16)",
        background: label === "OK"
          ? "radial-gradient(circle, rgba(58,167,255,0.22), rgba(58,167,255,0.08))"
          : "rgba(255,255,255,0.06)",
        color: "white",
        fontWeight: 950,
        cursor: "pointer",
        fontSize: big ? 16 : 13,
        display: "grid",
        placeItems: "center",
        minHeight: big ? 56 : 44,
      }}
    >
      {icon ?? label}
    </button>
  );

  const NavBtn = ({ label, icon, active }: { label: string; icon?: string; active?: boolean }) => (
    <button
      type="button"
      className="ampere-focus"
      onClick={() => onAction(label)}
      aria-label={label}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: active ? "1px solid rgba(58,167,255,0.30)" : "1px solid rgba(255,255,255,0.14)",
        background: active ? "rgba(58,167,255,0.12)" : "rgba(255,255,255,0.06)",
        color: "white",
        fontWeight: 950,
        cursor: "pointer",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon ? <span>{icon}</span> : null}
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 380, margin: "0 auto" }}>
      {/* Remote body */}
      <div
        style={{
          borderRadius: 32,
          border: "2px solid rgba(255,255,255,0.12)",
          background: "linear-gradient(180deg, rgba(30,30,40,0.95), rgba(15,15,20,0.98))",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          padding: "24px 20px",
          display: "grid",
          gap: 18,
        }}
      >
        {/* Brand */}
        <div style={{ display: "grid", placeItems: "center", padding: "4px 0" }}>
          <SmartImg sources={brandWideCandidates()} size={900} rounded={0} border={false} fit="contain" fill fallbackText="AMPERE" />
          <div style={{ height: 20 }} />
          <div style={{ opacity: 0.5, fontWeight: 900, fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Remote Control</div>
        </div>

        {/* Power button */}
        <div style={{ display: "grid", placeItems: "center" }}>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => onAction("POWER")}
            aria-label="Power"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid rgba(255,72,72,0.35)",
              background: "rgba(255,72,72,0.12)",
              color: "#ff6666",
              fontWeight: 950,
              fontSize: 18,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            {"\u23FB"}
          </button>
        </div>

        {/* D-pad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, maxWidth: 220, margin: "0 auto" }}>
          <div />
          <DPadBtn label="UP" icon={"\u25B2"} big />
          <div />
          <DPadBtn label="LEFT" icon={"\u25C4"} big />
          <DPadBtn label="OK" big />
          <DPadBtn label="RIGHT" icon={"\u25BA"} big />
          <div />
          <DPadBtn label="DOWN" icon={"\u25BC"} big />
          <div />
        </div>

        {/* Volume + Channel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 950, fontSize: 10, opacity: 0.5, textAlign: "center", letterSpacing: 1 }}>VOL</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <DPadBtn label="VOL-" icon="-" />
              <DPadBtn label="VOL+" icon="+" />
            </div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 950, fontSize: 10, opacity: 0.5, textAlign: "center", letterSpacing: 1 }}>CH</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <DPadBtn label="CH-" icon="-" />
              <DPadBtn label="CH+" icon="+" />
            </div>
          </div>
        </div>

        {/* Back + Mute */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <DPadBtn label="BACK" icon={"\u2190 Back"} />
          <DPadBtn label="MUTE" icon={"\uD83D\uDD07 Mute"} />
        </div>

        {/* Navigation bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <NavBtn label="HOME" icon={"\u2302"} />
          <NavBtn label="LIVE" icon={"\u25CF"} />
          <NavBtn label="FAVS" icon={"\u2665"} />
          <NavBtn label="SEARCH" icon={"\uD83D\uDD0D"} />
        </div>
      </div>

      <div style={{ opacity: 0.60, fontWeight: 900, fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
        Demo remote control. In production, this maps to CEC/eARC, TV OS APIs, or a local companion hub for real TV control.
      </div>
    </div>
  );
}

function FavoritesEditor({
  isMobile,
  profile,
  onSave,
}: {
  isMobile: boolean;
  profile: ProfileState;
  onSave: (next: ProfileState) => void;
}) {
  const [pSearch, setPSearch] = useState("");
  const [tSearch, setTSearch] = useState("");

  const [favPlatforms, setFavPlatforms] = useState<PlatformId[]>(profile.favoritePlatformIds);
  const [favLeagues, setFavLeagues] = useState<string[]>(profile.favoriteLeagues);
  const [favTeams, setFavTeams] = useState<string[]>(profile.favoriteTeams);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const toggleExpand = (key: string) => setExpandedSections((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // 2 rows max: platforms = mobile 2 cols, desktop 4 cols → 2 rows = 4 or 8
  const platRowLimit = isMobile ? 4 : 8;
  // Leagues: auto-fit ~160px, assume ~5-6 per row → 2 rows = 10-12
  const leagueRowLimit = 12;
  // Teams: auto-fit ~220px → ~3-4 per row → 2 rows = 6-8
  const teamRowLimit = isMobile ? 6 : 8;

  useEffect(() => {
    setFavPlatforms(profile.favoritePlatformIds);
    setFavLeagues(profile.favoriteLeagues);
    setFavTeams(profile.favoriteTeams);
    setPSearch("");
    setTSearch("");
  }, [profile]);

  const leaguesSelectable = LEAGUES.filter((l) => l !== "ALL");

  // Group platforms by genre/kind for display
  const platformsByGenre = useMemo(() => {
    const q = pSearch.trim().toLowerCase();
    const all = [...PLATFORMS].sort((a, b) => a.label.localeCompare(b.label));
    const filtered = q ? all.filter((p) => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) : all;
    const groups: Record<string, Platform[]> = {};
    for (const p of filtered) {
      const genre = p.kind === "sports" ? "Sports" : p.kind === "kids" ? "Kids & Family" : p.kind === "gaming" ? "Gaming" : p.kind === "livetv" ? "Live TV" : p.kind === "niche" ? "Specialty" : "Streaming";
      if (!groups[genre]) groups[genre] = [];
      groups[genre].push(p);
    }
    return groups;
  }, [pSearch]);

  const teamsBySelectedLeagues = useMemo(() => {
    const selected = favLeagues.length ? favLeagues : [];
    const seen = new Set<string>();
    const out: { league: string; teams: string[] }[] = [];
    for (const l of selected) {
      const canon = canonicalLeagueForTeams(l) ?? l;
      if (seen.has(canon)) continue;
      seen.add(canon);
      const all = TEAMS_BY_LEAGUE[canon] ?? [];
      out.push({ league: canon, teams: all });
    }
    return out;
  }, [favLeagues.join("|")]);

  const filteredTeamSections = useMemo(() => {
    const q = normalizeKey(tSearch);
    if (!q) return teamsBySelectedLeagues;
    return teamsBySelectedLeagues.map((s) => ({
      league: s.league,
      teams: s.teams.filter((t) => normalizeKey(t).includes(q)),
    }));
  }, [teamsBySelectedLeagues, tSearch]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Edit favorites (stored locally). These affect ranking + filters + notifications.
      </div>

      {/* === PLATFORMS (by Genre) === */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Favorite Platforms</div>
        <QwertyKeyboard
          value={pSearch}
          onChange={setPSearch}
          isMobile={isMobile}
          placeholder="Filter platforms…"
        />

        {Object.entries(platformsByGenre).map(([genre, platforms]) => {
          const key = `plat_${genre}`;
          const isExpanded = expandedSections.has(key);
          const visible = isExpanded ? platforms : platforms.slice(0, platRowLimit);
          const hasMore = platforms.length > platRowLimit && !isExpanded;
          return (
            <div key={key} style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950, opacity: 0.85, fontSize: 13 }}>{genre} ({platforms.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                {visible.map((p) => (
                  <PillButton
                    key={`favplat_${p.id}`}
                    label={p.label}
                    iconSources={platformIconCandidates(p.id)}
                    active={favPlatforms.includes(p.id)}
                    onClick={() => setFavPlatforms((prev) => uniq(toggleInArray(prev, p.id) as PlatformId[]))}
                    fullWidth
                    multiline
                  />
                ))}
              </div>
              {hasMore ? (
                <button type="button" className="ampere-focus menu-item-glow" onClick={() => toggleExpand(key)}
                  style={{ padding: "8px 12px", borderRadius: 14, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", width: "fit-content", fontSize: 12 }}>
                  Load More ({visible.length}/{platforms.length})
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* === LEAGUES === */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Favorite Leagues</div>
        {(() => {
          const isExpanded = expandedSections.has("leagues");
          const visible = isExpanded ? leaguesSelectable : leaguesSelectable.slice(0, leagueRowLimit);
          const hasMore = leaguesSelectable.length > leagueRowLimit && !isExpanded;
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {visible.map((l) => (
                  <PillButton
                    key={`favleague_${l}`}
                    label={l}
                    iconSources={leagueLogoCandidates(l)}
                    active={favLeagues.includes(l)}
                    onClick={() => setFavLeagues((prev) => uniq(toggleInArray(prev, l)))}
                    fullWidth
                  />
                ))}
              </div>
              {hasMore ? (
                <button type="button" className="ampere-focus menu-item-glow" onClick={() => toggleExpand("leagues")}
                  style={{ padding: "8px 12px", borderRadius: 14, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", width: "fit-content", fontSize: 12 }}>
                  Load More ({visible.length}/{leaguesSelectable.length})
                </button>
              ) : null}
            </>
          );
        })()}
      </div>

      {/* === TEAMS === */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Favorite Teams</div>
        <QwertyKeyboard
          value={tSearch}
          onChange={setTSearch}
          isMobile={isMobile}
          placeholder="Filter teams…"
        />

        {!favLeagues.length ? (
          <div style={{ opacity: 0.75, fontWeight: 900 }}>Select a league above to pick teams.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredTeamSections.map((sec) => {
              const key = `teams_${sec.league}`;
              const isExpanded = expandedSections.has(key);
              const visible = isExpanded ? sec.teams : sec.teams.slice(0, teamRowLimit);
              const hasMore = sec.teams.length > teamRowLimit && !isExpanded;
              return (
                <div key={key} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 950, opacity: 0.92 }}>{sec.league} ({sec.teams.length})</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                    {visible.map((t) => (
                      <PillButton
                        key={`${sec.league}_${t}`}
                        label={t}
                        active={favTeams.includes(t)}
                        onClick={() => setFavTeams((prev) => uniq(toggleInArray(prev, t)))}
                        fullWidth
                        multiline
                      />
                    ))}
                  </div>
                  {hasMore ? (
                    <button type="button" className="ampere-focus menu-item-glow" onClick={() => toggleExpand(key)}
                      style={{ padding: "8px 12px", borderRadius: 14, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", width: "fit-content", fontSize: 12 }}>
                      Load More ({visible.length}/{sec.teams.length})
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {favTeams.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {favTeams.slice(0, 18).map((t) => (
              <Chip key={`favteam_chip_${t}`} label={t} onRemove={() => setFavTeams((prev) => prev.filter((x) => x !== t))} />
            ))}
            {favTeams.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{favTeams.length - 18} more</div> : null}
          </div>
        ) : (
          <div style={{ opacity: 0.75, fontWeight: 900 }}>No teams selected (optional).</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", position: "sticky", bottom: 0, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)", padding: "12px 14px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", zIndex: 5, marginTop: 4 }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={() => {
            setFavPlatforms([]);
            setFavLeagues([]);
            setFavTeams([]);
            track("favorites_clear", {});
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.28)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="ampere-focus"
          onClick={() =>
            onSave({
              ...profile,
              favoritePlatformIds: uniq(favPlatforms),
              favoriteLeagues: uniq(favLeagues),
              favoriteTeams: uniq(favTeams),
            })
          }
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(58,167,255,0.22)",
            background: "rgba(58,167,255,0.18)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Save Favorites
        </button>
      </div>
    </div>
  );
}

function SetupWizardContent({
  isMobile,
  setupStep,
  setSetupStep,
  draftName,
  setDraftName,
  draftRegion,
  setDraftRegion,
  draftRegions,
  setDraftRegions,
  draftLanguage,
  setDraftLanguage,
  draftPlatforms,
  setDraftPlatforms,
  draftLeagues,
  setDraftLeagues,
  draftTeams,
  setDraftTeams,
  wizShownByLeague,
  setWizShownByLeague,
  wizTeamSearch,
  setWizTeamSearch,
  wizPlatShown,
  setWizPlatShown,
  canNext,
  onFinish,
  onStartOver,
}: {
  isMobile: boolean;
  setupStep: 1 | 2 | 3 | 4 | 5 | 6;
  setSetupStep: (s: 1 | 2 | 3 | 4 | 5 | 6) => void;
  draftRegion: string;
  setDraftRegion: (s: string) => void;
  draftRegions: string[];
  setDraftRegions: (x: string[] | ((prev: string[]) => string[])) => void;
  draftLanguage: string;
  setDraftLanguage: (s: string) => void;
  draftName: string;
  setDraftName: (s: string) => void;
  draftPlatforms: PlatformId[];
  setDraftPlatforms: (x: PlatformId[] | ((prev: PlatformId[]) => PlatformId[])) => void;
  draftLeagues: string[];
  setDraftLeagues: (x: string[] | ((prev: string[]) => string[])) => void;
  draftTeams: string[];
  setDraftTeams: (x: string[] | ((prev: string[]) => string[])) => void;
  wizShownByLeague: Record<string, number>;
  setWizShownByLeague: (x: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  wizTeamSearch: string;
  setWizTeamSearch: (s: string) => void;
  wizPlatShown: number;
  setWizPlatShown: (x: number | ((prev: number) => number)) => void;
  canNext: boolean;
  onFinish: () => void;
  onStartOver: () => void;
}) {
  const leaguesSelectable = LEAGUES.filter((l) => l !== "ALL");
  const sortedPlatforms = useMemo(() => {
    const all = [...PLATFORMS].sort((a, b) => a.label.localeCompare(b.label));
    if (!draftRegions.length) return all;
    // Collect platform IDs from all selected regions
    const regionIds = new Set<string>();
    for (const rid of draftRegions) {
      const reg = GLOBAL_REGIONS.find((r) => r.id === rid);
      if (reg) { for (const p of [...reg.popularPlatforms, ...reg.localPlatforms]) regionIds.add(p); }
    }
    return regionIds.size ? all.filter((p) => regionIds.has(p.id)) : all;
  }, [draftRegions]);

  const stepTitle =
    setupStep === 1 ? "Your Profile" : setupStep === 2 ? "Your Region" : setupStep === 3 ? "Pick Platforms" : setupStep === 4 ? "Pick Leagues" : setupStep === 5 ? "Pick Teams" : "Review";

  const goNext = () => {
    if (!canNext) return;
    const n = Math.min(6, (setupStep + 1) as any) as any;
    setSetupStep(n);
    track("wizard_step_next", { from: setupStep, to: n });
  };

  const goBack = () => {
    const n = Math.max(1, (setupStep - 1) as any) as any;
    setSetupStep(n);
    track("wizard_step_back", { from: setupStep, to: n });
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{stepTitle}</div>
          <div style={{ opacity: 0.78, fontWeight: 900 }}>Progress: {setupStep}/6 • Autosaved</div>
        </div>

        <button
          type="button"
          className="ampere-focus"
          onClick={onStartOver}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.22)",
            color: "white",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Start over
        </button>
      </div>

      {/* STEP 1 */}
      {setupStep === 1 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Let’s personalize AMPÈRE. This controls ranking and defaults in the app.
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 950 }}>Name</div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Your name"
              className="ampere-focus"
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid var(--stroke2)",
                background: "rgba(0,0,0,0.35)",
                color: "white",
                outline: "none",
                fontWeight: 900,
              }}
            />
            <div style={{ opacity: 0.74, fontWeight: 900, fontSize: 12 }}>
              Tip: you can set avatar/header in Profile Settings.
            </div>
          </div>
        </div>
      ) : null}

      {/* STEP 2 — Region (multi-select) */}
      {setupStep === 2 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Select one or more regions to customize platforms, leagues, and language options.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            {GLOBAL_REGIONS.map((r) => {
              const selected = draftRegions.includes(r.id);
              return (
              <button
                key={r.id}
                type="button"
                className="ampere-focus"
                onClick={() => {
                  setDraftRegions((prev) => {
                    const next = prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id];
                    return next.length ? next : prev; // keep at least one
                  });
                  setDraftRegion(r.id);
                  setDraftLanguage(r.defaultLanguage);
                }}
                style={{
                  padding: "14px 10px",
                  borderRadius: 16,
                  border: selected ? "2px solid rgba(58,167,255,0.7)" : "1px solid rgba(255,255,255,0.12)",
                  background: selected ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.04)",
                  color: "white",
                  fontWeight: 950,
                  cursor: "pointer",
                  textAlign: "center",
                  display: "grid",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
                <span style={{ fontSize: 13 }}>{r.name}</span>
                {selected ? <span style={{ fontSize: 10, color: "rgba(58,167,255,0.9)" }}>Selected</span> : null}
              </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 950 }}>Language</div>
            <select
              value={draftLanguage}
              onChange={(e) => setDraftLanguage(e.target.value)}
              className="ampere-focus"
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid var(--stroke2)",
                background: "rgba(0,0,0,0.35)",
                color: "white",
                outline: "none",
                fontWeight: 900,
              }}
            >
              {(() => {
                const allLangs = new Map<string, typeof LANGUAGES[0]>();
                for (const rid of draftRegions) { const reg = GLOBAL_REGIONS.find((r) => r.id === rid); if (reg) for (const l of reg.supportedLanguages) allLangs.set(l.code, l); }
                const langs = allLangs.size ? Array.from(allLangs.values()) : LANGUAGES.slice(0, 3);
                return langs.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name} — {lang.nativeName}</option>
                ));
              })()}
            </select>
          </div>
        </div>
      ) : null}

      {/* STEP 3 — Platforms */}
      {setupStep === 3 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
              Choose the services you use most. These become your Favorite Platforms.
            </div>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                const allIds = sortedPlatforms.map((p) => p.id);
                setDraftPlatforms(draftPlatforms.length === allIds.length ? [] : allIds);
              }}
              style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
            >
              {draftPlatforms.length === sortedPlatforms.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {draftPlatforms.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {draftPlatforms.slice(0, 18).map((pid) => (
                <Chip key={`wiz_plat_${pid}`} label={platformById(pid)?.label ?? pid} onRemove={() => setDraftPlatforms((prev) => prev.filter((x) => x !== pid))} />
              ))}
              {draftPlatforms.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftPlatforms.length - 18} more</div> : null}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>Pick at least one platform.</div>
          )}

          {(() => {
            const platSlice = sortedPlatforms.slice(0, wizPlatShown);
            const hasMore = wizPlatShown < sortedPlatforms.length;
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                  {platSlice.map((p) => (
                    <PillButton
                      key={`wiz_plat_${p.id}`}
                      label={p.label}
                      iconSources={platformIconCandidates(p.id)}
                      active={draftPlatforms.includes(p.id)}
                      onClick={() => setDraftPlatforms((prev) => uniq(toggleInArray(prev, p.id) as PlatformId[]))}
                      fullWidth
                      multiline
                    />
                  ))}
                </div>
                {hasMore ? (
                  <button
                    type="button"
                    className="ampere-focus"
                    onClick={() => setWizPlatShown((n) => Math.min(sortedPlatforms.length, n + (isMobile ? 6 : 12)))}
                    style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", width: "fit-content" }}
                  >
                    Load More ({platSlice.length}/{sortedPlatforms.length})
                  </button>
                ) : null}
              </>
            );
          })()}
        </div>
      ) : null}

      {/* STEP 4 — Leagues */}
      {setupStep === 4 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
              Pick leagues you care about (optional). This helps personalize "Live" and recommendations.
            </div>
            <button
              type="button"
              className="ampere-focus"
              onClick={() => {
                setDraftLeagues(draftLeagues.length === leaguesSelectable.length ? [] : [...leaguesSelectable]);
              }}
              style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.10)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
            >
              {draftLeagues.length === leaguesSelectable.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
            {leaguesSelectable.map((l) => (
              <PillButton
                key={`wiz_league_${l}`}
                label={l}
                iconSources={leagueLogoCandidates(l)}
                active={draftLeagues.includes(l)}
                onClick={() => setDraftLeagues((prev) => uniq(toggleInArray(prev, l)))}
                fullWidth
              />
            ))}
          </div>

          {draftLeagues.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {draftLeagues.map((l) => (
                <Chip key={`wiz_league_chip_${l}`} label={l} onRemove={() => setDraftLeagues((prev) => prev.filter((x) => x !== l))} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected (you can continue).</div>
          )}
        </div>
      ) : null}

      {/* STEP 5 — Teams */}
      {setupStep === 5 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Pick favorite teams (optional). Tip: use search to narrow.
          </div>

          <QwertyKeyboard
            value={wizTeamSearch}
            onChange={setWizTeamSearch}
            isMobile={isMobile}
            placeholder="Search teams…"
          />

          {!draftLeagues.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected — teams are optional. Continue to Review.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {draftLeagues.map((l) => {
                const canon = canonicalLeagueForTeams(l) ?? l;
                const all = TEAMS_BY_LEAGUE[canon] ?? [];
                const q = normalizeKey(wizTeamSearch);
                const hasConfs = leagueHasConferences(canon);
                const confs = conferencesForLeague(canon);
                const leagueTeamCount = draftTeams.filter((t) => all.includes(t)).length;

                return (
                  <div
                    key={`wiz_team_${canon}`}
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 950, opacity: 0.92 }}>{canon}</div>
                      <div style={{ opacity: 0.75, fontWeight: 900, fontSize: 12 }}>
                        {leagueTeamCount} team(s) selected
                      </div>
                    </div>

                    {hasConfs ? (
                      /* ---- NCAA Conference-grouped teams ---- */
                      <div style={{ display: "grid", gap: 10 }}>
                        {confs.map((conf) => {
                          const confTeams = teamsForConference(canon, conf.id);
                          const confFiltered = q ? confTeams.filter((t) => normalizeKey(t).includes(q)) : confTeams;
                          if (confFiltered.length === 0) return null;
                          const confKey = `${canon}_${conf.id}`;
                          const confShown = wizShownByLeague[confKey] ?? (isMobile ? 4 : 6);
                          const confSlice = confFiltered.slice(0, confShown);
                          const confMore = confShown < confFiltered.length;
                          const confSelected = draftTeams.filter((t) => confTeams.includes(t)).length;

                          return (
                            <div key={confKey} style={{ borderRadius: 14, border: "1px solid rgba(58,167,255,0.12)", background: "rgba(58,167,255,0.04)", padding: 10, display: "grid", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ fontWeight: 950, fontSize: 14, color: "rgba(58,167,255,0.95)" }}>{conf.shortName}</div>
                                <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 11 }}>{confSelected}/{confTeams.length} selected</div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 6 }}>
                                {confSlice.map((t) => (
                                  <PillButton
                                    key={`${confKey}_${t}`}
                                    label={t}
                                    iconSources={_teamIcon(canon, t)}
                                    active={draftTeams.includes(t)}
                                    onClick={() => setDraftTeams((prev) => uniq(toggleInArray(prev, t)))}
                                    fullWidth
                                    multiline
                                  />
                                ))}
                              </div>
                              {confMore ? (
                                <button
                                  type="button"
                                  className="ampere-focus"
                                  onClick={() => setWizShownByLeague((prev) => ({ ...prev, [confKey]: Math.min(confFiltered.length, (prev[confKey] ?? confShown) + 8) }))}
                                  style={{ padding: "6px 10px", borderRadius: 12, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.08)", color: "white", fontWeight: 950, cursor: "pointer", width: "fit-content", fontSize: 12 }}
                                >
                                  More ({confSlice.length}/{confFiltered.length})
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ---- Standard flat team list ---- */
                      (() => {
                        const filtered = q ? all.filter((t) => normalizeKey(t).includes(q)) : all;
                        const defaultRows = isMobile ? 6 : 9;
                        const shown = wizShownByLeague[canon] ?? defaultRows;
                        const slice = filtered.slice(0, shown);
                        const more = shown < filtered.length;

                        return (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 10 }}>
                              {slice.map((t) => (
                                <PillButton
                                  key={`${canon}_${t}`}
                                  label={t}
                                  iconSources={_teamIcon(canon, t)}
                                  active={draftTeams.includes(t)}
                                  onClick={() => setDraftTeams((prev) => uniq(toggleInArray(prev, t)))}
                                  fullWidth
                                  multiline
                                />
                              ))}
                            </div>

                            {more ? (
                              <button
                                type="button"
                                className="ampere-focus"
                                onClick={() =>
                                  setWizShownByLeague((prev) => ({
                                    ...prev,
                                    [canon]: Math.min(filtered.length, (prev[canon] ?? shown) + 12),
                                  }))
                                }
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 14,
                                  border: "1px solid rgba(58,167,255,0.22)",
                                  background: "rgba(58,167,255,0.10)",
                                  color: "white",
                                  fontWeight: 950,
                                  cursor: "pointer",
                                  width: "fit-content",
                                }}
                              >
                                Load more ({slice.length}/{filtered.length})
                              </button>
                            ) : null}
                          </>
                        );
                      })()
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {draftTeams.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {draftTeams.slice(0, 18).map((t) => (
                <Chip key={`wiz_team_chip_${t}`} label={t} onRemove={() => setDraftTeams((prev) => prev.filter((x) => x !== t))} />
              ))}
              {draftTeams.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftTeams.length - 18} more</div> : null}
            </div>
          ) : (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No teams selected (optional).</div>
          )}
        </div>
      ) : null}

      {/* STEP 6 — Review */}
      {setupStep === 6 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Review your selections. Finish to apply them to your profile.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950 }}>Name</div>
              <div style={{ opacity: 0.9, fontWeight: 900 }}>{draftName.trim() || "—"}</div>
            </div>
            <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 950 }}>Favorites</div>
              <div style={{ opacity: 0.9, fontWeight: 900 }}>
                {draftPlatforms.length} platform(s), {draftLeagues.length} league(s), {draftTeams.length} team(s)
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Platforms</div>
            {draftPlatforms.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {draftPlatforms.slice(0, 18).map((pid) => (
                  <Chip key={`rev_plat_${pid}`} label={platformById(pid)?.label ?? pid} />
                ))}
                {draftPlatforms.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftPlatforms.length - 18} more</div> : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75, fontWeight: 900 }}>No platforms selected.</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Leagues</div>
            {draftLeagues.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {draftLeagues.map((l) => (
                  <Chip key={`rev_league_${l}`} label={l} />
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected (ok).</div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950 }}>Teams</div>
            {draftTeams.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {draftTeams.slice(0, 18).map((t) => (
                  <Chip key={`rev_team_${t}`} label={t} />
                ))}
                {draftTeams.length > 18 ? <div style={{ opacity: 0.75, fontWeight: 900 }}>+{draftTeams.length - 18} more</div> : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75, fontWeight: 900 }}>No teams selected (ok).</div>
            )}
          </div>
        </div>
      ) : null}

      {/* NAV - Sticky footer */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap", marginTop: 4, position: "sticky", bottom: 0, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)", padding: "12px 14px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", zIndex: 5 }}>
        <button
          type="button"
          className="ampere-focus"
          onClick={goBack}
          disabled={setupStep === 1}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: setupStep === 1 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 950,
            cursor: setupStep === 1 ? "not-allowed" : "pointer",
            opacity: setupStep === 1 ? 0.55 : 1,
          }}
        >
          Back
        </button>

        {setupStep < 6 ? (
          <button
            type="button"
            className="ampere-focus"
            onClick={goNext}
            disabled={!canNext}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: canNext ? "rgba(58,167,255,0.12)" : "rgba(58,167,255,0.06)",
              color: "white",
              fontWeight: 950,
              cursor: canNext ? "pointer" : "not-allowed",
              opacity: canNext ? 1 : 0.6,
            }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="ampere-focus"
            onClick={() => {
              track("wizard_finish_click", {});
              onFinish();
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: "rgba(58,167,255,0.14)",
              color: "white",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            Finish
          </button>
        )}
      </div>

      {setupStep === 1 && !draftName.trim() ? (
        <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>Name is required to continue.</div>
      ) : null}
      {setupStep === 3 && draftPlatforms.length === 0 ? (
        <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>Pick at least one platform to continue.</div>
      ) : null}
    </div>
  );
}

/* =========================
   Image helper
   ========================= */

async function fileToResizedDataUrl(file: File, maxDim: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("image_failed"));
    i.src = dataUrl;
  });

  const w = img.naturalWidth || img.width || 1;
  const h = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.9);
}