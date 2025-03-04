import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.organisation.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
