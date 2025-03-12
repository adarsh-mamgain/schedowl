import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { Permission, rolePermissions } from "@/src/lib/permissions";

// Define protected routes and their required permissions
const protectedRoutes: Record<
  string,
  { method: string; permission: string }[]
> = {
  "/api/organisations": [
    { method: "POST", permission: "manage_users" },
    { method: "PUT", permission: "manage_billing" },
    { method: "DELETE", permission: "manage_users" },
  ],
  "/api/users": [
    { method: "POST", permission: "manage_users" },
    { method: "PUT", permission: "assign_users" },
    { method: "DELETE", permission: "manage_users" },
  ],
  "/api/posts": [
    { method: "POST", permission: "manage_posts" },
    { method: "PUT", permission: "approve_posts" },
    { method: "DELETE", permission: "manage_posts" },
  ],
  "/api/analytics": [{ method: "GET", permission: "view_analytics" }],
  "/api/ai": [{ method: "POST", permission: "use_ai_tools" }],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isInvitationPage = request.nextUrl.pathname.startsWith("/invitations");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isInvitationPage) {
    return NextResponse.next();
  }

  if (!token && !isApiRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check API route permissions
  if (isApiRoute && token) {
    const path = request.nextUrl.pathname;
    const method = request.method;
    const route = Object.keys(protectedRoutes).find((route) =>
      path.startsWith(route)
    );

    if (route && protectedRoutes[route]) {
      const requiredPermission = protectedRoutes[route].find(
        (r) => r.method === method
      )?.permission;

      if (requiredPermission) {
        const userRole = (token as any).organisationRole?.role as Role;
        const hasAccess = rolePermissions[userRole].includes(
          requiredPermission as Permission
        );

        if (!hasAccess) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/api/:path*",
    "/invitations/:path*",
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     */
    // "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
