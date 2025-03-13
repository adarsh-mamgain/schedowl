import Bull from "bull";
import logger from "./logger";
import prisma from "@/src/lib/prisma";
import { LinkedInService } from "./linkedin";
import { sendEmail } from "../lib/mailer";
import { PostStatus } from "@prisma/client";

interface PostJobData {
  postId: string;
  content: string;
  mediaIds: string[];
  socialAccountId: string;
  createdById: string;
}

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
  const { postId, content, mediaIds, socialAccountId, createdById } =
    job.data as PostJobData;
  logger.info(`Processing post ${postId}`);

  try {
    // Update post status to retrying if this is a retry attempt
    if (job.attemptsMade > 0) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: "RETRYING" as PostStatus,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });
    }

    // Get media files if any
    const mediaFiles =
      mediaIds.length > 0
        ? await prisma.mediaAttachment.findMany({
            where: { id: { in: mediaIds } },
          })
        : [];

    // Publish post with media
    await LinkedInService.publishPost(socialAccountId, content, mediaFiles);

    // Update post status to published
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED" as PostStatus,
        publishedAt: new Date(),
      },
    });

    logger.info(`Successfully published post ${postId}`);
  } catch (error) {
    logger.error(`Error publishing post ${postId}:`, error);

    // If all retries are exhausted
    if (job.attemptsMade >= job.opts.attempts!) {
      // Update post status to failed
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: "FAILED" as PostStatus,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      // Get user email for notification
      const user = await prisma.user.findUnique({
        where: { id: createdById },
        select: { email: true, name: true },
      });

      if (user?.email) {
        // Send failure notification email
        await sendEmail({
          to: user.email,
          subject: "LinkedIn Post Failed",
          template: "post-failed",
          context: {
            postContent: content,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            retryCount: job.attemptsMade + 1,
          },
          html: `<h1>LinkedIn Post Failed</h1><p>Hi ${user.name},</p><p>Your LinkedIn post scheduled for publication has failed after multiple retry attempts. Please check your post in the dashboard for more details.</p><p>Best regards,<br>Schedowl Team</p>`,
        });
      }
    }

    throw error; // Re-throw error for Bull to handle retry
  }
});

// Handle completed jobs
postQueue.on("completed", async (job) => {
  const { postId } = job.data as PostJobData;
  logger.info(`Job completed for post ${postId}`);
});

// Handle failed jobs
postQueue.on("failed", async (job, error) => {
  const { postId } = job.data as PostJobData;
  logger.error(`Job failed for post ${postId}:`, error);
});

// Schedule a post
export async function schedulePost(data: PostJobData, scheduledFor: Date) {
  const job = await postQueue.add(data, {
    delay: scheduledFor.getTime() - Date.now(),
  });

  // Update post with job ID
  await prisma.post.update({
    where: { id: data.postId },
    data: { jobId: job.id.toString() },
  });

  return job;
}

// Cancel a scheduled post
export async function cancelScheduledPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { jobId: true },
  });

  if (post?.jobId) {
    const job = await postQueue.getJob(post.jobId);
    if (job) {
      await job.remove();
    }
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "DRAFT" as PostStatus,
      jobId: null,
    },
  });
}
