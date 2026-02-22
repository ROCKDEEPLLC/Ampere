// ============================================================================
// AMPÈRE PREMIUM PLAN — Plan Model + Gating + Storage
// File: lib/premiumPlan.ts
// ============================================================================

import { loadJson, saveJson } from "./storage";
import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export type PlanTier = "basic" | "pro" | "family" | "premium" | "solo" | "family_addon" | "gameday";

export interface PlanState {
  plan: PlanTier;
  isActive: boolean;
  since: number; // timestamp
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  price: string;
  priceNum: number;
  badge?: string;
  color: string;
  features: string[];
  maxProfiles: number;
  maxTVs: number;
  includesInstantSwitch: boolean;
  includesVoice: boolean;
  includesParentalControls: boolean;
  includesPremiumFeatures: boolean;
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const PLAN_KEY = "ampere.plan.v1";

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    priceNum: 0,
    color: "rgba(255,255,255,0.08)",
    features: [
      "Web remote control",
      "Manual platform switching",
      "Viewing history",
      "Up to 3 platforms",
      "Device connection (QR, Hub, Cloud)",
      "Virtual TV Emulator",
    ],
    maxProfiles: 1,
    maxTVs: 1,
    includesInstantSwitch: false,
    includesVoice: false,
    includesParentalControls: false,
    includesPremiumFeatures: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$4.99/mo",
    priceNum: 4.99,
    badge: "POPULAR",
    color: "rgba(58,167,255,0.10)",
    features: [
      "InstantSwitch (< 300ms)",
      "Voice & gesture control",
      "Unlimited platforms",
      "Sports Hub + Game Day Mode",
      "Up to 3 user profiles",
    ],
    maxProfiles: 3,
    maxTVs: 3,
    includesInstantSwitch: true,
    includesVoice: true,
    includesParentalControls: false,
    includesPremiumFeatures: false,
  },
  {
    id: "family",
    name: "Family",
    price: "$7.99/mo",
    priceNum: 7.99,
    color: "rgba(138,43,226,0.10)",
    features: [
      "Everything in Pro",
      "Multi-profile support",
      "Two Regional Streaming Platform / Channel Options",
      "Parental controls + Kid Mode",
      "$.99/mo per additional user profile",
      "Offline cached schedules",
      "Priority support",
    ],
    maxProfiles: 5,
    maxTVs: 5,
    includesInstantSwitch: true,
    includesVoice: true,
    includesParentalControls: true,
    includesPremiumFeatures: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$9.99/mo",
    priceNum: 9.99,
    badge: "BEST VALUE",
    color: "rgba(255,179,0,0.12)",
    features: [
      "Everything in Pro + Family",
      "Up to 6 profiles",
      "Unlimited Regional Streaming Platform / Channel Options",
      "Additional Ampère Features Free for a year",
      "Taste Engine + Why This Pick",
      "Universal Queue + Availability",
      "Time-to-Delight ranking",
      "Context Modes + Remote Scenes",
      "Connect Platforms Level 2 & 3",
      "Trust/Privacy/Portability vault",
      "Monthly Taste Packs",
      "One-click Export Vault",
      "Social features (coming soon)",
      "Live Pulse + Alerts (coming soon)",
      "Semantic Search (coming soon)",
    ],
    maxProfiles: 6,
    maxTVs: 10,
    includesInstantSwitch: true,
    includesVoice: true,
    includesParentalControls: true,
    includesPremiumFeatures: true,
  },
];

// ============================================================================
// À LA CARTE / ADD-ON PLAN DEFINITIONS
// ============================================================================

export interface AddOnPlanDefinition {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  badge?: string;
  color: string;
  features: string[];
  category: "ala_carte" | "addon";
}

export const ADDON_PLAN_DEFINITIONS: AddOnPlanDefinition[] = [
  {
    id: "solo",
    name: "Solo Plan",
    price: "$2.99/mo",
    priceNum: 2.99,
    color: "rgba(58,167,255,0.08)",
    category: "ala_carte",
    features: [
      "1 user profile",
      "Everything in Pro Plan",
    ],
  },
  {
    id: "family_addon",
    name: "Family Add-On",
    price: "$0.99/mo per profile",
    priceNum: 0.99,
    color: "rgba(138,43,226,0.08)",
    category: "ala_carte",
    features: [
      "$.99/mo per additional user profile",
      "Add profiles to any existing plan",
    ],
  },
  {
    id: "gameday",
    name: "Game Day Sports Betting",
    price: "$4.99/mo",
    priceNum: 4.99,
    badge: "NEW",
    color: "rgba(0,200,80,0.10)",
    category: "addon",
    features: [
      "Includes everything in all other plans",
      'One-tap "Add Bet" from any game card',
      "Bets Drawer always available while watching",
      "Quick stake buttons ($5/$10/$25/$50/$100) + American odds",
      "Paste-to-add bet slip (multi-line parsing)",
      "Game-linked bet overlay on matchups",
      "Smart reminders: game start / halftime / settle alerts",
      "Quick settle + P/L tracking (Win/Loss/Push)",
      "Bankroll + session stats (Today/Week P&L, win rate, ROI)",
      "Tags & notes per bet (Props, Live, Parlays)",
      'Clone bet (one-tap "add similar bet")',
      "Export tools: JSON + CSV for taxes",
    ],
  },
];

export function getAllAddOnDefinitions(): AddOnPlanDefinition[] {
  return ADDON_PLAN_DEFINITIONS;
}

