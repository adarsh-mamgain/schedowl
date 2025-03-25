import cron from "node-cron";
import prisma from "@/src/lib/prisma";
import { linkedInService, LinkedInService } from "./linkedin";
import logger from "./logger";
import { PostStatus } from "@prisma/client";

class SchedulerService {
  private static instance: SchedulerService;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public start() {
    if (this.cronJob) {
      logger.info("Scheduler is already running");
      return;
    }

    // Run every minute to check for scheduled posts
    this.cronJob = cron.schedule("* * * * *", async () => {
      try {
        await this.processScheduledPosts();
      } catch (error) {
        logger.error("Error processing scheduled posts:", error);
      }
    });

    logger.info("Scheduler started successfully");
  }

  public stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info("Scheduler stopped successfully");
    }
  }

  private async processScheduledPosts() {
    logger.info(`Processing scheduled posts`);
    const now = new Date();

    // Find posts that are scheduled for now or earlier
    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        socialAccount: true,
        media: {
          include: {
            media: true,
          },
        },
      },
    });

    for (const post of posts) {
      try {
        // Publish the post
        await LinkedInService.publishPost(
          post.socialAccountId,
          post.content,
          post.media.map((m) => m.mediaId)
        );

        // Update post status to published
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(),
          },
        });

        logger.info(`Successfully published post ${post.id}`);
      } catch (error) {
        logger.error(`Error publishing post ${post.id}:`, error);
        await linkedInService.handleFailedPost(post, {
          status: 500,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }
}

export const schedulerService = SchedulerService.getInstance();
