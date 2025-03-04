import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { authOptions } from "@/src/lib/auth";
import { getServerSession } from "next-auth";
import { AccountType } from "@prisma/client";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");
  const session = await getServerSession(authOptions);

  if (!session?.organisation.id || !platform) {
    return NextResponse.json(
      { error: "Organisation ID and platform are required" },
      { status: 400 }
    );
  }

  try {
    const integration = await prisma.socialAccount.findFirst({
      where: {
        organisationId: session.organisation.id,
        type: platform as AccountType,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "No integration exists" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: !!integration,
    });
  } catch (error) {
    logger.error(`${request.method} ${request.nextUrl.pathname} ${error}`);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}
