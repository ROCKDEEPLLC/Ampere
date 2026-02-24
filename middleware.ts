/**
 * AMPÈRE — Next.js Middleware
 *
 * Phase 1: Pass-through with security headers.
 * Phase 2/3: Will add Supabase session refresh once @supabase/ssr is installed.
 */

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

// Only run middleware on app routes, not static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|logos/|sw.js).*)",
  ],
};
