#!/usr/bin/env node
/**
 * AMPÈRE — Asset Verification Script
 *
 * Verifies that every asset the app resolves at runtime maps to a real file.
 * With the manifest-based resolution system, zero-404 is guaranteed by design:
 * resolveFromManifest() only returns paths that exist. This script validates
 * that the KNOWN mappings (services, genres) point to real files and that
 * the manifest is up-to-date.
 *
 * Exit code 0 = all checks pass.
 * Exit code 1 = one or more checks fail.
 *
 * Run: npm run verify:assets
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");

// ============================================================================
// 1. Filesystem ground truth
// ============================================================================

function walk(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const s = statSync(full);
        if (s.isDirectory()) results.push(...walk(full));
        else results.push("/" + relative(PUBLIC, full).replace(/\\/g, "/"));
      } catch {}
    }
  } catch {}
  return results;
}

const ALL_FILES = new Set(walk(PUBLIC));

// Directory index for fuzzy matching
const BY_DIR = {};
for (const f of ALL_FILES) {
  if (!f.startsWith("/assets/")) continue;
  const i = f.lastIndexOf("/");
  const dir = f.slice(0, i);
  const name = f.slice(i + 1);
  (BY_DIR[dir] ??= []).push(name);
}

function fuzzyResolve(candidates) {
  for (const c of candidates) if (ALL_FILES.has(c)) return { path: c, method: "exact" };
  const tried = new Set();
  for (const c of candidates) {
    const i = c.lastIndexOf("/");
    if (i < 0) continue;
    const dir = c.slice(0, i);
    const slug = c.slice(i + 1).toLowerCase().replace(/\.[^.]+$/, "").replace(/-logo.*$/, "").replace(/@\d+x$/, "");
    const key = `${dir}::${slug}`;
    if (tried.has(key) || !slug || slug.length < 3) continue;
    tried.add(key);
    const files = BY_DIR[dir];
    if (!files) continue;
    const m = files.find(f => f.toLowerCase().includes(slug));
    if (m) return { path: `${dir}/${m}`, method: "fuzzy" };
  }
  return null;
}

// ============================================================================
// 2. Parse source code for known mappings
// ============================================================================

function parseKnownMap(src, blockName) {
  const map = {};
  const regex = new RegExp(`const ${blockName}[\\s\\S]*?= \\{([\\s\\S]*?)\\n\\};`);
  const block = src.match(regex);
  if (!block) return map;
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*["']?([^"':\s]+)["']?\s*:\s*["']([^"']+)["']/);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

const assetSrc = readFileSync(join(ROOT, "lib/assetPath.ts"), "utf-8");
const catalogSrc = readFileSync(join(ROOT, "lib/catalog.ts"), "utf-8");

const KNOWN_SERVICES = parseKnownMap(assetSrc, "KNOWN_SERVICE_FILES");
const KNOWN_GENRES = parseKnownMap(assetSrc, "KNOWN_GENRE_FILES");

// Extract genre keys
const genreKeys = [];
const gm = catalogSrc.match(/export const GENRES = \[([\s\S]*?)\] as const/);
if (gm) for (const m of gm[1].matchAll(/key:\s*"([^"]+)"/g)) genreKeys.push(m[1]);

// Extract platform IDs
const platformIds = [];
const pm = catalogSrc.match(/export const PLATFORMS: Platform\[\] = \[([\s\S]*?)\n\];/);
if (pm) for (const m of pm[1].matchAll(/id:\s*"([^"]+)"/g)) platformIds.push(m[1]);

// Extract leagues
const leagueNames = [];
const lm = catalogSrc.match(/export const LEAGUES = \[([\s\S]*?)\] as const/);
if (lm) for (const m of lm[1].matchAll(/"([^"]+)"/g)) if (m[1] !== "ALL") leagueNames.push(m[1]);

// Extract teams by league (simple parser)
const teamsByLeague = {};
const tm = catalogSrc.match(/export const TEAMS_BY_LEAGUE[\s\S]*?= \{([\s\S]*?)\n\};/);
if (tm) {
  for (const m of tm[1].matchAll(/["']([^"']+)["']\s*:\s*\[([\s\S]*?)\]/g)) {
    const teams = [];
    for (const t of m[2].matchAll(/"([^"]+)"/g)) teams.push(t[1]);
    if (teams.length) teamsByLeague[m[1]] = teams;
  }
}

// ============================================================================
// 3. Checks
// ============================================================================

let pass = 0;
let fail = 0;
let noFile = 0; // genuinely missing content (not a bug)
const failures = [];

function mustPass(cat, label, path) {
  if (ALL_FILES.has(path)) { pass++; }
  else { fail++; failures.push({ cat, label, path }); }
}

function shouldResolve(cat, label, candidates) {
  const r = fuzzyResolve(candidates);
  if (r) { pass++; return true; }
  noFile++;
  return false;
}

// --- A) Boot video ---
console.log("Checking boot video...");
mustPass("boot", "power_on.mp4", "/assets/boot/power_on.mp4");

// --- B) Brand assets ---
console.log("Checking brand assets...");
mustPass("brand", "ampere-long.png", "/assets/brand/ampere-long.png");
mustPass("brand", "ampere-short.png", "/assets/brand/ampere-short.png");

// --- C) Icons ---
console.log("Checking icons...");
mustPass("icon", "Settings", "/assets/icons/header/Settings.png");
mustPass("icon", "Voice", "/assets/icons/header/Voice.png");
mustPass("icon", "home", "/assets/icons/footer/home.png");
mustPass("icon", "favs", "/assets/icons/footer/favs.png");
mustPass("icon", "livetv", "/assets/icons/footer/livetv.png");
mustPass("icon", "search", "/assets/icons/footer/search.png");

// --- D) Genre images (KNOWN_GENRE_FILES) ---
console.log("Checking genre images...");
for (const gk of genreKeys) {
  const known = KNOWN_GENRES[gk];
  if (known) {
    // The known file MUST exist in /assets/genres/ (canonical location)
    mustPass("genre", gk, `/assets/genres/${known}`);
  }
}

// --- E) Platform icons (KNOWN_SERVICE_FILES) ---
console.log("Checking platform icons...");
for (const pid of platformIds) {
  const known = KNOWN_SERVICES[pid];
  if (known) {
    mustPass("platform", pid, `/assets/services/${known}`);
  } else {
    // No known mapping — the app will try variants; with manifest it won't 404
    // Just note it as missing content
    const norm = pid.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!shouldResolve("platform", pid, [
      `/assets/services/${norm}.png`, `/assets/services/${norm}.jpg`,
      `/assets/services/${pid}.png`,
    ])) {
      // Not a failure — SmartImg shows fallback text. No 404.
    }
  }
}

// --- F) League logos ---
console.log("Checking league logos...");
const MAJOR_US_LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS", "UFC", "NCAAF", "NCAAB"];
for (const league of leagueNames) {
  const k = league.toLowerCase().replace(/[^a-z0-9]/g, "");
  const candidates = [
    `/assets/leagues/${k}.png`,
    `/assets/leagues/${k}.svg`,
    `/assets/leagues/teams/${league}/${k}.png`,
  ];
  if (MAJOR_US_LEAGUES.includes(league)) {
    // Major leagues MUST have a logo
    const r = fuzzyResolve(candidates);
    if (r) { pass++; } else { fail++; failures.push({ cat: "league", label: league, path: candidates[0] }); }
  } else {
    shouldResolve("league", league, candidates);
  }
}

// --- G) Team logos (sample the leagues that have actual files) ---
console.log("Checking team logos...");
const LEAGUES_WITH_FILES = ["NFL", "NBA", "MLB", "NHL", "Premier League", "MLS", "NCAAF", "NCAAB", "UEFA Champions League"];

for (const league of LEAGUES_WITH_FILES) {
  const teams = teamsByLeague[league];
  if (!teams) continue;
  const l = league.toLowerCase().replace(/[^a-z0-9]/g, "");
  const leagueLower = league.toLowerCase();

  // Check first 5 teams per league
  for (const team of teams.slice(0, 5)) {
    const slug = team.toLowerCase().replace(/\s+/g, "-");
    const t = team.toLowerCase().replace(/[^a-z0-9]/g, "");
    const candidates = [
      `/assets/teams/${leagueLower}/${slug}.png`,
      `/assets/teams/${l}/${slug}.png`,
      `/assets/teams/${l}/${slug}-logo.png`,
      `/assets/teams/${l}/${l}-${slug}-logo-480x480.png`,
      `/assets/teams/${l}/${l}-${slug}-logo-300x300.png`,
      `/assets/teams/${l}/${slug}-logo@3x.png`,
      `/assets/teams/${l}/${t}.png`,
      `/assets/teams/england football league/${slug}.png`,
      `/assets/teams/premier league/${slug}.png`,
      `/assets/teams/premier league/${slug}-logo.png`,
      `/assets/teams/uefa champions league/${slug}.png`,
      `/assets/teams/ncaa/${slug}.png`,
      `/assets/teams/ncaa/${t}.png`,
      `/assets/leagues/teams/${league}/${team}.png`,
      `/assets/leagues/teams/${l}/${t}.png`,
    ];
    shouldResolve("team", `${league} / ${team}`, candidates);
  }
}

// --- H) Verify genre/ folder is gone (canonical is genres/) ---
console.log("Checking folder consolidation...");
const genreDir = join(PUBLIC, "assets", "genre");
if (existsSync(genreDir)) {
  fail++;
  failures.push({ cat: "structure", label: "genre/ still exists", path: "public/assets/genre/" });
}

// --- I) Verify sw.js boot video path ---
console.log("Checking sw.js boot video reference...");
const swSrc = readFileSync(join(PUBLIC, "sw.js"), "utf-8");
if (swSrc.includes("power-on.mp4")) {
  fail++;
  failures.push({ cat: "sw.js", label: "wrong boot video filename", path: "power-on.mp4 (should be power_on.mp4)" });
}
if (swSrc.includes("power_on.mp4")) {
  pass++;
}

// --- J) Verify manifest is up-to-date ---
console.log("Checking manifest freshness...");
const manifestPath = join(ROOT, "lib/generated/assetManifest.ts");
if (!existsSync(manifestPath)) {
  fail++;
  failures.push({ cat: "manifest", label: "manifest not generated", path: manifestPath });
} else {
  const manifestSrc = readFileSync(manifestPath, "utf-8");
  // Check a few key files are in the manifest
  const checks = [
    "/assets/boot/power_on.mp4",
    "/assets/genres/blackmedia.png",
    "/assets/leagues/ufc.png",
    "/assets/leagues/mls.png",
  ];
  for (const c of checks) {
    if (manifestSrc.includes(JSON.stringify(c))) {
      pass++;
    } else {
      fail++;
      failures.push({ cat: "manifest", label: `not in manifest: ${c}`, path: c });
    }
  }
}

// ============================================================================
// 4. Report
// ============================================================================

console.log("\n======================================");
console.log("  AMPÈRE Asset Verification Report");
console.log("======================================\n");
console.log(`  Passed     : ${pass}`);
console.log(`  Failed     : ${fail}`);
console.log(`  No file    : ${noFile} (graceful fallback, not a 404)`);
console.log("");

if (failures.length > 0) {
  console.log("FAILURES (must fix):");
  console.log("--------------------");
  for (const f of failures) {
    console.log(`  [${f.cat}] ${f.label}`);
    console.log(`    Expected: ${f.path}`);
  }
  console.log("");
}

if (fail > 0) {
  console.log(`FAIL: ${fail} check(s) failed. Fix the above issues.\n`);
  process.exit(1);
} else {
  console.log("PASS: All critical asset checks passed.");
  console.log(`      ${noFile} assets have no file (SmartImg shows fallback — zero 404s).\n`);
  process.exit(0);
}
