/**
 * AMPÈRE — Next.js Middleware
 *
 * Handles Supabase session refresh on every request
 * and applies security headers.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, just pass through
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // First set on the request (for downstream server components)
        cookiesToSet.forEach(({ name, value }) => {
          req.cookies.set(name, value);
        });
        // Re-create response so cookies get forwarded
        response = NextResponse.next({ request: req });
        // Then set on the response (for the browser)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if expired (this reads/writes cookies)
  await supabase.auth.getUser();

  return response;
}

// Only run middleware on app routes, not static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|logos/|sw.js).*)",
  ],
};
