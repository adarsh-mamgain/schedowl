import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { Role } from "@prisma/client";
import { requirePermission } from "@/src/lib/permissions";
import { sendEmail } from "@/src/services/email";

export async function POST(
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

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Resend the invitation email
    await sendEmail({
      to: invitation.email,
      subject: `You've been invited to join ${session.organisation.name}`,
      html: `
          <h1>You've been invited to join ${session.organisation.name} as a ${invitation.role}.</h1>
          <p>Click the link below to accept the invitation:</p>
          <a
            type="button"
            target="_blank"
            href=${process.env.NEXT_PUBLIC_BASE_URL}/invitations/${invitation.token}
          >
            Accept Invite
          </a>
          <p>This invitation will expire in 7 days.</p>
        `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Insufficient permissions"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to resend invitations" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
