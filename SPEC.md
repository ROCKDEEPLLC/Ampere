# SPEC: AMPÈRE (Ampere Two) — Comprehensive Implementation Plan (Safe / Branch-only)

> IMPORTANT:
> - Work only on a new git branch (no direct commits to `main`).
> - Before changing any feature, verify whether it is already complete.
> - If an item is already completed, mark it as **DONE (verified)** and do not touch it unless explicitly reopened.
> - Prefer additive changes and minimal diffs. Avoid broad refactors unless required by this spec.
> - All work must pass: `npm run build` (and `npm run lint` / `npm test` if present).
> - Use Vercel Preview deployments for validation. Do not deploy to production until approved.

---

## Environments
- Local: `http://localhost:3000`
- App demo route: `http://localhost:3000/prototype`
- Website route: `http://localhost:3000/`
- Production: `https://ampere-two.vercel.app/`
- Safe testing: Vercel Preview URLs (per PR)

---

## Project Commands (verify in package.json)
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint` (if present)
- Test: `npm test` (if present)

---

## Status Legend
- ✅ DONE (verified) — confirmed working in local + preview; do not modify further
- 🟡 IN PROGRESS — partially implemented; can be modified to complete
- ⬜ TODO — not implemented yet

---

## STATUS PASS (must be filled BEFORE coding)
For every item below:
- Verify in local (`localhost`) and in a Vercel Preview (per PR).
- If already complete, mark ✅ DONE (verified) and do not touch.

### Core App Roadmap Todos (from prior SPEC)
1) Sign-In / Sign-Up (Google, Email, typical options): ⬜
2) Power-On video behavior & duration (10s, correct asset): ✅ DONE (verified)
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
16) QWERTY board behavior (appear on focus, subtle animation): ✅ DONE (verified) — QwertyKeyboard component appears on focus with slide/fade animation, text box glows
17) Voice Command in Header (more conversational + voice response + multiple voices): ⬜
18) Mobile View – Favorites footer sticky Clear/Save buttons: ⬜
19) NCAA Conferences setup help + integrate provided logos into wizard options: ⬜
20) Pricing updates (Pro/Premium/Family/Ala-Carte/Solo/Family Add-On): ⬜
21) Game Day Sports Betting plan + Betting Companion feature set: ⬜
22) public/assets consistent file naming and folder rules: 🟡 IN PROGRESS

### March UPDATED Requests (additional UI + UX changes)  (source: March UPDATED Requests_.docx)
23) All Pill Buttons (every screen + dropdown):
   - Electric blue glow when user selects option
   - Allow more than one to glow where multi-select applies
   - If already implemented anywhere, mark DONE and apply consistently only where missing: ✅ DONE (verified) — PillButton component has glow; region filters, NavBtn, and Select All buttons now consistent

24) Voice Button (header):
   - Implement AI logical response
   - App reacts naturally to request
   - Optional/placeholder integration to “Dreamer AI” LLM (do not hardcode secrets): ⬜

25) ALL QWERTY Boards:
   - Consistent look across screens
   - Text box glows when user types: ✅ DONE (verified) — Single reusable QwertyKeyboard component used in 4 places; text box now glows on focus

26) Settings Dropdown restructuring:
   - Premium Hub section combined into “Pricing” dropdown section, then removed from dropdown
   - Make “Pricing Section” its own option in Settings dropdown
   - “Add Device” dropdown combined logically with “Connect Platforms”
   - Remove Pricing Plans from “Connect Platforms” dropdown and move into “Pricing Section”
   - If any duplicates exist with prior pricing/settings tasks, mark duplicate and continue: ⬜

27) Pricing Dropdown UI updates:
   - Each plan container proportionate
   - Add scroll options so user can see all info
   - À La Carte & Add-Ons section should be active
   - Color changes (all remain opaque):
     - Basic: seafoam green
     - Pro: ocean blue
     - Family: lavender
     - Premium: silver
     - Solo: cotton blue
     - Family Add-On: light canary yellow
     - Game Day Sports Betting: lighter green
   - If plan labels already updated elsewhere, do not re-edit copy; only adjust presentation: ⬜

28) Favorites location change:
   - Move “Favorites” from Settings dropdown to Profile dropdown: ⬜

29) Logos in Favorites and Live:
   - Connect Team logo images to pill buttons
   - Add League Logo image next to League name + count
     - Example: NFL (logo) 32; NBA (logo) 30: ⬜

30) Favorites selection controls:
   - Add “Select All” and “Deselect All” pill buttons on opposite corner (right corner): ⬜

31) Favorites footer container:
   - Clear button far left
   - Save Favorites far right
   - Container absolute bottom, no gap at bottom
   - Container styling mirrors header container that contains “Favorites” text: ⬜

32) Home Footer Screen — Preview Cards density:
   - For You / Live Now / Continue Watching / Trending show 2–3 preview cards per row
   - Add “Load More” per section to avoid overwhelming user: ⬜

33) Home Section — View Toggle:
   - Add View button/toggle
   - Add alternative “Guide” view
   - Guide view:
     - Top row time slots (sticky header)
     - Rows show Channel | League logo left
     - Program text middle
     - Preview card per platform/program appears above Guide as user scrolls
     - Guide view divided by sections:
       - Live Now, For You, Continue Watching, Trending: ⬜

34) Favs Footer Screen:
   - Favorite Genres & Platforms: connect logo images to pill buttons
   - For You section preview cards currently only two; size should adjust by viewport (mobile/tablet/desktop)
   - Likely fix: add additional preview cards in:
     - For You, Live Now, Continue Watching, Trending
   - Add View toggle + Guide view (same spec as Home): ⬜

35) Live Footer Screen:
   - Each section (Genre, Platform, League) should start with two rows of options
   - Add “Load More” on following row if applicable
   - League section: connect all logo images to pill buttons
   - Add View toggle + Guide view (same spec as Home): ⬜

36) Search Footer Screen:
   - Move Search section above Genre section
   - QWERTY board:
     - Text box should only appear when user begins typing in box (i.e., not visible by default): ⬜

---

# IMPLEMENTATION REQUIREMENTS (Grouped)

## A) Auth — Sign-In / Sign-Up
Goal:
- Add Google + Email + typical sign-in/sign-up.

Acceptance Criteria:
- Email sign-up/sign-in works.
- Google sign-in works.
- Clear error states.
- Auth persists across refresh.
- No secrets exposed client-side.

Agent checks:
- Verify env vars are configured safely.
- Ensure build passes and no server/client boundary mistakes.

---

## B) Power-On Video Fix (LOCKED: already DONE)
Status: ✅ DONE (verified) — Verified on `/prototype`; request uses `/assets/boot/power_on.mp4` and duration is 10s.

Rules:
- Do NOT change code/assets for this unless explicitly reopened.
- If any verification fails later, replace the file (not code) unless forced.

---

## C) Taste Engine Premium Layout
Goal:
- Arrange Taste Engine upgrades into a logical layout matching mockups.

Acceptance Criteria:
- Consistent hierarchy, scannable layout.
- If dropdowns need removal, functions remain available in layout.
- No regressions to DONE items.

Agent checks:
- Verify no duplicated controls.
- Verify mobile layout remains usable.

---

## D) Kid Mode
Rules:
- Activates for any profile labeled Kids.
- Only Kids Genre active for Kids profile.

Acceptance Criteria:
- Switching to Kids profile locks genres to Kids only.
- Other profiles unaffected.

---

## E) Switch Profile + Setup Wizard Integration
Requirements:
- Profile names come from Setup Wizard.
- New profile creation routes to Setup Wizard.
- PIN confirmation required for each profile except Kids and Guest.
- “Profile Settings” must be first option in Profile dropdown.

Acceptance Criteria:
- Profile list shows correct names.
- New profile creation always enters wizard.
- PIN confirm validates and is skipped for Kids/Guest.

---

## F) Setup Wizard Improvements
1) Back/Next background box rounded corners like buttons.
2) Multi-region selection (choose more than one).
3) Only show platforms/channels available in selected region(s).
4) Steps 3 & 4 of 6: start with three rows + “Load more”.
5) Step 5: leagues teams bug (shows “14 selected” but list empty).

Acceptance Criteria:
- UI matches rounding.
- Multi-region filter works.
- Load-more prevents overwhelm.
- Step 5 teams reliably render.

---

## G) Taste Engine: Export/Import + Explanations
Requirements:
- Export Taste button works.
- Import Taste clarified and functional.
- Brief explanation notes:
  - Import/Export
  - Discovery Contract (what it does)
  - Universal Queue (how it works)

Acceptance Criteria:
- Export downloads config file.
- Import accepts file and updates safely.
- Inline notes/tooltips exist.

---

## H) Time-To-Delight
Requirements:
- Context presets ordered low minutes → high minutes.
- Durations:
  - Quick Commute = 20m
  - Lunch Break = 30m
  - I’m cooking = 60m
  - Background Noise = 80m
- Remove AI icons; replace with blank placeholder rounded square.
- Document asset drop path + naming pattern:
  - `public/assets/placeholders/context/`
  - `context_<slug>.png` (or `.svg`)

Acceptance Criteria:
- Ordered list correct.
- Labels/durations correct.
- Placeholders appear consistently.

---

## I) Integrate into Taste Engine Layout
Integrate:
- Context Modes
- Remote Scenes
- Connect Ladder
- Live Pulse
- “Why This Pick?”

Acceptance Criteria:
- Accessible inside Taste Engine.
- No awkward navigation.
- No duplicated controls.

---

## J) Trust & Privacy
Move to Settings dropdown.

Acceptance Criteria:
- In Settings dropdown.
- Works on desktop + mobile.

---

## K) Family Profiles
Integrate with:
- Profile Settings
- Switch Profiles
- Setup Wizard per user

Acceptance Criteria:
- Profile management coherent.
- Each profile can run its own setup wizard.

---

## L) App Store
Requirements:
- Only show apps not installed OR not offered on home screen.
- Setup wizard prompt: offer download/subscribe to platforms matching favorites.

Acceptance Criteria:
- Filtered list correct.
- Wizard includes prompt and respects regions.

---

## M) TV Connection & Add Device
Requirements:
- One unified dropdown labeled “Add Device”.
- Include current industry connection methods where applicable.

Acceptance Criteria:
- One entry point.
- No misleading claims; only supported or clearly labeled as roadmap.

---

## N) Virtual TV Emulator
Requirements:
- Emulator live.
- CC button highlights when active.
- Language translator option for platforms lacking CC languages (MVP: UI + note ok).

Acceptance Criteria:
- Emulator functions in preview.
- CC toggle has visible active state.
- Translator option present.

---

## O) QWERTY Boards (Consolidated)
Requirements:
- Not visible by default; appears on focus / typing.
- Subtle animation.
- Consistent look across app.
- Text box glows when user types.

Acceptance Criteria:
- Works on mobile + desktop.
- Same component/styles reused across screens.

---

## P) Voice Command in Header (Consolidated)
Requirements:
- More conversational behavior.
- Add voice response option.
- Voice options: male / female / ambiguous.
- Implement AI logical response; app reacts naturally.
- Optional “Dreamer AI” LLM hookup:
  - MUST be behind env vars
  - MUST have safe stub behavior if not configured

Acceptance Criteria:
- User can choose voice type.
- Response can be spoken (or UI mock clearly labeled).
- No secrets committed.

---

## Q) Favorites UI/IA Changes (Consolidated)
Requirements:
- Move Favorites from Settings dropdown → Profile dropdown.
- League + team logos connected to pill buttons.
- League rows show logo + name + count.
- Add Select All / Deselect All on right corner.
- Sticky footer container:
  - Clear left, Save right
  - absolute bottom, no gap
  - styling matches header container on Favorites screen

Acceptance Criteria:
- Logos load (no 404).
- Footer always visible on scroll.
- Selection controls work.

---

## R) Preview Card Density + Load More (Home/Favs/Live)
Requirements:
- For You / Live Now / Continue Watching / Trending show 2–3 cards per row.
- Add “Load More” per section.

Acceptance Criteria:
- Responsive across breakpoints.
- Load More expands without layout breaking.

---

## S) Guide View Toggle (Home/Favs/Live)
Requirements:
- Add View toggle that switches current view ↔ Guide view.
- Guide view:
  - Sticky time-slot header row
  - Channel | league logo left
  - Program text middle
  - Preview card appears above guide while scrolling
  - Sections: Live Now / For You / Continue Watching / Trending

Acceptance Criteria:
- Toggle works.
- Sticky header works.
- Mobile usable.

---

## T) Search Screen Order + Keyboard Behavior
Requirements:
- Move Search section above Genre.
- Keyboard/text box only appears when user begins typing.

Acceptance Criteria:
- Search-first layout.
- Keyboard not visible by default.

---

## U) NCAA Conferences + Logos
Requirements:
- Define logical structure for NCAA conferences in setup wizard.
- Integrate provided conference + team logos.

Acceptance Criteria:
- Wizard shows conferences cleanly.
- Team mapping correct or fallback documented.

---

## V) Pricing Updates (Consolidated)
Requirements (Plan text + UI):
- Pro: up to 3 user profiles
- Premium: unlimited regional platform/channel options + additional features free for a year
- Family: $0.99/mo per additional profile + multi-profile + two regions
- Ala-Carte label:
  - Solo: $2.99/mo for 1 profile + everything in Pro
  - Family Add-On: $0.99/mo per additional profile
- Game Day Sports Betting plan: include feature bullets (manual tracking only)
- Pricing UI:
  - containers proportionate
  - scroll options so all info visible
  - À La Carte & Add-Ons active
  - Opaque color changes:
    - Basic: seafoam green
    - Pro: ocean blue
    - Family: lavender
    - Premium: silver
    - Solo: cotton blue
    - Family Add-On: light canary yellow
    - Game Day Sports Betting: lighter green

Acceptance Criteria:
- Correct copy and layout.
- Mobile layout not broken.

---

## W) Betting Companion (Manual tracking only; no partnerships)
Guardrails:
- Manual bet tracking only (no sportsbook linking, no wager placement APIs)
- Feature flag: `BETTING_COMPANION_ENABLED`

MVP Scope:
- Local storage persistence with schema versioning + migration stub
- Bets Provider context: CRUD, selectors, P/L
- Bets Drawer: badge, filters, add/paste/import/export JSON+CSV
- Add Bet from game cards (prefilled event context)
- Overlay for active bets per event
- In-app alerts MVP (+ optional Notifications API)
- Pricing demo gating (“Ultimate: Betting Companion” add-on)

Acceptance Criteria:
- Works in preview without backend.
- Strict TypeScript correctness.
- Manual test:
  - add bet → drawer → overlay → clone → settle → export → deep link

---

## X) All Pill Buttons — Electric Blue Glow (Global Consistency)
Requirements:
- All pill buttons across screens and dropdowns:
  - electric blue glow when selected
  - allow multi-glow where multi-select is valid

Acceptance Criteria:
- Consistent styling.
- Selection states correct (single-select vs multi-select).

---

## Y) Settings Dropdown Restructure (Consolidated)
Requirements:
- Premium Hub merged into Pricing section; remove Premium Hub after merge.
- Pricing section becomes its own option in Settings dropdown.
- Add Device combined with Connect Platforms dropdown.
- Remove pricing plans from Connect Platforms dropdown and move into Pricing section.

Acceptance Criteria:
- Clean IA: no duplicate pricing.
- No broken links/actions.

---

## Z) public/assets Naming & 404 Elimination
Goal:
- Eliminate asset 404 spam and standardize naming.
Convention:
- lowercase
- kebab-case
- no spaces
- stable grouping by feature

Deliverables:
- Implement canonical structure and update references.
- Add `docs/ASSETS.md` with rules and examples.

Proposed structure:
public/assets/
  boot/
    power_on.mp4
  brand/
    ampere-long.png
    ampere-short.png
  icons/
    header/
    footer/
  genres/
    <genre-slug>.png
  leagues/
    <league-slug>.png
  conferences/
    ncaa/
      <conference-slug>.png
  teams/
    <league-slug>/
      <team-slug>.png

Acceptance Criteria:
- No mixed naming.
- No broken images/videos.
- Minimal, safe ref updates.

---

# AMPÈRE WEBSITE SPEC (ampere.io) — Must Not Break /prototype

## Routing
- `/` = Marketing site (App-like theme, informational)
- `/prototype` = App demo (must remain functional)
- `/pricing` = Pricing detail + CTA
- `/subscribe` = Checkout landing (Stripe-ready, can be stubbed)
- `/support` = Support + contact
- `/privacy` = Privacy policy
- `/terms` = Terms
- `/company` = Company + Digital Booty
- `/press` (optional) = Media kit
- `/status` (optional) = Service status stub

Placement rules:
- Marketing pages: `app/(site)/...`
- App demo: `app/prototype/...`
- `(site)` must not break `/prototype`.

Agent checks:
- `/prototype` still compiles and loads.
- `/` renders site layout and is styled.
- No shared component changes break `/prototype`.

## IA / Header + Footer
Header:
- AMPÈRE logo + wordmark
- Nav: Product, Taste Engine, Universal Queue, Time-to-Delight, Add Device, Pricing, Company, Support
- CTAs: View Plans, Subscribe

Footer:
- AMPÈRE + “Powered by Digital Booty”
- Links: Privacy, Terms, Support, Press (optional)
- Social (optional)

## Visual System
- Dark glass + blur panels, electric blue accents
- “Home screen” feel: tiles/rails, pill buttons, subtle animations
- Respect reduced motion

## Page requirements (minimum)
- `/` Home: hero, signature mechanic, rails, trust section, pricing preview, FAQ preview, CTA
- `/product`: what it is, how it works, screenshots
- `/taste-engine`: controls, explainability, portability, roadmap labels
- `/universal-queue`: watch later, availability ladder, notify rules
- `/time-to-delight`: time picker, presets, explanation
- `/add-device`: device ladder, virtual tv emulator explanation
- `/pricing`: full plans + disclaimers
- `/subscribe`: plan chooser + Stripe-ready stub + email capture
- `/company`: AMPÈRE + Digital Booty
- `/support`: help topics + contact
- `/privacy` and `/terms`: templates for counsel

SEO:
- Titles/descriptions, OG tags, favicon
- Sitemap + robots.txt

Performance:
- Avoid giant media on first paint
- No 404s

Deployment:
- Vercel preview for every PR

Regression checklist (every PR):
- `npm run dev` works
- `npm run build` passes
- `/` loads (website)
- `/prototype` loads (app)
- No new console errors
- No 404 spam
- No broken imports/aliases

---

# DUPLICATION RULE
If any task appears more than once in this spec:
- Mark the later instance as “Duplicate of <section/item>”
- Do not re-implement
- Continue to the next task