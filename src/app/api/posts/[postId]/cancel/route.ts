import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { cancelScheduledPost } from "@/src/services/queue";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId") ?? "";

    // Get the post and verify ownership
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        organisationId: session.organisation.id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Post is not scheduled" },
        { status: 400 }
      );
    }

    // Cancel the scheduled post
    await cancelScheduledPost(postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Error canceling post:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
