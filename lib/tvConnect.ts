// ============================================================================
// AMPERE TV CONNECT — Device Discovery & Control Architecture
// File: lib/tvConnect.ts
//
// Real architecture for TV discovery and control:
// - mDNS/SSDP for local network device discovery
// - CEC/eARC for HDMI device control
// - Vendor APIs: Samsung Tizen, LG webOS, Roku ECP, Fire TV ADB, Apple tvOS
// - OAuth 2.0 + secure credential vault for platform auth
//
// NOTE: Web UI alone cannot reliably discover/control TVs.
// Production requires a native companion app or device runtime.
// This module defines the interfaces and simulation layer for the prototype.
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export type TVBrand = "samsung" | "lg" | "roku" | "firetv" | "appletv" | "androidtv" | "vizio" | "sony" | "tcl" | "hisense" | "unknown";

export type DiscoveryProtocol = "mdns" | "ssdp" | "bluetooth" | "manual";

export type ControlProtocol = "cec" | "earc" | "vendor_api" | "ir" | "webhook";

export type TVConnectionStatus = "disconnected" | "discovering" | "pairing" | "connected" | "error";

export interface DiscoveredTV {
  id: string;
  name: string;
  brand: TVBrand;
  model: string;
  ipAddress: string;
  macAddress?: string;
  discoveryProtocol: DiscoveryProtocol;
  controlProtocols: ControlProtocol[];
  capabilities: TVCapabilities;
  status: TVConnectionStatus;
  lastSeen: number;
}

export interface TVCapabilities {
  power: boolean;
  volume: boolean;
  input: boolean;
  appLaunch: boolean;
  deepLink: boolean;
  voiceControl: boolean;
  cecPassthrough: boolean;
  screenMirror: boolean;
}

export interface TVCommand {
  type: "power" | "volume" | "input" | "navigate" | "app_launch" | "deep_link" | "key";
  payload: Record<string, unknown>;
}

export interface TVConnectPlan {
  id: "basic" | "pro" | "family";
  name: string;
  price: string;
  maxTVs: number;
  maxProfiles: number;
  features: string[];
  includesInstantSwitch: boolean;
  includesVoice: boolean;
  includesParentalControls: boolean;
}

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

export const TV_CONNECT_PLANS: TVConnectPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    maxTVs: 1,
    maxProfiles: 1,
    features: [
      "Web remote control",
      "Manual platform switching",
      "Viewing history",
      "Up to 3 platforms",
    ],
    includesInstantSwitch: false,
    includesVoice: false,
    includesParentalControls: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$4.99/mo",
    maxTVs: 3,
    maxProfiles: 3,
    features: [
      "InstantSwitch (< 300ms)",
      "Voice & gesture control",
      "Unlimited platforms",
      "Sports Hub + Game Day Mode",
      "Multi-profile support",
    ],
    includesInstantSwitch: true,
    includesVoice: true,
    includesParentalControls: false,
  },
  {
    id: "family",
    name: "Family",
    price: "$7.99/mo",
    maxTVs: 5,
    maxProfiles: 5,
    features: [
      "Everything in Pro",
      "Up to 5 profiles",
      "Parental controls + Kid Mode",
      "Offline cached schedules",
      "Priority support",
    ],
    includesInstantSwitch: true,
    includesVoice: true,
    includesParentalControls: true,
  },
];

// ============================================================================
// VENDOR API CONFIGURATIONS
// ============================================================================

export const VENDOR_CONFIGS: Record<TVBrand, { name: string; apiType: string; discoveryMethod: DiscoveryProtocol; controlMethod: ControlProtocol; notes: string }> = {
  samsung: { name: "Samsung (Tizen)", apiType: "SmartThings API + Tizen Web API", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "Requires SmartThings Cloud token; local SSDP for discovery" },
  lg: { name: "LG (webOS)", apiType: "LG ThinQ API + SSAP WebSocket", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "SSAP protocol over WebSocket on port 3000; pairing PIN required" },
  roku: { name: "Roku", apiType: "Roku ECP (External Control Protocol)", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "REST API on port 8060; no auth required on local network" },
  firetv: { name: "Amazon Fire TV", apiType: "ADB over network", discoveryMethod: "mdns", controlMethod: "vendor_api", notes: "ADB debugging must be enabled; uses port 5555" },
  appletv: { name: "Apple TV (tvOS)", apiType: "HomeKit + Companion Link (MRP)", discoveryMethod: "mdns", controlMethod: "vendor_api", notes: "Requires Apple ecosystem; Bonjour/mDNS for discovery" },
  androidtv: { name: "Android TV / Google TV", apiType: "Android TV Remote v2 (gRPC)", discoveryMethod: "mdns", controlMethod: "vendor_api", notes: "mDNS _androidtvremote2._tcp; TLS + pairing" },
  vizio: { name: "Vizio (SmartCast)", apiType: "SmartCast REST API", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "REST API with pairing PIN; HTTPS on local network" },
  sony: { name: "Sony (BRAVIA)", apiType: "BRAVIA REST API (IRCC-IP)", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "Simple IP Control over port 20060 or REST API" },
  tcl: { name: "TCL (Roku-based or Google TV)", apiType: "Depends on platform (Roku ECP or Android TV)", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "Most models run Roku OS or Google TV; use respective API" },
  hisense: { name: "Hisense (VIDAA / Roku / Android TV)", apiType: "VIDAA API or platform-dependent", discoveryMethod: "ssdp", controlMethod: "vendor_api", notes: "VIDAA models use proprietary API; others use Roku/Android TV" },
  unknown: { name: "Unknown / Generic", apiType: "HDMI-CEC passthrough", discoveryMethod: "manual", controlMethod: "cec", notes: "Falls back to HDMI-CEC for basic power/volume/input control" },
};

