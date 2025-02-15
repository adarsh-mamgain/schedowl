import { SessionManager } from "@/src/lib/auth/session";
import logger from "@/src/services/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  await SessionManager.destroySession();
  return NextResponse.json({ success: true });
}
