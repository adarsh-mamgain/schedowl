import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { requirePermission } from "@/src/lib/permissions";
import { Role } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const postId = params.postId;

    // Check if the user has permission to approve posts
    requirePermission(session.organisationRole.role as Role, "approve_posts");

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

    if (post.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft posts can be approved" },
        { status: 400 }
      );
    }

    // Update the post status to SCHEDULED
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { status: "SCHEDULED" },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Insufficient permissions"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to approve posts" },
        { status: 403 }
      );
    }
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Error approving post:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
