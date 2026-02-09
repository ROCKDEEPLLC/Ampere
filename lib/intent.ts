import type { AppState } from "../components/AppState";
import type { AppRoute } from "../components/AppState";
import { PLATFORM_CATALOG } from "./catalog";
import { pushToast } from "../components/ToastCenter";

export type ParsedCommand =
  | { kind: "noop" }
  | { kind: "route"; route: AppRoute }
  | { kind: "search"; query: string }
  | { kind: "openModal"; modal: "connectPlatforms" | "favoritesEditor" | "profileSettings" | "about" | "archive" | "setupWizard" }
  | { kind: "power"; value: "on" | "off" };

export type CommandResult = { ok: boolean; message: string; action?: string; detail?: string };

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

  if (s === "connect" || s === "connect platforms" || s === "platforms") return { kind: "openModal", modal: "connectPlatforms" };
  if (s === "settings" || s === "open settings") return { kind: "openModal", modal: "connectPlatforms" };
  if (s === "about" || s === "about ampere") return { kind: "openModal", modal: "about" };
  if (s === "archive") return { kind: "openModal", modal: "archive" };
  if (s === "wizard" || s === "setup wizard" || s === "set-up wizard") return { kind: "openModal", modal: "setupWizard" };
  if (s === "profile") return { kind: "openModal", modal: "profileSettings" };

  if (s === "power on") return { kind: "power", value: "on" };
  if (s === "power off") return { kind: "power", value: "off" };

  // If the user says a platform name, route to search for it
  const platform = PLATFORM_CATALOG.find((p) => norm(p.name) === s);
  if (platform) return { kind: "search", query: platform.name };

  return { kind: "noop" };
}

export function runCommand(cmd: ParsedCommand, ctx: { state: AppState; actions: any }): CommandResult {
  const { actions } = ctx;

  if (cmd.kind === "noop") {
    return { ok: false, message: "Unknown command. Try “search ufc”, “go live”, “home”, “favs”, “genre”, “connect platforms”." };
  }

  if (cmd.kind === "route") {
    actions.setRoute(cmd.route);
    return { ok: true, message: "Navigated to " + cmd.route, action: "route" };
  }

  if (cmd.kind === "search") {
    actions.setRoute("search");
    actions.setSearchQuery(cmd.query);
    return { ok: true, message: "Searching for “" + cmd.query + "”", action: "search" };
  }

  if (cmd.kind === "openModal") {
    actions.openModal(cmd.modal);
    return { ok: true, message: "Opened " + cmd.modal, action: "openModal" };
  }

  if (cmd.kind === "power") {
    if (cmd.value === "on") actions.powerOn();
    else actions.powerOff();
    return { ok: true, message: "Power " + cmd.value, action: "power" };
  }

  return { ok: false, message: "Unsupported command." };
}

export function sendRemoteCommand(cmd: string, ctx: { state: AppState; actions: any }) {
  const s = norm(cmd);
  const { state, actions } = ctx;

  if (s === "home") actions.setRoute("home");
  else if (s === "live") actions.setRoute("live");
  else if (s === "favs") actions.setRoute("favs");
  else if (s === "search") actions.setRoute("search");
  else if (s === "back") actions.closeModal();
  else if (s === "ok") pushToast("OK");
  else if (s === "up" || s === "down" || s === "left" || s === "right") pushToast("D-Pad: " + s.toUpperCase());

  // Forward to TV capability model if connected
  if (state.tv.status === "connected") {
    const caps = new Set(state.tv.capabilities);
    const canDpad = caps.has("dpad");
    if (["up","down","left","right","ok","back"].includes(s) && canDpad) {
      actions.addAttribution("TV command sent: " + s + " → " + state.tv.deviceName);
      actions.log("tv_command_sent", { cmd: s, deviceId: state.tv.deviceId });
    }
    if (s === "home" && caps.has("launchApp")) {
      actions.log("tv_launch_home", { deviceId: state.tv.deviceId });
    }
  }
}
