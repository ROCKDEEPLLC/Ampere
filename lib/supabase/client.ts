/**
 * AMPÈRE — Supabase Client (Browser)
 *
 * Used in client components for auth state and real-time subscriptions.
 * Uses the anon key (safe for browser).
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
