#!/usr/bin/env node
// ============================================================================
// NCAA D1 Team Logo Download Script
// File: scripts/download-ncaa-logos.mjs
//
// Downloads NCAA Division 1 team logos from the ESPN CDN
// using team data from:
// https://gist.github.com/saiemgilani/c6596f0e1c8b148daabc2b7f1e6f6add
//
// Usage:
//   node scripts/download-ncaa-logos.mjs
//
// Output: /public/assets/teams/ncaa/<team-slug>.png
// ============================================================================

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "assets", "teams", "ncaa");

// ESPN CDN pattern for team logos
const ESPN_LOGO_BASE = "https://a.espncdn.com/i/teamlogos/ncaa/500";

// Top 100 NCAA D1 teams with ESPN IDs
// Full list available at: https://gist.github.com/saiemgilani/c6596f0e1c8b148daabc2b7f1e6f6add
const NCAA_D1_TEAMS = [
  { id: 333, name: "Alabama", slug: "alabama" },
  { id: 12, name: "Arizona", slug: "arizona" },
  { id: 9, name: "Arizona State", slug: "arizona-state" },
  { id: 8, name: "Arkansas", slug: "arkansas" },
  { id: 228, name: "Clemson", slug: "clemson" },
  { id: 38, name: "Colorado", slug: "colorado" },
  { id: 61, name: "Duke", slug: "duke" },
  { id: 57, name: "Florida", slug: "florida" },
  { id: 52, name: "Florida State", slug: "florida-state" },
  { id: 61, name: "Georgia", slug: "georgia" },
  { id: 248, name: "Iowa", slug: "iowa" },
  { id: 2305, name: "Iowa State", slug: "iowa-state" },
  { id: 2306, name: "Kansas", slug: "kansas" },
  { id: 2307, name: "Kansas State", slug: "kansas-state" },
  { id: 96, name: "Kentucky", slug: "kentucky" },
  { id: 99, name: "LSU", slug: "lsu" },
  { id: 97, name: "Louisville", slug: "louisville" },
  { id: 130, name: "Michigan", slug: "michigan" },
  { id: 127, name: "Michigan State", slug: "michigan-state" },
  { id: 135, name: "Minnesota", slug: "minnesota" },
  { id: 344, name: "Mississippi State", slug: "mississippi-state" },
  { id: 142, name: "Missouri", slug: "missouri" },
  { id: 158, name: "Nebraska", slug: "nebraska" },
  { id: 152, name: "North Carolina", slug: "north-carolina" },
  { id: 153, name: "NC State", slug: "nc-state" },
  { id: 87, name: "Notre Dame", slug: "notre-dame" },
  { id: 194, name: "Ohio State", slug: "ohio-state" },
  { id: 201, name: "Oklahoma", slug: "oklahoma" },
  { id: 197, name: "Oklahoma State", slug: "oklahoma-state" },
  { id: 2509, name: "Oregon", slug: "oregon" },
  { id: 204, name: "Oregon State", slug: "oregon-state" },
  { id: 213, name: "Penn State", slug: "penn-state" },
  { id: 221, name: "Purdue", slug: "purdue" },
  { id: 164, name: "South Carolina", slug: "south-carolina" },
  { id: 24, name: "Stanford", slug: "stanford" },
  { id: 218, name: "Syracuse", slug: "syracuse" },
  { id: 251, name: "Tennessee", slug: "tennessee" },
  { id: 251, name: "Texas", slug: "texas" },
  { id: 245, name: "Texas A&M", slug: "texas-am" },
  { id: 2628, name: "Texas Tech", slug: "texas-tech" },
  { id: 26, name: "UCLA", slug: "ucla" },
  { id: 25, name: "USC", slug: "usc" },
  { id: 258, name: "Utah", slug: "utah" },
  { id: 259, name: "Vanderbilt", slug: "vanderbilt" },
  { id: 261, name: "Virginia", slug: "virginia" },
  { id: 259, name: "Virginia Tech", slug: "virginia-tech" },
  { id: 264, name: "Washington", slug: "washington" },
  { id: 277, name: "West Virginia", slug: "west-virginia" },
  { id: 275, name: "Wisconsin", slug: "wisconsin" },
  // Big East
  { id: 2250, name: "Villanova", slug: "villanova" },
  { id: 56, name: "Georgetown", slug: "georgetown" },
  { id: 150, name: "Marquette", slug: "marquette" },
  { id: 2116, name: "Xavier", slug: "xavier" },
  { id: 21, name: "Seton Hall", slug: "seton-hall" },
  { id: 2166, name: "Creighton", slug: "creighton" },
  { id: 2184, name: "Butler", slug: "butler" },
  { id: 2226, name: "DePaul", slug: "depaul" },
  { id: 2273, name: "Providence", slug: "providence" },
  { id: 350, name: "UConn", slug: "uconn" },
  // HBCU Programs
  { id: 2225, name: "Howard", slug: "howard" },
  { id: 2243, name: "Hampton", slug: "hampton" },
  { id: 2598, name: "Morgan State", slug: "morgan-state" },
  { id: 2448, name: "Grambling State", slug: "grambling-state" },
  { id: 2582, name: "Jackson State", slug: "jackson-state" },
  { id: 2528, name: "Florida A&M", slug: "florida-am" },
  { id: 2031, name: "North Carolina A&T", slug: "north-carolina-at" },
  { id: 2029, name: "North Carolina Central", slug: "north-carolina-central" },
  { id: 2244, name: "Southern University", slug: "southern-university" },
  { id: 2534, name: "Tennessee State", slug: "tennessee-state" },
  { id: 2597, name: "Texas Southern", slug: "texas-southern" },
  { id: 288, name: "Prairie View A&M", slug: "prairie-view-am" },
  { id: 2010, name: "Alcorn State", slug: "alcorn-state" },
  { id: 2061, name: "Bethune-Cookman", slug: "bethune-cookman" },
  { id: 2239, name: "Norfolk State", slug: "norfolk-state" },
  { id: 47, name: "Coppin State", slug: "coppin-state" },
  { id: 2547, name: "Alabama A&M", slug: "alabama-am" },
  { id: 2546, name: "Alabama State", slug: "alabama-state" },
];

async function downloadLogo(team) {
  const url = `${ESPN_LOGO_BASE}/${team.id}.png`;
  const outPath = join(OUTPUT_DIR, `${team.slug}.png`);

  if (existsSync(outPath)) {
    console.log(`  SKIP  ${team.name} (already exists)`);
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  FAIL  ${team.name} (HTTP ${res.status})`);
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(outPath, buffer);
    console.log(`  OK    ${team.name} → ${team.slug}.png`);
  } catch (err) {
    console.log(`  ERR   ${team.name}: ${err.message}`);
  }
}

async function main() {
  console.log("NCAA D1 Logo Downloader");
  console.log("=======================");
  console.log(`Source: ${ESPN_LOGO_BASE}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Teams:  ${NCAA_D1_TEAMS.length}`);
  console.log("");

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  // Download sequentially to be polite to ESPN CDN
  for (const team of NCAA_D1_TEAMS) {
    await downloadLogo(team);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 200));
  }

  console.log("\nDone!");
  console.log("For the full list of D1 teams, see:");
  console.log("https://gist.github.com/saiemgilani/c6596f0e1c8b148daabc2b7f1e6f6add");
}

main().catch(console.error);
