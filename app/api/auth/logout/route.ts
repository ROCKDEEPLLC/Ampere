/**
 * POST /api/auth/logout
 * Sign out and clear session cookies.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { auditLog, getAuthUser, jsonOk } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return jsonOk({ message: "Logged out" });
  }

  const response = NextResponse.json({ message: "Logged out" });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  await auditLog(req, user?.id ?? null, "logout", "auth", {});

  return response;
}