// ============================================================================
// PLAN TIER ORDERING (for comparisons)
// ============================================================================

const TIER_ORDER: Record<PlanTier, number> = {
  basic: 0,
  solo: 1,
  pro: 1,
  family: 2,
  family_addon: 2,
  premium: 3,
  gameday: 4,
};

// ============================================================================
// PLAN STATE MANAGEMENT
// ============================================================================

export function getPlanState(): PlanState {
  const saved = loadJson<PlanState>(PLAN_KEY);
  if (saved && saved.plan && typeof saved.isActive === "boolean") return saved;
  return { plan: "basic", isActive: true, since: Date.now() };
}

export function setPlanState(plan: PlanTier): PlanState {
  const state: PlanState = { plan, isActive: true, since: Date.now() };
  saveJson(PLAN_KEY, state);
  addLog("plan_changed", { plan, since: state.since });
  return state;
}

// ============================================================================
// GATING UTILITIES
// ============================================================================

export function isPremium(state?: PlanState): boolean {
  const s = state ?? getPlanState();
  return s.isActive && s.plan === "premium";
}

export function isPlanAtLeast(tier: PlanTier, state?: PlanState): boolean {
  const s = state ?? getPlanState();
  if (!s.isActive) return tier === "basic";
  return TIER_ORDER[s.plan] >= TIER_ORDER[tier];
}

export function canAccessFeature(feature: PremiumFeature, state?: PlanState): boolean {
  const s = state ?? getPlanState();
  const gate = FEATURE_GATES[feature];
  if (!gate) return true; // unknown feature = ungated
  return isPlanAtLeast(gate, s);
}

// ============================================================================
// FEATURE GATE MAP
// ============================================================================

export type PremiumFeature =
  | "taste_engine"
  | "why_this_pick"
  | "universal_queue"
  | "time_to_delight"
  | "modes"
  | "remote_scenes"
  | "connect_level2"
  | "connect_level3"
  | "trust_portability"
  | "family_profiles"
  | "social"
  | "live_pulse"
  | "semantic_search"
  | "premium_hub"
  | "export_vault"
  | "taste_packs"
  | "early_access"
  | "scene_packs"
  | "priority_support"
  // Freemium features (always allowed)
  | "add_device"
  | "virtual_emulator"
  | "connect_level1"
  | "device_connection";

export const FEATURE_GATES: Record<PremiumFeature, PlanTier> = {
  // Premium-only features
  taste_engine: "premium",
  why_this_pick: "premium",
  universal_queue: "premium",
  time_to_delight: "premium",
  modes: "premium",
  remote_scenes: "premium",
  connect_level2: "premium",
  connect_level3: "premium",
  trust_portability: "premium",
  social: "premium",
  live_pulse: "premium",
  semantic_search: "premium",
  premium_hub: "premium",
  export_vault: "premium",
  taste_packs: "premium",
  early_access: "premium",
  scene_packs: "premium",
  priority_support: "premium",
  // Family tier
  family_profiles: "family",
  // Freemium (basic) — everyone gets these
  add_device: "basic",
  virtual_emulator: "basic",
  connect_level1: "basic",
  device_connection: "basic",
};

// ============================================================================
// PLAN DEFINITION HELPERS
// ============================================================================

export function getPlanDefinition(tier: PlanTier): PlanDefinition {
  return PLAN_DEFINITIONS.find((p) => p.id === tier) ?? PLAN_DEFINITIONS[0];
}

export function getAllPlanDefinitions(): PlanDefinition[] {
  return PLAN_DEFINITIONS;
}

// ============================================================================
// TASTE PACKS (Premium perk — loadable config layer)
// ============================================================================

export interface TastePack {
  id: string;
  name: string;
  description: string;
  month: string; // e.g. "2026-02"
  genres: string[];
  moods: string[];
  suggestedContent: Array<{ title: string; platformId: string; genre: string }>;
  scenePreset?: string;
}

const TASTE_PACK_KEY = "ampere.tastePacks.v1";

export function getTastePacks(): TastePack[] {
  return loadJson<TastePack[]>(TASTE_PACK_KEY) ?? getDefaultTastePacks();
}

export function saveTastePacks(packs: TastePack[]): void {
  saveJson(TASTE_PACK_KEY, packs);
}

function getDefaultTastePacks(): TastePack[] {
  return [
    {
      id: "tp_feb2026",
      name: "February Chill",
      description: "Cozy picks for cold nights — comfort TV, slow cinema, jazz docs",
      month: "2026-02",
      genres: ["Documentaries", "Arthouse", "Basic"],
      moods: ["comfort", "slow", "warm"],
      suggestedContent: [
        { title: "Chef's Table", platformId: "netflix", genre: "Documentaries" },
        { title: "Slow Horses", platformId: "appletv", genre: "Basic" },
        { title: "Past Lives", platformId: "paramountplus", genre: "Arthouse" },
      ],
      scenePreset: "cozy_night",
    },
    {
      id: "tp_mar2026",
      name: "March Madness",
      description: "Basketball, bracket drama, and underdog stories",
      month: "2026-03",
      genres: ["Sports", "Documentaries"],
      moods: ["intense", "live", "exciting"],
      suggestedContent: [
        { title: "NCAA Tournament", platformId: "espnplus", genre: "Sports" },
        { title: "The Last Dance", platformId: "netflix", genre: "Documentaries" },
        { title: "Hustle", platformId: "netflix", genre: "Movies" },
      ],
      scenePreset: "game_day",
    },
  ];
}
