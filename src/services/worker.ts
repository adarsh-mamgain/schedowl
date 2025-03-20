import { postQueue } from "@/src/services/queue";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";

const BATCH_SIZE = 50; // Process posts in chunks
const JOB_PREFIX = "post-linkedin-"; // Unique prefix to prevent duplicates

logger.info("STARTING WORKER...");

// Handle graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down worker...");
  await postQueue.close();
  process.exit(0); // Exit gracefully after closing queue
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Log any unhandled errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1); // Exit with failure status
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection:", error);
  process.exit(1); // Exit with failure status
});

// Function to process scheduled posts
async function processScheduledPosts() {
  let hasMore = true;

  while (hasMore) {
    // Fetch a batch of posts
    const posts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: new Date() },
        OR: [{ lastRetryAt: null }, { lastRetryAt: { lte: new Date() } }],
      },
      take: BATCH_SIZE,
      include: {
        socialAccount: true,
        media: {
          include: {
            media: true,
          },
        },
      },
    });

    if (posts.length === 0) {
      hasMore = false;
      break;
    }

    logger.info(`Found ${posts.length} posts to process`);

    await Promise.all(
      posts.map(async (post) => {
        const jobId = `${JOB_PREFIX}${post.id}`;

        // Check if job already exists in Redis before adding
        const existingJob = await postQueue.getJob(jobId);
        if (existingJob) {
          logger.info(`Job ${jobId} already exists, skipping.`);
          return;
        }

        await postQueue.add(
          {
            postId: post.id,
            content: post.content,
            mediaIds: post.media.map((m) => m.mediaId),
            socialAccountId: post.socialAccountId,
            createdById: post.createdById,
          },
          {
            jobId,
            attempts: 5,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
      })
    );

    logger.info(`Queued ${posts.length} posts for processing`);

    // Optional: Short delay to prevent database overload
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Start processing posts
setInterval(async () => {
  try {
    await processScheduledPosts();
  } catch (error) {
    logger.error("Error processing scheduled posts:", error);
  }
}, 60000); // Check every minute

// Initial run
processScheduledPosts().catch((error) => {
  logger.error("Error in initial post processing:", error);
  process.exit(1);
});

logger.info("WORKER STARTED...");
