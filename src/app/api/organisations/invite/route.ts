import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import crypto from "crypto";
import { sendEmail, templates } from "@/src/services/email";
import { getOrgOwnerFeatures } from "@/src/lib/features";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.organisation?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.organisation.id;
    const features = await getOrgOwnerFeatures(orgId);
    const maxMembers = features.maxMembers ?? 1;
    const memberCount = await prisma.organisationRole.count({
      where: { organisationId: orgId },
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

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    // Check if the inviter has permission
    const inviterRole = await prisma.organisationRole.findFirst({
      where: {
        userId: session.user.id,
        organisationId: session.organisation.id,
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
          organisationId: session.organisation.id,
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
      where: { id: session.organisation.id },
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
        orgId: session.organisation.id,
      },
    });

    // Send invitation email
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${organisation.name}`,
      html: templates.INVITATION_EMAIL({
        organisationName: organisation.name,
        organisationRole: role,
        invitationLink: `${process.env.NEXT_PUBLIC_BASE_URL}/invitations/${token}`,
      }),
    });
    // sendEmail({
    //   to: email,
    //   subject: `You've been invited to join ${organisation.name}`,
    //   html: `
    //     <h1>You've been invited to join ${organisation.name} as a ${role}.</h1>
    //     <p>Click the link below to accept the invitation:</p>
    //     <a
    //       type="button"
    //       target="_blank"
    //       href=${process.env.NEXT_PUBLIC_BASE_URL}/invitations/${token}
    //     >
    //       Accept Invite
    //     </a>
    //     <p>This invitation will expire in 7 days.</p>
    //   `,
    // });

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
