import { LinkedInService } from "@/src/services/linkedin";
import logger from "@/src/services/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!userId || !organisationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, linkedInAccountIds } = await request.json();

    if (!content || !linkedInAccountIds) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Directly post to LinkedIn for each account
    const results = await Promise.all(
      linkedInAccountIds.map((linkedInId: string) =>
        LinkedInService.publishPost(linkedInId, content)
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Error publishing posts:"`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
