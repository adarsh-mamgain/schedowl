import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.organisation?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update org profile
    const userRole = await prisma.organisationRole.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: session.organisation.id,
        },
      },
    });

    if (!userRole || (userRole.role !== "OWNER" && userRole.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Organisation name is required" },
        { status: 400 }
      );
    }

    // Update organisation in database
    const updatedOrg = await prisma.organisation.update({
      where: { id: session.organisation.id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organisation:", error);
    return NextResponse.json(
      { error: "Failed to update organisation" },
      { status: 500 }
    );
  }
}
