import { authOptions } from "@/src/lib/auth";
import { LinkedInService } from "@/src/services/linkedin";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  try {
    if (!session?.organisation.id) {
      return NextResponse.json(
        { error: "Organisation ID is undefined" },
        { status: 400 }
      );
    }
    const authUrl = await LinkedInService.getAuthUrl(session.organisation.id);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    logger.error(`${request.method} ${request.nextUrl.pathname} ${error}`);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
