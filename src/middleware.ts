import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { Permission, rolePermissions } from "@/src/lib/permissions";
import { JWT } from "next-auth/jwt";

interface CustomToken extends JWT {
  organisationRole?: {
    role: Role;
  };
}

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
  const token = (await getToken({ req: request })) as CustomToken;
  const isAuthPage =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/register");
  const isInvitationPage = request.nextUrl.pathname.startsWith("/invitations");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // If it's an admin route and user is not authenticated, redirect to login
  if (isAdminRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If it's an admin route and user is not the admin email, redirect to home
  if (
    isAdminRoute &&
    token?.email !== "work.mamgain@gmail.com" &&
    token?.email !== "mrakshayvm@gmail.com"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let response: NextResponse;

  if (isAuthPage) {
    if (token) {
      response = NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (isInvitationPage) {
    response = NextResponse.next();
  } else if (!token && !isApiRoute) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
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
          const userRole = token.organisationRole?.role as Role;
          const hasAccess = rolePermissions[userRole].includes(
            requiredPermission as Permission
          );

          if (!hasAccess) {
            response = NextResponse.json(
              { error: "Insufficient permissions" },
              { status: 403 }
            );
          } else {
            response = NextResponse.next();
          }
        } else {
          response = NextResponse.next();
        }
      } else {
        response = NextResponse.next();
      }
    } else {
      response = NextResponse.next();
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/",
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
