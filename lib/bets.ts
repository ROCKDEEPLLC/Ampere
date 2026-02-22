// ============================================================================
// AMPÈRE BETTING COMPANION — Data Model, State, P&L Tracking
// File: lib/bets.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export type BetStatus = "open" | "won" | "lost" | "push" | "void";
export type BetTag = "Straight" | "Parlay" | "Props" | "Live" | "Futures" | "Teaser";

export interface Bet {
  id: string;
  /** The matchup / event title, e.g. "Lakers vs Celtics" */
  title: string;
  /** Pick line, e.g. "Lakers -3.5" or "Over 215.5" */
  pick: string;
  /** American odds, e.g. -110, +150 */
  odds: number;
  /** Stake in dollars */
  stake: number;
  /** Potential payout (computed from odds + stake) */
  payout: number;
  /** Current status */
  status: BetStatus;
  /** Tags for categorization */
  tags: BetTag[];
  /** Free-form notes */
  notes: string;
  /** Linked game/event ID from sports API (optional) */
  eventId?: string;
  /** League, e.g. "NBA", "NFL" */
  league?: string;
  /** Platform / sportsbook label */
  sportsbook?: string;
  /** Timestamps */
  createdAt: number;
  settledAt?: number;
}

export interface BankrollState {
  /** Starting bankroll amount for the current session */
  startingBankroll: number;
  /** Cumulative deposits */
  deposits: number;
  /** Last updated timestamp */
  updatedAt: number;
}

