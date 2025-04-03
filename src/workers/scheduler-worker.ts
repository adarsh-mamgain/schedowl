import prisma from "@/src/lib/prisma";
import { linkedInService, LinkedInService } from "@/src/services/linkedin";
import logger from "@/src/services/logger";
import { PostStatus } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { BaseWorker } from "./base-worker";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export class SchedulerWorker extends BaseWorker {
  private static _instance: SchedulerWorker;

  private constructor() {
    super("Scheduler Worker");
  }

  public static getInstance(): SchedulerWorker {
    if (!SchedulerWorker._instance) {
      SchedulerWorker._instance = new SchedulerWorker();
    }
    return SchedulerWorker._instance;
  }

  protected getSchedule(): string {
    return "* * * * *"; // Every minute in both dev and prod
  }

  protected async process(): Promise<void> {
    const now = dayjs().utc().toDate();

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
            publishedAt: dayjs().utc().toDate(),
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
