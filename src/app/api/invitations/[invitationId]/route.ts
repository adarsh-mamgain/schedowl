import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { Role } from "@prisma/client";
import { requirePermission } from "@/src/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.organisation.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { invitationId } = await params;

    // Check if the user has permission to manage users
    requirePermission(session.organisationRole.role as Role, "manage_users");

    // Get the invitation and verify ownership
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: invitationId,
        orgId: session.organisation.id,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Insufficient permissions"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to remove invitations" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
