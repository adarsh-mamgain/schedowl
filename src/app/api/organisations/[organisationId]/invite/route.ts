import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/src/lib/mailer";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function POST(
  req: Request,
  { params }: { params: { organisationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    // Check if the inviter has permission
    const inviterRole = await prisma.organisationRole.findFirst({
      where: {
        userId: session.user.id,
        organisationId: params.organisationId,
      },
    });

    if (!inviterRole || inviterRole.role === "MEMBER") {
      return NextResponse.json(
        { error: "You don't have permission to invite users" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingRole = await prisma.organisationRole.findFirst({
        where: {
          userId: existingUser.id,
          organisationId: params.organisationId,
        },
      });

      if (existingRole) {
        return NextResponse.json(
          { error: "User is already a member of this organisation" },
          { status: 400 }
        );
      }
    }

    // Get organisation details
    const organisation = await prisma.organisation.findUnique({
      where: { id: params.organisationId },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 }
      );
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString("hex");
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        orgId: params.organisationId,
      },
    });

    // Send invitation email
    sendEmail(
      email,
      `You've been invited to join ${organisation.name}`,
      `
        <h1>You've been invited to join ${organisation.name} as a ${role}.</h1>
        <p>Click the link below to accept the invitation:</p>
        <a
          type="button"
          target="_blank"
          href=${process.env.NEXT_PUBLIC_BASE_URL}/invitations/${token}
        >
          Accept Invite
        </a>
        <p>This invitation will expire in 7 days.</p>
      `
    );

    return NextResponse.json(
      {
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
