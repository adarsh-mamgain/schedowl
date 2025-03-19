import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { Role } from "@prisma/client";
import { requirePermission } from "@/src/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.organisation.id && !session?.organisationRole.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { memberId } = await params;
    const { role } = await request.json();

    // Validate role
    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if the user has permission to assign users
    requirePermission(session.organisationRole.role as Role, "assign_users");

    // Get the member and verify ownership
    const member = await prisma.organisationRole.findUnique({
      where: {
        id: memberId,
        organisationId: session.organisation.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Don't allow changing owner's role
    if (member.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 403 }
      );
    }

    // Update the member's role
    const updatedMember = await prisma.organisationRole.update({
      where: { id: memberId },
      data: { role: role as Role },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Insufficient permissions"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update member roles" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.organisation.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { memberId } = await params;

    // Check if the user has permission to manage users
    requirePermission(session.organisationRole.role as Role, "manage_users");

    // Get the member and verify ownership
    const member = await prisma.organisationRole.findUnique({
      where: {
        id: memberId,
        organisationId: session.organisation.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Don't allow removing the owner
    if (member.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the owner" },
        { status: 403 }
      );
    }

    // Don't allow removing yourself
    if (member.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 403 }
      );
    }

    // Remove the member
    await prisma.organisationRole.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Insufficient permissions"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to remove members" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
