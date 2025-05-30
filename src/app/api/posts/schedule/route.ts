"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { requirePermission } from "@/src/lib/permissions";
import { Role, SocialAccount } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getOrgOwnerFeatures } from "@/src/lib/features";
import { DEFAULT_FEATURES } from "@/src/constants/productFeatures";
import { addDays, isAfter } from "date-fns";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce scheduling restrictions: block if trial expired
  const features = await getOrgOwnerFeatures(session.organisation.id);
  // If features are DEFAULT_FEATURES, check if trial expired
  if (features === DEFAULT_FEATURES) {
    // Fetch org owner and check createdAt
    const org = await prisma.organisation.findUnique({
      where: { id: session.organisation.id },
      select: { owner: { select: { createdAt: true } } },
    });
    if (org?.owner?.createdAt) {
      const trialEnd = addDays(org.owner.createdAt, 14);
      if (isAfter(new Date(), trialEnd)) {
        return NextResponse.json(
          {
            error:
              "Your 14-day trial has expired. Please upgrade to schedule posts.",
          },
          { status: 403 }
        );
      }
    }
  }

  try {
    const body = await request.json();
    const { content, linkedInAccountIds, scheduledFor, mediaIds = [] } = body;

    if (
      !content ||
      !Array.isArray(linkedInAccountIds) ||
      linkedInAccountIds.length === 0 ||
      !scheduledFor
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Check if the user has permission to manage posts
    requirePermission(session.organisationRole.role as Role, "manage_posts");

    /// Get the social accounts
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        id: {
          in: linkedInAccountIds,
        },
        organisationId: session.organisation.id,
      },
    });

    if (socialAccounts.length !== linkedInAccountIds.length) {
      return NextResponse.json(
        { error: "Some social accounts not found" },
        { status: 400 }
      );
    }

    // Validate media IDs if provided
    if (mediaIds.length > 0) {
      const mediaCount = await prisma.mediaAttachment.count({
        where: {
          id: { in: mediaIds },
          organisationId: session.organisation.id,
        },
      });

      if (mediaCount !== mediaIds.length) {
        return NextResponse.json(
          { error: "Invalid media IDs provided" },
          { status: 400 }
        );
      }
    }

    // Convert the scheduled time to UTC
    const utcScheduledTime = dayjs(scheduledFor).utc().toDate();
    console.log(utcScheduledTime, "UTC SCHEDULED TIME");

    // Create posts for each social account
    const posts = await Promise.all(
      socialAccounts.map(async (account: SocialAccount) => {
        // Create the post
        const post = await prisma.post.create({
          data: {
            type: "LINKEDIN",
            content,
            status: "SCHEDULED",
            scheduledFor: utcScheduledTime,
            createdById: session.user.id,
            organisationId: session.organisation.id,
            socialAccountId: account.id,
            media: {
              create: mediaIds.map((mediaId: string) => ({
                media: { connect: { id: mediaId } },
              })),
            },
          },
          include: {
            media: {
              include: {
                media: true,
              },
            },
          },
        });

        return post;
      })
    );

    return NextResponse.json(posts);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Insufficient permissions"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to schedule posts" },
        { status: 403 }
      );
    }
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Error scheduling posts:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
