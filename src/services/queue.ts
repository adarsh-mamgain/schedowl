import Bull from "bull";
import logger from "./logger";
import prisma from "@/src/lib/prisma";
import { LinkedInService } from "./linkedin";
import { sendEmail } from "../lib/mailer";

// Create Bull queue
export const postQueue = new Bull("linkedin-posts", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000, // Initial delay of 1 second
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Process scheduled posts
postQueue.process(async (job) => {
  const { postId } = job.data;
  logger.info(`Processing post ${postId}`);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { linkedInAccount: true },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // Publish to LinkedIn
    await LinkedInService.publishPost(post.linkedInId, post.content);

    // Update post status
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        processingCompletedAt: new Date(),
      },
    });

    logger.info(`Successfully published post ${postId}`);
  } catch (error) {
    logger.error(`Failed to process post ${postId}:`, error);

    const failedPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (failedPost) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: job.attemptsMade >= 4 ? "FAILED" : "SCHEDULED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          nextRetryAt:
            job.attemptsMade >= 4
              ? null
              : new Date(Date.now() + Math.pow(2, job.attemptsMade) * 1000),
        },
      });
    }

    throw error; // Rethrow to trigger Bull's retry mechanism
  }
});

// Handle failed jobs
postQueue.on("failed", async (job, error) => {
  logger.error(`Job ${job.id} ${job.data.postId} failed:`, error);

  // Send notification (implement your notification logic)
  sendEmail(
    "support@schedowl.com",
    "🚨 JOB FAILED",
    `<h1>Job ${job.id} ${job.data.postId} failed</h1> <p>${error}</p>`
  );
});
