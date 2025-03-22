import { LinkedInService } from "@/src/services/linkedin";
import logger from "@/src/services/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await LinkedInService.handleCallback(code, state);
    return NextResponse.redirect(
      new URL("/dashboard", process.env.NEXT_PUBLIC_BASE_URL)
    );
  } catch (error) {
    logger.error(`${request.method} ${request.nextUrl.pathname} ${error}`);
    return NextResponse.json(
      { error: "Failed to connect LinkedIn" },
      { status: 500 }
    );
  }
}
