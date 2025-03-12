import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: {
        org: {
          select: {
            name: true,
          },
        },
      },
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organisation: invitation.org,
      },
      isExistingUser: !!existingUser,
    });
  } catch (error) {
    console.error("Fetch invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
