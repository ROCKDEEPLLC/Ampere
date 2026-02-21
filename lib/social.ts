// ============================================================================
// AMPÈRE SOCIAL — Micro-circles, Decision Rooms, Co-watch (Phase 4)
// File: lib/social.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export interface SocialProfile {
  id: string;
  name: string;
  avatar?: string;
  topGenres: string[];
  topPlatforms: string[];
}

export interface MicroCircle {
  id: string;
  name: string;
  members: SocialProfile[];
  tasteOverlap: TasteOverlap;
  createdAt: number;
}

export interface TasteOverlap {
  sharedGenres: string[];
  sharedPlatforms: string[];
  overlapScore: number; // 0-100
  uniqueToYou: string[];
  uniqueToThem: string[];
}

export interface DecisionRoom {
  id: string;
  circleId: string;
  circleName: string;
  status: "voting" | "decided" | "watching";
  options: DecisionOption[];
  winner?: DecisionOption;
  createdAt: number;
}

export interface DecisionOption {
  contentId: string;
  title: string;
  platformId: string;
  genre: string;
  votes: string[]; // profile IDs
  reason?: string; // AI-generated compromise reason
}

export interface CoWatchPrompt {
  id: string;
  circleId: string;
  suggestedTitle: string;
  suggestedPlatform: string;
  reason: string;
  respondedBy: string[];
  createdAt: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const SOCIAL_KEY = "ampere.social.v1";

export interface SocialState {
  circles: MicroCircle[];
  rooms: DecisionRoom[];
  coWatchPrompts: CoWatchPrompt[];
}

export function getSocialState(): SocialState {
  const saved = loadJson<SocialState>(SOCIAL_KEY);
  if (saved && Array.isArray(saved.circles)) return saved;
  return { circles: [], rooms: [], coWatchPrompts: [] };
}

export function saveSocialState(state: SocialState): void {
  saveJson(SOCIAL_KEY, state);
}

// ============================================================================
// MICRO-CIRCLES
// ============================================================================

export function createCircle(name: string, members: SocialProfile[]): MicroCircle {
  const overlap = computeTasteOverlap(members);
  const circle: MicroCircle = {
    id: `circle_${Date.now()}`,
    name,
    members,
    tasteOverlap: overlap,
    createdAt: Date.now(),
  };
  const state = getSocialState();
  state.circles.push(circle);
  saveSocialState(state);
  addLog("social_circle_create", { name, memberCount: members.length });
  return circle;
}

function computeTasteOverlap(members: SocialProfile[]): TasteOverlap {
  if (members.length < 2) return { sharedGenres: [], sharedPlatforms: [], overlapScore: 0, uniqueToYou: [], uniqueToThem: [] };

  const allGenres = members.map((m) => new Set(m.topGenres));
  const allPlatforms = members.map((m) => new Set(m.topPlatforms));

  const sharedGenres = [...allGenres[0]].filter((g) => allGenres.every((s) => s.has(g)));
  const sharedPlatforms = [...allPlatforms[0]].filter((p) => allPlatforms.every((s) => s.has(p)));

  const totalUnique = new Set(members.flatMap((m) => [...m.topGenres, ...m.topPlatforms])).size;
  const sharedCount = sharedGenres.length + sharedPlatforms.length;
  const overlapScore = totalUnique > 0 ? Math.round((sharedCount / totalUnique) * 100) : 0;

  return {
    sharedGenres,
    sharedPlatforms,
    overlapScore,
    uniqueToYou: members[0].topGenres.filter((g) => !sharedGenres.includes(g)),
    uniqueToThem: members.length > 1 ? members[1].topGenres.filter((g) => !sharedGenres.includes(g)) : [],
  };
}

// ============================================================================
// DECISION ROOMS
// ============================================================================

export function createDecisionRoom(circleId: string, options: Omit<DecisionOption, "votes">[]): DecisionRoom {
  const state = getSocialState();
  const circle = state.circles.find((c) => c.id === circleId);
  const room: DecisionRoom = {
    id: `room_${Date.now()}`,
    circleId,
    circleName: circle?.name ?? "Unknown",
    status: "voting",
    options: options.map((o) => ({ ...o, votes: [] })),
    createdAt: Date.now(),
  };
  state.rooms.push(room);
  saveSocialState(state);
  addLog("social_room_create", { circleId, optionCount: options.length });
  return room;
}

export function voteInRoom(roomId: string, optionIndex: number, voterId: string): void {
  const state = getSocialState();
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room || room.status !== "voting") return;

