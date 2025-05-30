import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getOrgOwnerFeatures } from "@/src/lib/features";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce maxMembers using dynamic features
  const features = await getOrgOwnerFeatures(session.organisation.id);
  const maxMembers = features.maxMembers ?? 1;
  const memberCount = await prisma.organisationRole.count({
    where: { organisationId: session.organisation.id },
  });
  if (memberCount >= maxMembers) {
    return NextResponse.json(
      {
        error:
          "Member limit reached for your plan. Upgrade to invite more members.",
      },
      { status: 403 }
    );
  }

  // Get existing members
  const members = await prisma.organisationRole.findMany({
    where: {
      organisationId: session.organisation.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // Get pending invitations
  const invitations = await prisma.invitation.findMany({
    where: {
      orgId: session.organisation.id,
      accepted: false,
      expiresAt: {
        gt: new Date(), // Only get non-expired invitations
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({
    members,
    invitations,
  });
}
