import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

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
