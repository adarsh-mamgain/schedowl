import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { z } from "zod";

const switchSchema = z.object({
  organisationId: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organisationId } = switchSchema.parse(body);

    // Verify user has access to the organization
    const organisationRole = await prisma.organisationRole.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
        organisationId,
      },
      include: {
        organisation: true,
      },
    });

    if (!organisationRole) {
      return NextResponse.json(
        { error: "You don't have access to this organisation" },
        { status: 403 }
      );
    }

    // Return the new session data
    return NextResponse.json({
      organisation: {
        id: organisationRole.organisation.id,
        name: organisationRole.organisation.name,
        slug: organisationRole.organisation.slug,
        image: organisationRole.organisation.image,
      },
      organisationRole: {
        id: organisationRole.id,
        role: organisationRole.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Error switching organisation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
