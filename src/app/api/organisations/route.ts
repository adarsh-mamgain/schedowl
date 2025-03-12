import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organisations = await prisma.organisationRole.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
      },
    });

    const formattedOrganisations = organisations.map(
      (org: { organisation: { id: string; name: string }; role: string }) => ({
        id: org.organisation.id,
        name: org.organisation.name,
        role: org.role,
      })
    );

    return NextResponse.json({ organisations: formattedOrganisations });
  } catch (error) {
    console.error("Error fetching organisations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
