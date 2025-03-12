import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.organisation.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await prisma.mediaAttachment.findMany({
      where: {
        organisationId: session.organisation.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
