import { postQueue } from "@/src/services/queue";
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import logger from "@/src/services/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  try {
    // Find posts that need to be scheduled
    const posts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lte: new Date(),
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      take: 50, // Process in batches
    });

    logger.info(`Found ${posts.length} posts to process`);

    // Add posts to queue
    for (const post of posts) {
      await postQueue.add(
        { postId: post.id },
        {
          jobId: `post-linkedin-${post.id}`,
          attempts: 5,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }

    return NextResponse.json({
      message: `Queued ${posts.length} posts for processing`,
    });
  } catch (error) {
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Cron job error:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
