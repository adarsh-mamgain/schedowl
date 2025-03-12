import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SessionManager } from "@/src/lib/auth/session";

// Define public routes that don't need authentication
const publicRoutes = [
  "/signin",
  "/signup",
  "/api/auth/signin",
  "/api/auth/signup",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static files
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await SessionManager.validateSession();

  // If no session and trying to access protected route
  if (!session) {
    // For API routes, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For page routes, redirect to signin
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Add session info to headers for protected routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-session-id", session.sessionId);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-organisation-id", session.organisationId);
  requestHeaders.set("x-member-id", session.memberId);

  return NextResponse.next({
    headers: requestHeaders,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
