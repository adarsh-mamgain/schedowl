import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.organisation.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const posts = await prisma.post.findMany({
      where: {
        organisationId: session.organisation.id,
        scheduledFor: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        socialAccount: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: {
          include: {
            media: true,
          },
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