export interface BetStats {
  totalBets: number;
  openBets: number;
  wonBets: number;
  lostBets: number;
  pushBets: number;
  totalStaked: number;
  totalPayout: number;
  netPL: number;
  winRate: number; // percentage 0-100
  roi: number; // percentage
  todayPL: number;
  weekPL: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const BETS_KEY = "ampere.bets.v1";
const BANKROLL_KEY = "ampere.bankroll.v1";

// ============================================================================
// ODDS HELPERS
// ============================================================================

/**
 * Convert American odds to decimal payout multiplier.
 * e.g. -110 → 1.909, +150 → 2.5
 */
export function americanToDecimal(odds: number): number {
  if (odds > 0) return (odds / 100) + 1;
  return (100 / Math.abs(odds)) + 1;
}

/**
 * Compute payout from stake + American odds.
 */
export function computePayout(stake: number, odds: number): number {
  return Math.round(stake * americanToDecimal(odds) * 100) / 100;
}

/**
 * Format American odds with sign, e.g. -110 → "-110", 150 → "+150"
 */
export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

// ============================================================================
// BET CRUD
// ============================================================================

export function getAllBets(): Bet[] {
  return loadJson<Bet[]>(BETS_KEY) ?? [];
}

function saveBets(bets: Bet[]): void {
  saveJson(BETS_KEY, bets);
}

export function getOpenBets(): Bet[] {
  return getAllBets().filter((b) => b.status === "open");
}

export function getSettledBets(): Bet[] {
  return getAllBets().filter((b) => b.status !== "open");
}

export function addBet(draft: {
  title: string;
  pick: string;
  odds: number;
  stake: number;
  tags?: BetTag[];
  notes?: string;
  eventId?: string;
  league?: string;
  sportsbook?: string;
}): Bet {
  const payout = computePayout(draft.stake, draft.odds);
  const bet: Bet = {
    id: `bet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: draft.title,
    pick: draft.pick,
    odds: draft.odds,
    stake: draft.stake,
    payout,
    status: "open",
    tags: draft.tags ?? ["Straight"],
    notes: draft.notes ?? "",
    eventId: draft.eventId,
    league: draft.league,
    sportsbook: draft.sportsbook,
    createdAt: Date.now(),
  };
  const bets = getAllBets();
  bets.unshift(bet);
  saveBets(bets);
  addLog("bet_added", { id: bet.id, title: bet.title, stake: bet.stake, odds: bet.odds });
  return bet;
}

export function settleBet(betId: string, result: "won" | "lost" | "push" | "void"): Bet | null {
  const bets = getAllBets();
  const idx = bets.findIndex((b) => b.id === betId);
  if (idx === -1) return null;
  bets[idx].status = result;
  bets[idx].settledAt = Date.now();
  saveBets(bets);
  addLog("bet_settled", { id: betId, result });
  return bets[idx];
}

export function removeBet(betId: string): void {
  const bets = getAllBets().filter((b) => b.id !== betId);
  saveBets(bets);
  addLog("bet_removed", { id: betId });
}

export function cloneBet(betId: string): Bet | null {
  const bets = getAllBets();
  const source = bets.find((b) => b.id === betId);
  if (!source) return null;
  return addBet({
    title: source.title,
    pick: source.pick,
    odds: source.odds,
    stake: source.stake,
    tags: [...source.tags],
    notes: source.notes,
    eventId: source.eventId,
    league: source.league,
    sportsbook: source.sportsbook,
  });
}

export function updateBetNotes(betId: string, notes: string): void {
  const bets = getAllBets();
  const bet = bets.find((b) => b.id === betId);
  if (bet) {
    bet.notes = notes;
    saveBets(bets);
  }
}

// ============================================================================
// BANKROLL
// ============================================================================

export function getBankrollState(): BankrollState {
  return loadJson<BankrollState>(BANKROLL_KEY) ?? { startingBankroll: 0, deposits: 0, updatedAt: 0 };
}

export function setBankroll(amount: number): BankrollState {
  const state: BankrollState = { startingBankroll: amount, deposits: 0, updatedAt: Date.now() };
  saveJson(BANKROLL_KEY, state);
  addLog("bankroll_set", { amount });
  return state;
}

// ============================================================================
// STATS / P&L
// ============================================================================

export function computeStats(bets?: Bet[]): BetStats {
  const all = bets ?? getAllBets();
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

  const settled = all.filter((b) => b.status !== "open");
  const won = settled.filter((b) => b.status === "won");
  const lost = settled.filter((b) => b.status === "lost");
  const push = settled.filter((b) => b.status === "push");

  const totalStaked = settled.reduce((s, b) => s + b.stake, 0);
  const totalPayout = won.reduce((s, b) => s + b.payout, 0) + push.reduce((s, b) => s + b.stake, 0);
  const netPL = totalPayout - totalStaked;

  const todaySettled = settled.filter((b) => (b.settledAt ?? 0) >= todayStart);
  const todayPL = todaySettled.reduce((s, b) => {
    if (b.status === "won") return s + (b.payout - b.stake);
    if (b.status === "lost") return s - b.stake;
    return s;
  }, 0);

  const weekSettled = settled.filter((b) => (b.settledAt ?? 0) >= weekStart);
  const weekPL = weekSettled.reduce((s, b) => {
    if (b.status === "won") return s + (b.payout - b.stake);
    if (b.status === "lost") return s - b.stake;
    return s;
  }, 0);

  const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;
  const roi = totalStaked > 0 ? (netPL / totalStaked) * 100 : 0;

  return {
    totalBets: all.length,
    openBets: all.filter((b) => b.status === "open").length,
    wonBets: won.length,
    lostBets: lost.length,
    pushBets: push.length,
    totalStaked,
    totalPayout,
    netPL,
    winRate,
    roi,
    todayPL,
    weekPL,
  };
}

// ============================================================================
// PASTE-TO-ADD PARSER
// ============================================================================

/**
 * Parse multi-line text into bet drafts.
 * Accepts lines like: "Lakers -3.5 -110 $25" or "Over 215.5 +100 $10 #Props"
 */
export function parseBetSlipText(text: string): Array<{
  title: string;
  pick: string;
  odds: number;
  stake: number;
  tags: BetTag[];
}> {
  const results: Array<{ title: string; pick: string; odds: number; stake: number; tags: BetTag[] }> = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Extract tags (#Props, #Live, etc.)
    const tagMatches = line.match(/#(\w+)/g);
    const tags: BetTag[] = [];
    if (tagMatches) {
      for (const t of tagMatches) {
        const tag = t.slice(1);
        if (["Straight", "Parlay", "Props", "Live", "Futures", "Teaser"].includes(tag)) {
          tags.push(tag as BetTag);
        }
      }
    }
    const clean = line.replace(/#\w+/g, "").trim();

    // Try to match: <pick text> <odds> $<stake>
    const match = clean.match(/^(.+?)\s+([+-]\d+)\s+\$(\d+(?:\.\d+)?)$/);
    if (match) {
      results.push({
        title: "",
        pick: match[1].trim(),
        odds: parseInt(match[2], 10),
        stake: parseFloat(match[3]),
        tags: tags.length > 0 ? tags : ["Straight"],
      });
    }
  }

  return results;
}

// ============================================================================
// EXPORT
// ============================================================================

export function exportBetsJSON(): string {
  const bets = getAllBets();
  const stats = computeStats(bets);
  const bankroll = getBankrollState();
  return JSON.stringify({ version: 1, exportedAt: Date.now(), bets, stats, bankroll }, null, 2);
}

export function exportBetsCSV(): string {
  const bets = getAllBets();
  const header = "ID,Title,Pick,Odds,Stake,Payout,Status,Tags,League,Sportsbook,Notes,Created,Settled";
  const rows = bets.map((b) => [
    b.id,
    `"${b.title.replace(/"/g, '""')}"`,
    `"${b.pick.replace(/"/g, '""')}"`,
    b.odds,
    b.stake,
    b.payout,
    b.status,
    `"${b.tags.join(", ")}"`,
    b.league ?? "",
    b.sportsbook ?? "",
    `"${b.notes.replace(/"/g, '""')}"`,
    new Date(b.createdAt).toISOString(),
    b.settledAt ? new Date(b.settledAt).toISOString() : "",
  ].join(","));
  return [header, ...rows].join("\n");
}

// ============================================================================
// QUICK STAKE OPTIONS
// ============================================================================

export const QUICK_STAKES = [5, 10, 25, 50, 100] as const;
export type QuickStake = typeof QUICK_STAKES[number];
