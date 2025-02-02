import axios from "axios";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/signin", "/signup"];
const passwordRoutes = ["/reset-password", "/forgot-password"];
// const adminRoutes = ["/dashboard"];

export default async function authMiddleware(request: NextRequest) {
  const pathName = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(pathName);
  const isPasswordRoute = passwordRoutes.includes(pathName);
  // const isAdminRoute = adminRoutes.includes(pathName);

  try {
    const response = await axios.get(
      `${process.env.BETTER_AUTH_URL}/api/auth/get-session`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const session = response.data;

    if (!session) {
      if (isAuthRoute || isPasswordRoute) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // if (isAuthRoute || isPasswordRoute) {
    //   return NextResponse.redirect(new URL("/dashboard", request.url));
    // }

    // if (isAdminRoute && session.user.role !== "admin") {
    //   return NextResponse.redirect(new URL("/", request.url));
    // }

    return NextResponse.next();
  } catch (error) {
    console.error("Error fetching session:", error);

    // Redirect to signin if there's an error
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
