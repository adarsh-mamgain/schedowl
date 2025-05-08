import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { PostStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.organisation.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PostStatus;

    if (!status || !Object.values(PostStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid or missing status parameter" },
        { status: 400 }
      );
    }

    const posts = await prisma.post.findMany({
      where: {
        organisationId: session.organisation.id,
        status,
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
        scheduledFor: "desc",
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
