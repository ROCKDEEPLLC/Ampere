# SPEC: Ampere Two – Implementation Plan (Safe / Branch-only)

## Guardrails (Do Not Break These)
1. Work only on a new git branch (no direct commits to `main`).
2. Before changing any feature, first verify whether it is already complete.
3. If an item is already completed, mark it as **DONE (verified)** and do not touch its code, assets, or UI unless explicitly reopened.
4. Prefer additive changes and minimal diffs. Avoid broad refactors unless required by this spec.
5. All work must pass: `npm run build` (and `npm run lint` / `npm test` if present).
6. Use Vercel Preview deployments for validation. Do not deploy to production until approved.

## Environments
- Local: `http://localhost:3000`
- Production: `https://ampere-two.vercel.app/`
- Target for safe testing: Vercel Preview URLs (per PR)

## Project Commands (verify in package.json)
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint` (if present)
- Test: `npm test` (if present)

## Status Legend
- ✅ DONE (verified) — confirmed working in local + preview; do not modify further
- 🟡 IN PROGRESS — partially implemented; can be modified to complete
- ⬜ TODO — not implemented yet

> IMPORTANT: At the start of work, create a “Status Pass” section below and assign each item a status.

---

## Status Pass (to be filled before coding)
Fill each line with ✅ / 🟡 / ⬜ and a short verification note (where/how verified).

1) Sign-In / Sign-Up (Google, Email, typical options): ⬜
2) Power-On video behavior & duration (10s, correct asset): ⬜
3) Premium “Taste Engine” upgrades layout update to match mockups: ⬜
4) Kid Mode dropdown logic for Kids profiles: ⬜
5) Switch Profile dropdown (names from Setup Wizard; new profiles route to wizard; PIN confirm rules): ⬜
6) Profile Settings in profile dropdown moved to first option: ⬜
7) Set-Up Wizard improvements (rounded boxes; multi-region; region-filtered platforms; load more; teams loading bug): ⬜
8) Taste Engine buttons + explanation notes (Export/Import/Discovery Contract/Universal Queue): ⬜
9) Time-To-Delight preset order + updated durations; replace AI icons with placeholder + add image drop path: ⬜
10) Context Presets/Modes/Remote Scenes/Connect Ladder/Live Pulse/Why This Pick integration into Taste Engine layout: ⬜
11) Trust & Privacy moved to settings dropdown: ⬜
12) Family Profiles integration (Profile Settings + Switch Profiles + Setup Wizard flow): ⬜
13) App Store filtering (only non-installed) + add install/subscription prompt during wizard: ⬜
14) TV Connection & Add Device combined dropdown labeled “Add Device” + industry connection methods: ⬜
15) Virtual TV Emulator live; CC button highlights; language translator option for streams without CC languages: ⬜
16) QWERTY board behavior (appear on focus, subtle animation): ⬜
17) Voice Command in Header (more conversational + voice response + multiple voices): ⬜
18) Mobile View – Favorites footer sticky Clear/Save buttons: ⬜
19) NCAA Conferences setup help + integrate provided logos into wizard options: ⬜
20) Pricing updates (Pro/Premium/Family/Ala-Carte/Solo/Family Add-On): ⬜
21) Game Day Sports Betting plan + Betting Companion feature set: ⬜
22) public/assets consistent file naming and folder rules: ⬜

---

# Implementation Requirements

## A) Sign-In / Sign-Up
### Goal
Add Google + Email + typical sign-in/sign-up registration options.
### Acceptance Criteria
- User can sign up/sign in with Email.
- User can sign in with Google.
- Error states shown clearly (invalid email, wrong password, cancelled OAuth).
- Auth state persists across refresh.
- No secrets are exposed to the client (server-side keys only).

## B) Power-On Video Fix
### Issues
- Not working at `http://localhost:3000/prototype`
- Old video loads in production
- Must be 10 seconds long
- Correct file: `public/assets/boot/power_on.mp4`
### Acceptance Criteria
- `prototype` route always uses `public/assets/boot/power_on.mp4`
- Production serves the correct file (cache-safe)
- Playback duration is 10 seconds (clip or playback control if source differs)
- No broken paths; no stale caching after deploy

## C) Taste Engine Premium Layout (match mockups)
### Goal
Arrange “Taste Engine” upgrades into a logical layout similar to provided mockups.
### Acceptance Criteria
- Layout is consistent and readable
- If dropdowns should be removed, the function is integrated into the layout
- No regressions to existing features already marked DONE

## D) Kid Mode Dropdown Section
### Goal
Kid Mode activates for any profile labeled as kids.
### Rules
- Only Kids Genre is active for Kids Profile.
### Acceptance Criteria
- Switching to Kids profile automatically filters/locks genres to Kids only
- Non-kids profiles unaffected

## E) Switch Profile Dropdown + Setup Wizard Integration
### Requirements
- Each profile has a name pulled from Setup Wizard results
- Creating a new profile routes user into Setup Wizard
- PIN confirmation required for each profile except Kids and Guest
- “Profile Settings” must be first option in Profile dropdown
### Acceptance Criteria
- Profile list shows correct names
- New profile creation reliably starts wizard
- PIN confirm appears and validates
- Kids/Guest bypass PIN confirm

## F) Set-Up Wizard Improvements
1) Back/Next background boxes have rounded corners like buttons
2) Allow selecting more than one region
3) Only show streaming platforms/channels available in chosen region(s)
4) Steps 3 & 4: start with 3 rows + “Load more”
5) Step 5: leagues teams bug (shows “14 selected” but no teams list)
### Acceptance Criteria
- UI matches rounding requirement
- Multi-region selection works and filters platform list
- Load-more prevents overwhelming UI
- Step 5 team list reliably renders for selected leagues

