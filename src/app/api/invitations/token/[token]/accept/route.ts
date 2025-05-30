import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getOrgOwnerFeatures } from "@/src/lib/features";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (invitation.accepted) {
      return NextResponse.json(
        { error: "Invitation has already been accepted" },
        { status: 400 }
      );
    }

    // Before accepting invitation
    const features = await getOrgOwnerFeatures(invitation.orgId);
    const maxMembers = features.maxMembers ?? 1;
    const memberCount = await prisma.organisationRole.count({
      where: { organisationId: invitation.orgId },
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

    // Add user to organisation
    await prisma.$transaction(async (tx) => {
      // Create organisation role
      await tx.organisationRole.create({
        data: {
          userId: session.user.id,
          organisationId: invitation.orgId,
          role: invitation.role,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true },
      });
    });

    return NextResponse.json(
      { message: "Invitation accepted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