// ============================================================================
// TV DISCOVERY SERVICE (Simulation for prototype)
// ============================================================================

export class TVDiscoveryService {
  private discoveredDevices: Map<string, DiscoveredTV> = new Map();
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Array<(devices: DiscoveredTV[]) => void> = [];

  /**
   * Start scanning for TVs on the local network.
   * In production: sends mDNS/SSDP multicast queries.
   * In prototype: simulates discovery with demo devices.
   */
  startScan(): void {
    // Simulate discovery with delay
    setTimeout(() => {
      const demoDevices: DiscoveredTV[] = [
        {
          id: "tv-living-room",
          name: "Living Room TV",
          brand: "samsung",
          model: "QN65Q80C",
          ipAddress: "192.168.1.100",
          macAddress: "AA:BB:CC:DD:EE:01",
          discoveryProtocol: "ssdp",
          controlProtocols: ["vendor_api", "cec"],
          capabilities: { power: true, volume: true, input: true, appLaunch: true, deepLink: true, voiceControl: true, cecPassthrough: true, screenMirror: true },
          status: "discovered" as TVConnectionStatus,
          lastSeen: Date.now(),
        },
        {
          id: "tv-bedroom",
          name: "Bedroom TV",
          brand: "roku",
          model: "Roku Ultra 4K",
          ipAddress: "192.168.1.101",
          discoveryProtocol: "ssdp",
          controlProtocols: ["vendor_api"],
          capabilities: { power: true, volume: true, input: true, appLaunch: true, deepLink: true, voiceControl: false, cecPassthrough: false, screenMirror: false },
          status: "discovered" as TVConnectionStatus,
          lastSeen: Date.now(),
        },
        {
          id: "tv-den",
          name: "Den TV",
          brand: "lg",
          model: "OLED55C3PUA",
          ipAddress: "192.168.1.102",
          macAddress: "AA:BB:CC:DD:EE:03",
          discoveryProtocol: "ssdp",
          controlProtocols: ["vendor_api", "cec", "earc"],
          capabilities: { power: true, volume: true, input: true, appLaunch: true, deepLink: true, voiceControl: true, cecPassthrough: true, screenMirror: true },
          status: "discovered" as TVConnectionStatus,
          lastSeen: Date.now(),
        },
      ];

      demoDevices.forEach((d) => this.discoveredDevices.set(d.id, d));
      this.notifyListeners();
    }, 1500);
  }

  stopScan(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  onDevicesChanged(callback: (devices: DiscoveredTV[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    const devices = Array.from(this.discoveredDevices.values());
    this.listeners.forEach((l) => l(devices));
  }

  getDevices(): DiscoveredTV[] {
    return Array.from(this.discoveredDevices.values());
  }

  async pairDevice(deviceId: string): Promise<boolean> {
    const device = this.discoveredDevices.get(deviceId);
    if (!device) return false;

    device.status = "pairing";
    this.notifyListeners();

    // Simulate pairing delay
    await new Promise((r) => setTimeout(r, 2000));

    device.status = "connected";
    this.notifyListeners();
    return true;
  }

  async sendCommand(deviceId: string, command: TVCommand): Promise<boolean> {
    const device = this.discoveredDevices.get(deviceId);
    if (!device || device.status !== "connected") return false;

    // In production: dispatch to vendor-specific handler
    const config = VENDOR_CONFIGS[device.brand];
    console.log(`[TVConnect] Sending ${command.type} to ${device.name} via ${config.apiType}`);
    return true;
  }
}

// Singleton for prototype
export const tvDiscovery = new TVDiscoveryService();
