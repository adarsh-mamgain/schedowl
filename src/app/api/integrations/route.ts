import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { authOptions } from "@/src/lib/auth";
import { getServerSession } from "next-auth";
import { AccountType } from "@prisma/client";
import { getOrgOwnerFeatures } from "@/src/lib/features";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce maxSocialAccounts using dynamic features
  const features = await getOrgOwnerFeatures(session.organisation.id);
  const maxSocialAccounts = features.maxSocialAccounts ?? 1;
  const accounts = await prisma.socialAccount.count({
    where: { organisationId: session.organisation.id },
  });
  if (accounts >= maxSocialAccounts) {
    return NextResponse.json(
      {
        error:
          "Social account limit reached for your plan. Upgrade to add more integrations.",
      },
      { status: 403 }
    );
  }

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