  // Remove previous vote by this voter
  for (const opt of room.options) {
    opt.votes = opt.votes.filter((v) => v !== voterId);
  }
  // Add new vote
  if (room.options[optionIndex]) {
    room.options[optionIndex].votes.push(voterId);
  }
  saveSocialState(state);
  addLog("social_vote", { roomId, optionIndex, voterId });
}

export function decideRoom(roomId: string): DecisionOption | null {
  const state = getSocialState();
  const room = state.rooms.find((r) => r.id === roomId);
  if (!room) return null;

  // Pick winner by most votes
  const sorted = [...room.options].sort((a, b) => b.votes.length - a.votes.length);
  const winner = sorted[0];
  if (winner) {
    winner.reason = `Chosen by ${winner.votes.length} votes — best overlap for the group`;
    room.winner = winner;
    room.status = "decided";
    saveSocialState(state);
    addLog("social_room_decide", { roomId, winner: winner.title });
  }
  return winner ?? null;
}

// ============================================================================
// CO-WATCH PROMPTS
// ============================================================================

export function sendCoWatchPrompt(circleId: string, title: string, platform: string, reason: string): CoWatchPrompt {
  const state = getSocialState();
  const prompt: CoWatchPrompt = {
    id: `cw_${Date.now()}`,
    circleId,
    suggestedTitle: title,
    suggestedPlatform: platform,
    reason,
    respondedBy: [],
    createdAt: Date.now(),
  };
  state.coWatchPrompts.push(prompt);
  saveSocialState(state);
  addLog("social_cowatch_send", { circleId, title });
  return prompt;
}

// ============================================================================
// DEMO DATA
// ============================================================================

export function getDemoCircles(): MicroCircle[] {
  return [
    {
      id: "demo_circle_1",
      name: "Movie Night Crew",
      members: [
        { id: "me", name: "You", topGenres: ["Movies", "Basic", "Documentaries"], topPlatforms: ["netflix", "max", "criterion"] },
        { id: "friend1", name: "Alex", topGenres: ["Movies", "Horror / Cult", "Basic"], topPlatforms: ["netflix", "shudder", "max"] },
        { id: "friend2", name: "Jordan", topGenres: ["Movies", "Arthouse", "Documentaries"], topPlatforms: ["criterion", "mubi", "netflix"] },
      ],
      tasteOverlap: { sharedGenres: ["Movies"], sharedPlatforms: ["netflix"], overlapScore: 42, uniqueToYou: ["Basic", "Documentaries"], uniqueToThem: ["Horror / Cult", "Arthouse"] },
      createdAt: Date.now() - 604800000,
    },
    {
      id: "demo_circle_2",
      name: "Sports Squad",
      members: [
        { id: "me", name: "You", topGenres: ["Sports", "LiveTV"], topPlatforms: ["espnplus", "youtubetv"] },
        { id: "friend3", name: "Sam", topGenres: ["Sports", "Gaming"], topPlatforms: ["espnplus", "twitch"] },
      ],
      tasteOverlap: { sharedGenres: ["Sports"], sharedPlatforms: ["espnplus"], overlapScore: 55, uniqueToYou: ["LiveTV"], uniqueToThem: ["Gaming"] },
      createdAt: Date.now() - 1209600000,
    },
  ];
}
