// ============================================================================
// AMPERE VOICE COMMAND PARSER
// File: lib/intent.ts
// ============================================================================

import { PLATFORM_CATALOG } from "./catalog";

export type ParsedCommand =
  | { kind: "noop" }
  | { kind: "route"; route: string }
  | { kind: "search"; query: string }
  | { kind: "openModal"; modal: string }
  | { kind: "power"; value: "on" | "off" }
  | { kind: "intent_playback"; minutes: number; mood: string }
  | { kind: "set_mode"; mode: string }
  | { kind: "set_delight"; context: string }
  | { kind: "discovery_contract"; level: string };

function norm(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export function parseCommand(input: string): ParsedCommand {
  const s = norm(input);
  if (!s) return { kind: "noop" };

  if (s === "home") return { kind: "route", route: "home" };
  if (s === "go live" || s === "live") return { kind: "route", route: "live" };
  if (s === "genre" || s === "browse") return { kind: "route", route: "genre" };
  if (s === "favs" || s === "favorites") return { kind: "route", route: "favs" };
  if (s === "search") return { kind: "route", route: "search" };

  if (s.startsWith("search ")) return { kind: "search", query: s.slice("search ".length).trim() };
  if (s.startsWith("find ")) return { kind: "search", query: s.slice("find ".length).trim() };
  if (s.startsWith("switch to ")) return { kind: "search", query: s.slice("switch to ".length).trim() };
  if (s.startsWith("show ")) return { kind: "search", query: s.slice("show ".length).trim() };
  if (s.startsWith("flip to ")) return { kind: "search", query: s.slice("flip to ".length).trim() };

  if (s === "connect" || s === "connect platforms" || s === "platforms") return { kind: "openModal", modal: "connectPlatforms" };
  if (s === "settings" || s === "open settings") return { kind: "openModal", modal: "profileSettings" };
  if (s === "about" || s === "about ampere") return { kind: "openModal", modal: "about" };
  if (s === "archive") return { kind: "openModal", modal: "archive" };
  if (s === "wizard" || s === "setup wizard" || s === "set-up wizard") return { kind: "openModal", modal: "setupWizard" };
  if (s === "profile") return { kind: "openModal", modal: "profileSettings" };
  if (s === "app store" || s === "apps") return { kind: "openModal", modal: "appStore" };
  if (s === "pause" || s === "pause playback") return { kind: "noop" };

  if (s === "power on") return { kind: "power", value: "on" };
  if (s === "power off") return { kind: "power", value: "off" };

  // ---- Premium modal intents ----
  if (s === "open premium" || s === "premium" || s === "premium hub") return { kind: "openModal", modal: "premiumHub" };
  if (s === "open my queue" || s === "my queue" || s === "queue") return { kind: "openModal", modal: "universalQueue" };
  if (s === "why this pick" || s === "why this" || s === "explain") return { kind: "openModal", modal: "whyThisPick" };
  if (s === "taste" || s === "taste engine" || s === "my taste") return { kind: "openModal", modal: "tasteEngine" };
  if (s === "modes" || s === "mode") return { kind: "openModal", modal: "modes" };
  if (s === "scenes" || s === "remote scenes") return { kind: "openModal", modal: "remoteScenes" };
  if (s === "add device" || s === "pair device") return { kind: "openModal", modal: "addDevice" };
  if (s === "emulator" || s === "tv emulator" || s === "virtual tv") return { kind: "openModal", modal: "virtualEmulator" };
  if (s === "pricing" || s === "plans" || s === "upgrade") return { kind: "openModal", modal: "pricing" };
  if (s === "trust" || s === "privacy" || s === "export") return { kind: "openModal", modal: "trustPortability" };
  if (s === "social" || s === "circles") return { kind: "openModal", modal: "social" };
  if (s === "live pulse" || s === "alerts" || s === "live events") return { kind: "openModal", modal: "livePulse" };
  if (s === "family" || s === "family profiles") return { kind: "openModal", modal: "familyProfiles" };

  // ---- Mode setting intents ----
  if (s.startsWith("set mode to ") || s.startsWith("mode ")) {
    const mode = s.replace(/^(set mode to |mode )/, "").replace(/\s+/g, "_");
    return { kind: "set_mode", mode };
  }

  // ---- Time-to-Delight / intent-first playback ----
  // "I have 22 minutes and want something intense"
  const timeMatch = s.match(/i have (\d+)\s*min(?:utes?)?\s*(?:and\s*)?(?:want\s*)?(?:something\s*)?(.*)/);
  if (timeMatch) {
    return { kind: "intent_playback", minutes: parseInt(timeMatch[1]), mood: timeMatch[2]?.trim() || "anything" };
  }

  // "I'm cooking" / context shortcuts
  if (s === "i'm cooking" || s === "im cooking" || s === "cooking") return { kind: "set_delight", context: "cooking" };
  if (s === "background" || s === "background noise") return { kind: "set_delight", context: "background" };
  if (s === "winding down" || s === "relax") return { kind: "set_delight", context: "winding_down" };
  if (s === "movie night") return { kind: "set_delight", context: "movie_night" };
  if (s === "lunch break" || s === "lunch") return { kind: "set_delight", context: "lunch" };
  if (s === "commute" || s === "quick commute") return { kind: "set_delight", context: "commute" };

  // ---- Discovery contract intents ----
  if (s.includes("safe") && !s.includes("wildcard")) return { kind: "discovery_contract", level: "safe" };
  if (s.includes("one wildcard") || s.includes("1 wildcard")) return { kind: "discovery_contract", level: "one_wildcard" };
  if (s.includes("three wildcards") || s.includes("3 wildcards")) return { kind: "discovery_contract", level: "three_wildcards" };

  // If the user says a platform name, route to search for it
  const platform = PLATFORM_CATALOG.find((p) => norm(p.name) === s);
  if (platform) return { kind: "search", query: platform.name };

  // Fuzzy match: check if input contains a platform name
  const partialMatch = PLATFORM_CATALOG.find((p) => s.includes(norm(p.name)));
  if (partialMatch) return { kind: "search", query: partialMatch.name };

  return { kind: "noop" };
}