## G) Taste Engine: Export/Import + Explanations
### Requirements
- Export Taste button works (define behavior)
- Import Taste: clarify purpose; if importing from file, implement
- Add brief explanation notes:
  - Import/Export
  - Discovery Contract (explain functional purpose)
  - Universal Queue (explain how it works)
### Acceptance Criteria
- Export downloads a file (or copies to clipboard) with user taste config
- Import accepts that file and updates taste config safely
- UI includes short explanatory text tooltips or inline notes

## H) Time-To-Delight
### Requirements
- Context presets ordered low minutes → high minutes
- Rename durations:
  - “Lunch Break” = 30m
  - “Quick Commute” = 20m
  - “I’m cooking” = 60m
  - “Background Noise” = 80m
- Remove AI icons; replace with blank placeholder rounded square
- Provide folder path + filename pattern for placeholder images
### Acceptance Criteria
- Preset list is ordered correctly
- Updated labels/durations match
- Placeholder icons show consistently
- Documented asset drop location:
  - `public/assets/placeholders/context/`
  - naming pattern: `context_<slug>.png` (or `.svg`)

## I) Integrate features into Taste Engine layout
Integrate into overall Taste Engine layout:
- Context Modes
- Remote Scenes
- Connect Ladder
- Live Pulse
- “Why This Pick?”
### Acceptance Criteria
- Features accessible from Taste Engine without awkward navigation
- Consistent layout hierarchy and spacing
- No duplicated controls

## J) Trust & Privacy
Move to settings dropdown.
### Acceptance Criteria
- Present in Settings dropdown
- Works on desktop + mobile

## K) Family Profiles
Integrate with:
- Profile Settings
- Switch Profiles
- Setup Wizard per user
### Acceptance Criteria
- Family profile management is coherent and connected to wizard flow
- Each user profile can complete its own setup wizard

## L) App Store
### Requirements
- Only show apps not already installed OR already offered on home screen
- In setup wizard: prompt user if they want to download/subscribe to platforms matching favorites
### Acceptance Criteria
- App store list is filtered correctly
- Setup wizard includes install prompt and respects region/platform availability

## M) TV Connection & Add Device
### Requirements
- Combine into one dropdown section labeled “Add Device”
- Include current industry connection methods (where applicable)
### Acceptance Criteria
- One unified entry point
- Options list is sensible and not misleading (only show what is supported)

## N) Virtual TV Emulator
### Requirements
- Make emulator function live
- CC button should visually indicate active state
- Add language translator option for streams/platforms lacking CC languages
### Acceptance Criteria
- Emulator works in preview
- CC toggles on/off with UI state
- Translator option exists (MVP: UI + explanatory note if no backend yet)

## O) QWERTY Board
### Requirements
- Appears only when text box focused
- Subtle animation on appearance
### Acceptance Criteria
- Not visible by default
- Appears on focus with animation
- Works on mobile view

## P) Voice Command in Header
### Requirements
- Make more conversational
- Add voice response option
- Provide voice options: male/female/ambiguous
### Acceptance Criteria
- User can choose voice type
- Voice response plays (or mock implemented with clear UI if MVP)

## Q) Mobile View – Favorites Sticky Footer
### Requirements
- “Clear” and “Save Favorites” sticky and always visible when scrolling
### Acceptance Criteria
- Buttons remain accessible on mobile scroll

## R) NCAA Conferences (Setup Wizard options)
### Requirements
- Help define logical setup structure for NCAA conferences
- Integrate added logos for conferences and teams into wizard options
### Acceptance Criteria
- Wizard shows conferences cleanly
- Teams map to conferences correctly (or documented fallback if incomplete dataset)

## S) Pricing Updates
### Requirements
- Update plan texts:
  - Pro: up to 3 user profiles
  - Premium: unlimited regional streaming options + additional Ampère features free for a year
  - Family: $0.99/mo per additional profile + multi-profile + two regions
  - Ala-Carte label
  - Solo: $2.99/mo 1 profile + everything in Pro
  - Family Add-On: $0.99/mo per additional profile
- Add “Game Day Sports Betting” plan and feature bullets
### Acceptance Criteria
- Pricing UI displays accurately and consistently
- No broken layout in mobile

## T) Betting Companion (No partnerships; manual tracking only)
### Guardrails
- Manual bet tracking only (no sportsbook linking, no wager placement APIs)
- Feature flag: `BETTING_COMPANION_ENABLED` toggle per environment
### MVP Scope
- Local storage persistence with schema versioning + migration stub
- Bets Provider context with CRUD, selectors, P/L calculations
- Bets Drawer UI with badge, filters, add/paste/import/export (JSON+CSV)
- Add Bet from game cards with prefilled event context
- Overlay showing active bets for event while browsing/watching
- In-app alerts MVP (optional browser notifications if permission granted)
- Pricing UI demo gating (“Ultimate: Betting Companion” add-on)
### Acceptance Criteria
- Works fully in preview with no backend dependency
- No build errors; strict TypeScript correctness
- Manual test script passes:
  - add bet → drawer → overlay → clone → settle → export → sportsbook deep link

## U) public/assets Consistent File Naming
### Goal
Implement consistent file names in `public/assets/*`.
### Proposed Convention
- lowercase
- kebab-case
- no spaces
- stable folder grouping by feature
### Acceptance Criteria
- No mixed naming styles
- References updated safely (no broken images/videos)
- Add a short `ASSETS.md` doc with naming rules + examples

---

# Definition of Done (DoD)
- All updated items implemented per acceptance criteria
- `npm run build` passes
- Preview deployment link shared for validation
- Minimal diffs; no changes to items marked ✅ DONE (verified)