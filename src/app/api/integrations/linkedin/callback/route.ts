import { LinkedInService } from "@/src/app/services/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await LinkedInService.handleCallback(code, state);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return NextResponse.json(
      { error: "Failed to connect LinkedIn" },
      { status: 500 }
    );
  }
}
