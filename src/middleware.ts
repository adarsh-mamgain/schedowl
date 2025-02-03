// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSession } from "@/src/lib/auth";

export async function middleware(request: NextRequest) {
  // Exclude auth routes from middleware
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await validateSession();
  console.log("session", session);

  // Handle API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.userId);
    if (session.organisationId) {
      requestHeaders.set("x-organisation-id", session.organisationId);
    }

    return NextResponse.next({
      headers: requestHeaders,
    });
  }

  // Handle page routes
  if (!session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
