import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/src/lib/auth/session";
import logger from "@/src/services/logger";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await SessionManager.validateSession();
  return NextResponse.json({ session });
}
