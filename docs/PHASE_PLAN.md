# AMPERE Phase Plan

> Last updated: 2026-02-19
> This document tracks every requested feature across all phases.
> Items are only removed when proven DONE with code evidence.

---

## Phase 1 — Demo Polish (THIS UPDATE) ✅

All items in this phase are implemented in the current codebase.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1.1 | Canonical IDs for providers/platforms | DONE | `lib/catalog.ts` — 80+ platform IDs |
| 1.2 | Vertical scroll content with locked header/footer | DONE | `PrototypeClient.tsx:2176-2700` — header/footer sticky, main scrollable |
| 1.3 | Grid previews (no horizontal scrollbars) | DONE | `CardGrid` component uses CSS grid |
| 1.4 | Search submit fixed + inline results | DONE | `PrototypeClient.tsx:1731-1900` — QWERTY keyboard, submit, inline results |
| 1.5 | Accessibility improvements | DONE | `ampere-focus` class, aria-labels, keyboard nav |
| 1.6 | Better demo dataset coverage for all genres/platforms | DONE | 16 genres, 80+ platforms, 400+ teams |
| 1.7 | Header image upload | DONE | SetupWizard Step 5 — profile + header photo |
| 1.8 | Ampere Button rounded corners (header + Power On) | DONE | `PrototypeClient.tsx:2226` borderRadius `50%`, `:2076` borderRadius `999` |
| 1.9 | QWERTY glow on keypress | DONE | `PrototypeClient.tsx:1733` pressedKey state, `:2551-2587` glow effect |
| 1.10 | CSS padding/longhand conflicts fixed | DONE | Header `:2178-2182`, footer `:2684-2689` — explicit longhand props |
| 1.11 | About AMPÈRE unicode fixed | DONE | `:2282` — actual UTF-8 È character |
| 1.12 | Fox Sports logo fixed | DONE | `assetPath.ts` — foxsports1 → `all.png` |
| 1.13 | Power On video extended to 15s loop | DONE | `PrototypeClient.tsx:2092-2103` — loop + 15s timer |
| 1.14 | Vistazo genre + 12 Latino platforms | DONE | `catalog.ts` — ViX, Fubo Latino, ESPN Deportes, etc. |
| 1.15 | South American football leagues (11) + full rosters | DONE | `catalog.ts` — 194 teams across 11 leagues |
| 1.16 | TV Connect plans (Basic/Pro/Family) | DONE | `lib/tvConnect.ts` + `PrototypeClient.tsx:3131-3189` |
| 1.17 | TV Connect real architecture (mDNS/SSDP/CEC/vendor APIs) | DONE | `lib/tvConnect.ts` — TVDiscoveryService, VENDOR_CONFIGS for 11 brands |
| 1.18 | InstantSwitch controller | DONE | `lib/instantSwitch.ts` — preload, suspend, resume, sub-300ms switching |
| 1.19 | Parental Controls (PIN, filters, time limits, activity log, Kid Mode) | DONE | `lib/parentalControls.ts` — ParentalControlsManager class |
| 1.20 | Auth Token Manager (platform-specific OAuth) | DONE | `lib/authTokenManager.ts` — per-platform handlers, refresh scheduler |
| 1.21 | Federated Search Service | DONE | `lib/federatedSearch.ts` — parallel search, caching, content indexer |
| 1.22 | Stream Resource Manager (memory leak fix) | DONE | `lib/streamResourceManager.ts` — proper teardown, monitoring, GC |
| 1.23 | Security baseline (RBAC, validation, rate limiting, headers, audit) | DONE | `lib/security.ts` + `next.config.ts` — full security architecture |
| 1.24 | Secure logging with token redaction (Bug #1 fix) | DONE | `lib/streamResourceManager.ts:secureLog()` — regex-based redaction |
| 1.25 | Global Regional Options (8 regions, 32 languages) | DONE | `lib/globalRegions.ts` — GLOBAL_REGIONS, LANGUAGES, translation prefs |
| 1.26 | Global sports leagues (Europe, Africa, Asia, Oceania) | DONE | `catalog.ts` — Premier League, Bundesliga, Serie A, La Liga, J-League, K-League, A-League, NRL, AFL, etc. |
| 1.27 | American Sports teams with RSN/team-specific streaming | DONE | `catalog.ts` — 17 RSN platforms + TEAM_RSN_MAP (30+ teams) |
| 1.28 | NCAA D1 team logo source + URL generator | DONE | `assetPath.ts` — NCAA_LOGO_GIST_URL, ncaaLogoFromESPN(), ncaa paths |
| 1.29 | Team logos in game preview cards | DONE | `PrototypeClient.tsx:1296-1299` — team logos next to league/platform |
| 1.30 | Security headers in Next.js config | DONE | `next.config.ts` — HSTS, X-Frame-Options, CSP headers |

---

## Phase 2 — Production Foundations

**Scope:** Backend server, database, real authentication, multi-device sync.
**Dependencies:** Hosting provider, database service (Supabase recommended).
**Risk:** Breaking change from client-only to client-server architecture.

| # | Item | Status | Dependencies | Acceptance Criteria |
|---|------|--------|--------------|---------------------|
| 2.1 | Accounts + database (Supabase Auth + Postgres) | NOT STARTED | Supabase project setup, env vars | Users can sign up, sign in, sign out; data persisted in Postgres |
| 2.2 | Server-side profile storage + multi-device sync | NOT STARTED | 2.1 | Profile syncs across devices within 5s |
| 2.3 | Secure handoff endpoint with provider allowlist | NOT STARTED | 2.1 | Platform URLs validated against allowlist before redirect |
| 2.4 | Security headers + rate limiting + input validation (production) | PARTIAL | 2.1 | Headers in next.config.ts (done); server-side rate limiting needs API routes |
| 2.5 | Password hashing with Argon2id | NOT STARTED | 2.1, argon2 npm package | Passwords stored with Argon2id, never plaintext |
| 2.6 | MFA (TOTP + email fallback) | NOT STARTED | 2.1 | Users can enable MFA; login requires 2FA code |
| 2.7 | RBAC enforcement at API layer | NOT STARTED | 2.1 | All API routes check server-side claims; default deny |
| 2.8 | Session management (httpOnly secure cookies) | NOT STARTED | 2.1 | Sessions use httpOnly, secure, sameSite cookies |
| 2.9 | JWT with short-lived access + refresh token rotation | NOT STARTED | 2.1 | Access token 15min, refresh 7d, rotation on use |
| 2.10 | Server-side input validation (schema-based) | NOT STARTED | 2.1 | All API request bodies validated against Zod/Joi schemas |
| 2.11 | Rate limiting (per IP + per user + per route) | NOT STARTED | 2.1 | Login: 5/15min, API: 60/min, signup: 3/hr |
| 2.12 | Secrets management (KMS integration) | NOT STARTED | Cloud provider KMS | Secrets never in code; rotated every 90 days |
| 2.13 | Audit logging (tamper-resistant) | NOT STARTED | 2.1 | Auth events logged; no PII/tokens in logs |
| 2.14 | Dependency scanning (SCA) | NOT STARTED | CI/CD pipeline | `npm audit` in CI; no critical vulnerabilities |
| 2.15 | Global Region selection in Setup Wizard | PARTIAL | lib/globalRegions.ts (done) | Wizard shows region picker; filters platforms by region |
| 2.16 | Language translation option in UI | NOT STARTED | i18n library (next-intl recommended) | UI text translatable; user can override content language |
| 2.17 | App Store UI for local/niche platforms | NOT STARTED | lib/globalRegions.ts (done) | Users can browse and add local platforms from App Store |
| 2.18 | PIN-protected profile switching (production) | PARTIAL | lib/parentalControls.ts (done) | Real PIN entry UI; profile switching requires PIN |
| 2.19 | Kid Mode UI with simplified navigation | NOT STARTED | lib/parentalControls.ts (done) | Restricted nav, approved content only, custom background |
| 2.20 | Download NCAA D1 logos from gist to assets | NOT STARTED | Script to fetch from gist JSON | Logos stored in /public/assets/teams/ncaa/ |

---

## Phase 3 — Notifications & Device Integration

**Scope:** Push notifications, real data feeds, TV control, casting.
**Dependencies:** Phase 2 complete, native companion app for TV control.
**Risk:** TV vendor API access requires developer program enrollment per brand.

| # | Item | Status | Dependencies | Acceptance Criteria |
|---|------|--------|--------------|---------------------|
| 3.1 | Push notifications pipeline (rules, quiet hours) | NOT STARTED | 2.1, service worker | Users receive game start, new episode notifications |
| 3.2 | Real schedules/sports data ingestion | NOT STARTED | Sports API (ESPN, TheSportsDB) | Live scores, schedules update in real-time |
| 3.3 | Casting/deeplinks/TV device control | NOT STARTED | Native companion app | App can discover, pair, and send commands to smart TVs |
| 3.4 | Real InstantSwitch integration | NOT STARTED | Native app, platform SDKs | Sub-300ms switching on supported platforms |
| 3.5 | Real federated search (live API queries) | NOT STARTED | Platform API partnerships | Search returns real results from connected platforms |
| 3.6 | Auth Token Manager (production) | PARTIAL | Platform OAuth credentials | Tokens refreshed proactively; no session drops |
| 3.7 | Stream Resource Manager (production) | PARTIAL | Native app runtime | Memory monitored; streams properly torn down |
| 3.8 | CEC/eARC HDMI control | NOT STARTED | HDMI-CEC hardware access | Power, volume, input control via HDMI |
| 3.9 | Voice control (production-grade) | NOT STARTED | Speech API or custom model | Voice commands control playback, navigation |
| 3.10 | Offline cached schedules | NOT STARTED | Service worker, IndexedDB | Schedules available offline; sync when online |

---

## Phase 4 — Personalization v2

**Scope:** AI recommendations, social features, advanced personalization.
**Dependencies:** Phase 2-3 complete, ML infrastructure.
**Risk:** Privacy considerations for recommendation engine.

| # | Item | Status | Dependencies | Acceptance Criteria |
|---|------|--------|--------------|---------------------|
| 4.1 | Server-side personalization model (privacy-aware) | NOT STARTED | 2.1, ML service | Recommendations based on viewing history; no PII leakage |
| 4.2 | "Not interested" / block lists / pinned rails | NOT STARTED | 2.1 | Users can dismiss, block, and pin content |
| 4.3 | AI-powered cross-platform recommendations | NOT STARTED | 4.1 | Unified recommendations across all connected platforms |
| 4.4 | Social features: watch parties | NOT STARTED | 2.1, WebRTC/WebSocket | Friends can watch together in sync |
| 4.5 | Social features: friend recommendations | NOT STARTED | 2.1 | Users can share and recommend content to friends |
| 4.6 | Extended device support (game consoles, VR) | NOT STARTED | Platform SDKs | App runs on Xbox, PlayStation, Meta Quest |
| 4.7 | Content creator partnerships | NOT STARTED | Business development | Exclusive integrations with content creators |
| 4.8 | Global expansion beyond US market | PARTIAL | lib/globalRegions.ts (done) | Platform data for 8 regions; actual availability TBD |

---

## Technology Status Matrix

| Technology | Implemented? | Phase | Evidence |
|-----------|-------------|-------|----------|
| InstantSwitch Controller | Architecture only | Phase 1 (arch), Phase 3 (production) | `lib/instantSwitch.ts` |
| Parental Controls | Architecture + types | Phase 1 (arch), Phase 2 (UI) | `lib/parentalControls.ts` |
| Auth Token Manager | Architecture only | Phase 1 (arch), Phase 3 (production) | `lib/authTokenManager.ts` |
| Federated Search | Architecture only | Phase 1 (arch), Phase 3 (production) | `lib/federatedSearch.ts` |
| Stream Resource Manager | Architecture only | Phase 1 (arch), Phase 3 (production) | `lib/streamResourceManager.ts` |
| TV Connect / Discovery | Architecture + demo | Phase 1 (arch), Phase 3 (production) | `lib/tvConnect.ts` |
| Security Baseline | Architecture + headers | Phase 1 (arch+headers), Phase 2 (server) | `lib/security.ts`, `next.config.ts` |
| Global Regions | Data layer complete | Phase 1 (data), Phase 2 (UI integration) | `lib/globalRegions.ts` |

---

## Bug Fix Status

| Bug | Description | Status | Evidence |
|-----|------------|--------|----------|
| #1 | Auth Token Leakage — tokens logged in plaintext | FIXED | `lib/streamResourceManager.ts:secureLog()` — regex redaction |
| #2 | Memory Leak During Rapid Switching | FIXED (architecture) | `lib/streamResourceManager.ts` — proper teardown, monitoring |

---

## Notes

- All architecture files (`lib/*.ts`) define interfaces, types, and simulation-ready classes
- Production integration requires Phase 2 (backend) and Phase 3 (native app) work
- Platform API integrations require developer program enrollment with each vendor
- NCAA D1 logos: Source gist at `https://gist.github.com/saiemgilani/c6596f0e1c8b148daabc2b7f1e6f6add`; download script needed for Phase 2
- Security: Client-side security headers are active now; server-side enforcement requires API routes (Phase 2)
