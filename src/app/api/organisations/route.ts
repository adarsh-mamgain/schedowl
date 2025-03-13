import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { Organisation, OrganisationRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organisations = await prisma.organisationRole.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        organisation: true,
      },
    });

    return NextResponse.json({
      organisations: organisations.map(
        (member: OrganisationRole & { organisation: Organisation }) => ({
          id: member.organisation.id,
          name: member.organisation.name,
          slug: member.organisation.slug,
          image: member.organisation.image,
          role: member.role,
        })
      ),
    });
  } catch (error) {
    console.error("Error fetching organisations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
