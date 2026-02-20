/**
 * TV Device Integration API
 *
 * GET  /api/tv          — List user's registered TV devices
 * POST /api/tv          — Register/discover a new TV device
 * POST /api/tv?action=  — Control actions: power, launch, deeplink, volume, input
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requirePermission, applyRateLimit, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const user = await requirePermission(req, "tv:control");
  if (user instanceof Response) return user;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  const { data } = await supabase
    .from("tv_devices")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });

  return jsonOk({ devices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const user = await requirePermission(req, "tv:control");
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid body", "BAD_REQUEST", 400);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? body.action ?? "register";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  // Register a new TV device
  if (action === "register") {
    if (!body.name || !body.brand) return jsonError("Name and brand required", "MISSING_FIELDS", 400);

    const { data, error } = await supabase.from("tv_devices").insert({
      user_id: user.id,
      name: body.name,
      brand: body.brand,
      model: body.model,
      ip_address: body.ip_address,
      mac_address: body.mac_address,
      discovery_protocol: body.discovery_protocol ?? "manual",
      control_protocol: body.control_protocol ?? "vendor_api",
      capabilities: body.capabilities ?? {},
      is_primary: body.is_primary ?? false,
    }).select().single();

    if (error) return jsonError("Registration failed", "INSERT_FAILED", 500);
    await auditLog(req, user.id, "tv_registered", "tv_devices", { brand: body.brand, name: body.name });
    return jsonOk({ device: data }, 201);
  }

  // Control actions (power, launch, deeplink, volume, input)
  if (["power", "launch", "deeplink", "volume", "input"].includes(action)) {
    if (!body.deviceId) return jsonError("deviceId required", "MISSING_DEVICE", 400);

    // Verify device belongs to user
    const { data: device } = await supabase
      .from("tv_devices")
      .select("*")
      .eq("id", body.deviceId)
      .eq("user_id", user.id)
      .single();

    if (!device) return jsonError("Device not found", "NOT_FOUND", 404);

    // In production, this would send commands via the appropriate protocol
    // (SSDP, mDNS, vendor API, etc.) based on device.control_protocol
    const command = {
      action,
      deviceId: body.deviceId,
      brand: device.brand,
      payload: body.payload ?? {},
      timestamp: new Date().toISOString(),
    };

    await auditLog(req, user.id, `tv_${action}`, "tv_devices", { deviceId: body.deviceId, brand: device.brand });

    return jsonOk({
      command,
      status: "sent",
      message: `${action} command sent to ${device.name} (${device.brand})`,
      note: "In production, this executes via the device's native protocol",
    });
  }

  // CEC/eARC passthrough
  if (action === "cec") {
    if (!body.deviceId || !body.cecCommand) return jsonError("deviceId and cecCommand required", "MISSING_FIELDS", 400);

    await auditLog(req, user.id, "tv_cec", "tv_devices", { command: body.cecCommand });
    return jsonOk({
      status: "sent",
      cecCommand: body.cecCommand,
      message: "CEC command forwarded. Requires native companion app for execution.",
    });
  }

  return jsonError("Invalid action", "INVALID_ACTION", 400);
}
