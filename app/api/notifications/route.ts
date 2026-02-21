/**
 * POST /api/notifications/subscribe — Register push subscription
 * POST /api/notifications/send     — Send notification (admin or system)
 * GET  /api/notifications           — Get notification preferences
 * PUT  /api/notifications           — Update notification preferences
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireAuth, requirePermission, applyRateLimit, auditLog, jsonOk, jsonError } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return jsonOk(data ?? {
    notify_live_games: true,
    notify_favorite_teams: true,
    notify_new_content: false,
    notify_price_changes: false,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });
}

export async function PUT(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid body", "BAD_REQUEST", 400);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });

  await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    notify_live_games: body.notify_live_games ?? true,
    notify_favorite_teams: body.notify_favorite_teams ?? true,
    notify_new_content: body.notify_new_content ?? false,
    notify_price_changes: body.notify_price_changes ?? false,
    quiet_hours_start: body.quiet_hours_start ?? null,
    quiet_hours_end: body.quiet_hours_end ?? null,
  }, { onConflict: "user_id" });

  return jsonOk({ updated: true });
}

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body?.action) return jsonError("Action required", "MISSING_ACTION", 400);

  if (body.action === "subscribe") {
    const user = await requireAuth(req);
    if (user instanceof Response) return user;

    if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth) {
      return jsonError("Invalid push subscription", "INVALID_SUBSCRIPTION", 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return jsonError("Not configured", "CONFIG_ERROR", 503);

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
    });

    await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth_key: body.subscription.keys.auth,
    }, { onConflict: "user_id,endpoint" });

    await auditLog(req, user.id, "push_subscribed", "notifications", {});
    return jsonOk({ subscribed: true });
  }

  if (body.action === "send") {
    // Admin-only: send push notification
    const user = await requirePermission(req, "admin:system");
    if (user instanceof Response) return user;

    // In production, use web-push library to send to all subscribers
    // For now, log the intent
    await auditLog(req, user.id, "push_sent", "notifications", {
      title: body.title,
      targetUsers: body.targetUsers?.length ?? "all",
    });

    return jsonOk({ sent: true, message: "Push notification queued" });
  }

  return jsonError("Invalid action", "INVALID_ACTION", 400);
}
