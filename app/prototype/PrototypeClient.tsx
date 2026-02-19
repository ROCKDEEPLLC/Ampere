"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { AboutSection } from "../../components/AboutSection";
import {
  brandWideCandidates as _brandWide,
  brandMarkCandidates as _brandMark,
  platformIconCandidates as _platIcon,
  genreImageCandidates,
  leagueLogoCandidates as _leagueIcon,
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
} from "../../lib/catalog";
import type { PlatformId, GenreKey, Platform } from "../../lib/catalog";
import { parseCommand } from "../../lib/intent";
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
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
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
    step: ([1, 2, 3, 4, 5].includes(step) ? step : 1) as any,
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
  const t = normalizeKey(team);
  return [
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
@keyframes bootProgress {
  0% { width: 0%; }
  100% { width: 100%; }
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
  const [w, setW] = useState<number>(() => (typeof window === "undefined" ? 1200 : window.innerWidth));

  useEffect(() => {
    if (typeof window === "undefined") return;
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
        <div style={{ padding: 14, maxHeight: "72vh", overflowY: "auto" }}>{children}</div>
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
        border: active ? "1px solid rgba(58,167,255,0.45)" : "1px solid rgba(255,255,255,0.10)",
        background: active
          ? "linear-gradient(180deg, rgba(58,167,255,0.18) 0%, rgba(10,10,10,0.85) 100%)"
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
          ? "0 0 8px rgba(58,167,255,0.25), 0 0 0 1px rgba(58,167,255,0.15) inset"
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
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
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
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="ampere-focus"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 999,
          border: open ? "1px solid rgba(58,167,255,0.26)" : "1px solid var(--stroke)",
          background: open ? "rgba(58,167,255,0.10)" : "rgba(255,255,255,0.04)",
          color: "white",
          cursor: "pointer",
          fontWeight: 950,
          whiteSpace: "nowrap",
          boxShadow: open ? "0 0 0 1px rgba(58,167,255,0.10) inset" : undefined,
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {iconLeft ? <span style={{ display: "inline-flex" }}>{iconLeft}</span> : null}
        <span style={{ opacity: 0.95 }}>{label}</span>
        <IconChevronDown />
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(4px)",
              zIndex: 88,
            }}
            onMouseDown={() => setOpen(false)}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 10px)",
              minWidth,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(10,10,10,0.995)",
              backdropFilter: "blur(16px)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
              zIndex: 89,
            }}
          >
            <DropdownCtx.Provider value={{ close: () => setOpen(false) }}>
              <div style={{ padding: 10, display: "grid", gap: 8 }}>{children}</div>
            </DropdownCtx.Provider>
          </div>
        </>
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
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => {
    if (!isMobile) setOpen(true);
  }, [isMobile]);

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
          {isMobile ? (
            <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 120ms ease" }}>
              <IconChevronDown />
            </span>
          ) : null}
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
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cardMinW}px, 1fr))`, gap: 12 }}>
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
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cardMinW}px, 1fr))`, gap: 12 }}>
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
    mk({ title: "NCAAF: Georgia vs Alabama", subtitle: "Top matchup", platformId: "espnplus", league: "NCAA", genre: "Sports", badge: "LIVE", metaLeft: "NCAA", metaRight: "Live", timeRemaining: "Q2 • 05:41" }),
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
    mk({ title: "HBCU Game of the Week", subtitle: "Showcase", platformId: "hbcugosports", league: "NCAA", genre: "Sports", badge: "UPCOMING", metaLeft: "HBCU", metaRight: "Soon", startTime: "Sat 7:30 PM" }),
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

  const [powerState, setPowerState] = useState<"off" | "booting" | "on">("off");

  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [draftName, setDraftName] = useState(profile.name);
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
      setDraftPlatforms(saved.platforms.length ? saved.platforms : profile.favoritePlatformIds);
      setDraftLeagues(saved.leagues.length ? saved.leagues : profile.favoriteLeagues);
      setDraftTeams(saved.teams.length ? saved.teams : profile.favoriteTeams);
    } else {
      setSetupStep(1);
      setDraftName(profile.name);
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
    openAppStore;

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
    // Boot timer: video loops for 15s before auto-transition to the app
    const t = setTimeout(() => {
      setPowerState("on");
      track("power_on", {});
    }, 15000);
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
    if (setupStep === 2) return draftPlatforms.length > 0;
    if (setupStep === 3) return true; // leagues optional
    if (setupStep === 4) return true; // teams optional
    return true;
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
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
                {/* Boot video - plays full video, min 10s before allowing transition */}
                <div style={{ borderRadius: 18, overflow: "hidden", background: "black", maxHeight: 360 }}>
                  <video
                    autoPlay
                    muted
                    playsInline
                    loop
                    style={{ width: "100%", maxHeight: 360, objectFit: "contain" }}
                  >
                    <source src={assetPath("/assets/boot/power-on.mp4")} type="video/mp4" />
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
                      width: "72%",
                      borderRadius: 999,
                      background: "rgba(58,167,255,0.55)",
                      boxShadow: "0 0 0 1px rgba(58,167,255,0.12) inset",
                      animation: "bootProgress 2s ease-in-out forwards",
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
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
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

            <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
              <div style={{ width: isMobile ? 200 : 280, height: isMobile ? 28 : 36 }}>
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <PillButton label="Voice" iconNode={<SmartImg sources={voiceIconCandidates()} size={18} rounded={0} border={false} fit="contain" fallbackText="" />} onClick={() => setOpenVoice(true)} ariaLabel="Voice" />
            <PillButton label="Remote" iconNode={<IconRemote />} onClick={() => setOpenRemote(true)} ariaLabel="Remote" />

            <Dropdown label="Settings" iconLeft={<SmartImg sources={settingsIconCandidates()} size={18} rounded={0} border={false} fit="contain" fallbackText="⚙" />}>
              <MenuItem title="Favorites" subtitle="Edit platforms / leagues / teams" onClick={() => setOpenFavorites(true)} right="›" />
              <MenuItem title="Notifications" subtitle="Alerts when favorite teams play" onClick={() => setOpenNotifications(true)} right="›" />
              <MenuItem title="Connect Platforms" subtitle="Open / Subscribe to streaming services" onClick={() => setOpenConnect(true)} right="›" />
              <MenuItem title="Archive" subtitle="History + attribution log" onClick={() => setOpenArchive(true)} right="›" />
              <MenuItem title="App Store" subtitle="Browse additional apps" onClick={() => setOpenAppStore(true)} right="›" />
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
              <MenuItem title="Change Header Image" subtitle="Recommended: 1500 × 500 px" onClick={() => headerInputRef.current?.click()} right="⬆" />
              <MenuItem title="Set-Up Wizard" subtitle="Resume onboarding" onClick={() => setOpenSetup(true)} right="›" />
              <MenuItem
                title={"About AMPÈRE"}
                subtitle="Backstory, inventors, and architecture"
                onClick={() => {
                  setOpenAbout(true);
                }}
                right="i"
              />
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
          WebkitOverflowScrolling: "touch",
          padding: density.pad,
          display: "grid",
          gap: density.gap,
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
          style={{
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--stroke)",
            background: "rgba(255,255,255,0.04)",
            padding: density.pad,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
              {[
                { name: "Basic", price: "Free", features: ["Web remote control", "Manual platform switching", "Viewing history", "Up to 3 platforms"], color: "rgba(255,255,255,0.08)" },
                { name: "Pro", price: "$4.99/mo", features: ["InstantSwitch (< 300ms)", "Voice & gesture control", "Unlimited platforms", "Sports Hub + Game Day Mode", "Multi-profile support"], color: "rgba(58,167,255,0.10)" },
                { name: "Family", price: "$7.99/mo", features: ["Everything in Pro", "Up to 5 profiles", "Parental controls + Kid Mode", "Offline cached schedules", "Priority support"], color: "rgba(138,43,226,0.10)" },
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

      {/* App Store Modal */}
      <Modal open={openAppStore} title="App Store" onClose={() => setOpenAppStore(false)} maxWidth={980}>
        <AppStoreContent isMobile={isMobile} onInstall={(pid: string) => {
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

      <Modal open={openSetup} title={`Set-Up Wizard — Step ${setupStep} of 5`} onClose={() => setOpenSetup(false)} maxWidth={980}>
        <SetupWizardContent
          isMobile={isMobile}
          setupStep={setupStep}
          setSetupStep={setSetupStep}
          draftName={draftName}
          setDraftName={setDraftName}
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
          canNext={canNextWizard()}
          onFinish={finishWizard}
          onStartOver={() => {
            clearWizardDraft();
            setSetupStep(1);
            setDraftName(profile.name);
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

function AppStoreContent({ isMobile, onInstall }: { isMobile: boolean; onInstall: (pid: string) => void }) {
  const [search, setSearch] = useState("");
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());

  const allApps = useMemo(() => [...PLATFORMS, ...APP_STORE_EXTRAS], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...allApps].sort((a, b) => a.label.localeCompare(b.label));
    if (!q) return sorted;
    return sorted.filter(
      (p) => p.label.toLowerCase().includes(q) || (p.kind ?? "").includes(q) || (p.genres ?? []).some((g) => g.toLowerCase().includes(q))
    );
  }, [search, allApps]);

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
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Browse and install additional streaming apps. Installed apps appear in your platform list and Connect Platforms.
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search apps by name, category, or genre..."
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

      {Object.entries(categories).map(([cat, platforms]) => (
        <div key={cat} style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{cat} ({platforms.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 10 }}>
            {platforms.map((p) => {
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
                      background: justInstalled ? "rgba(58,167,255,0.12)" : "rgba(255,255,255,0.06)",
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
        </div>
      ))}

      {!filtered.length ? (
        <div style={{ opacity: 0.75, fontWeight: 900, padding: 20, textAlign: "center" }}>No apps match your search.</div>
      ) : null}
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
        <div style={{ fontWeight: 950 }}>Build: 2026.02.13</div>
        <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>
          AMPERE Demo v0.1.0. All platform connections are simulated for demo purposes.
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
  const recognitionRef = useRef<any>(null);

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
          setCmd(final.trim());
          setTranscript(final.trim());
          onCommand(final.trim());
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

  useEffect(() => {
    setFavPlatforms(profile.favoritePlatformIds);
    setFavLeagues(profile.favoriteLeagues);
    setFavTeams(profile.favoriteTeams);
    setPSearch("");
    setTSearch("");
  }, [profile]);

  const leaguesSelectable = LEAGUES.filter((l) => l !== "ALL");
  const platformsFiltered = useMemo(() => {
    const q = pSearch.trim().toLowerCase();
    const base = [...PLATFORMS].slice().sort((a, b) => a.label.localeCompare(b.label));
    if (!q) return base;
    return base.filter((p) => p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [pSearch]);

  const teamsBySelectedLeagues = useMemo(() => {
    const selected = favLeagues.length ? favLeagues : [];
    const out: { league: string; teams: string[] }[] = [];
    for (const l of selected) {
      const canon = canonicalLeagueForTeams(l) ?? l;
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

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950 }}>Favorite Platforms</div>
          <input
            value={pSearch}
            onChange={(e) => setPSearch(e.target.value)}
            placeholder="Filter platforms…"
            className="ampere-focus"
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 850,
              minWidth: 240,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {platformsFiltered.map((p) => (
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
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Favorite Leagues</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {leaguesSelectable.map((l) => (
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
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950 }}>Favorite Teams</div>
          <input
            value={tSearch}
            onChange={(e) => setTSearch(e.target.value)}
            placeholder="Filter teams…"
            className="ampere-focus"
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 850,
              minWidth: 240,
            }}
          />
        </div>

        {!favLeagues.length ? (
          <div style={{ opacity: 0.75, fontWeight: 900 }}>Select a league above to pick teams.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredTeamSections.map((sec) => (
              <div key={`teams_${sec.league}`} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 950, opacity: 0.92 }}>{sec.league}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {sec.teams.slice(0, 24).map((t) => (
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
                {sec.teams.length > 24 ? <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>Showing 24 of {sec.teams.length}. Refine with search.</div> : null}
              </div>
            ))}
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

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
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
            background: "rgba(58,167,255,0.12)",
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
  canNext,
  onFinish,
  onStartOver,
}: {
  isMobile: boolean;
  setupStep: 1 | 2 | 3 | 4 | 5;
  setSetupStep: (s: 1 | 2 | 3 | 4 | 5) => void;
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
  canNext: boolean;
  onFinish: () => void;
  onStartOver: () => void;
}) {
  const leaguesSelectable = LEAGUES.filter((l) => l !== "ALL");
  const sortedPlatforms = useMemo(() => [...PLATFORMS].slice().sort((a, b) => a.label.localeCompare(b.label)), []);

  const stepTitle =
    setupStep === 1 ? "Your Profile" : setupStep === 2 ? "Pick Platforms" : setupStep === 3 ? "Pick Leagues" : setupStep === 4 ? "Pick Teams" : "Review";

  const goNext = () => {
    if (!canNext) return;
    const n = Math.min(5, (setupStep + 1) as any) as any;
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
          <div style={{ opacity: 0.78, fontWeight: 900 }}>Progress: {setupStep}/5 • Autosaved</div>
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

      {/* STEP 2 */}
      {setupStep === 2 ? (
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

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 6 }}>
            {sortedPlatforms.map((p) => (
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
        </div>
      ) : null}

      {/* STEP 3 */}
      {setupStep === 3 ? (
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

      {/* STEP 4 */}
      {setupStep === 4 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
            Pick favorite teams (optional). Tip: use search to narrow.
          </div>

          <input
            value={wizTeamSearch}
            onChange={(e) => setWizTeamSearch(e.target.value)}
            placeholder="Search teams…"
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

          {!draftLeagues.length ? (
            <div style={{ opacity: 0.75, fontWeight: 900 }}>No leagues selected — teams are optional. Continue to Review.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {draftLeagues.map((l) => {
                const canon = canonicalLeagueForTeams(l) ?? l;
                const all = TEAMS_BY_LEAGUE[canon] ?? [];
                const q = normalizeKey(wizTeamSearch);
                const filtered = q ? all.filter((t) => normalizeKey(t).includes(q)) : all;

                const shown = wizShownByLeague[canon] ?? 4;
                const slice = filtered.slice(0, shown);
                const more = shown < filtered.length;

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
                        {draftTeams.length} team(s) selected
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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

      {/* STEP 5 */}
      {setupStep === 5 ? (
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
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap", marginTop: 4, position: "sticky", bottom: 0, background: "var(--panel-strong)", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)", zIndex: 5 }}>
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

        {setupStep < 5 ? (
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
      {setupStep === 2 && draftPlatforms.length === 0 ? (
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