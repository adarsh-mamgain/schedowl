import { auth } from "@/src/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();

  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  if (
    session &&
    (req.nextUrl.pathname === "/signin" || req.nextUrl.pathname === "/signup")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup"], // ✅ Apply to both dashboard, signin & signup
};
