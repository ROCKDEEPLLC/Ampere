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
  | { kind: "power"; value: "on" | "off" };

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

  // If the user says a platform name, route to search for it
  const platform = PLATFORM_CATALOG.find((p) => norm(p.name) === s);
  if (platform) return { kind: "search", query: platform.name };

  // Fuzzy match: check if input contains a platform name
  const partialMatch = PLATFORM_CATALOG.find((p) => s.includes(norm(p.name)));
  if (partialMatch) return { kind: "search", query: partialMatch.name };

  return { kind: "noop" };
}
