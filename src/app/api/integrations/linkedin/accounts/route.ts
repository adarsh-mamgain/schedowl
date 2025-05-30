import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getOrgOwnerFeatures } from "@/src/lib/features";
import logger from "@/src/services/logger";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce maxSocialAccounts using dynamic features
  const features = await getOrgOwnerFeatures(session.organisation.id);
  const maxSocialAccounts = features.maxSocialAccounts ?? 1;
  const accountCount = await prisma.socialAccount.count({
    where: { organisationId: session.organisation.id },
  });
  if (accountCount >= maxSocialAccounts) {
    return NextResponse.json(
      {
        error:
          "LinkedIn accounts limit reached for your plan. Upgrade to add more accounts.",
      },
      { status: 403 }
    );
  }
  const accounts = await prisma.socialAccount.findMany({
    where: { organisationId: session.organisation.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(accounts);
}
