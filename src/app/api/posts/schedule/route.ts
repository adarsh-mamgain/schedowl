"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { requirePermission } from "@/src/lib/permissions";
import { Role, SocialAccount } from "@prisma/client";

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Create posts for each social account
    const posts = await Promise.all(
      socialAccounts.map(async (account: SocialAccount) => {
        // Create the post
        const post = await prisma.post.create({
          data: {
            type: "LINKEDIN",
            content,
            status: "SCHEDULED",
            scheduledFor: new Date(scheduledFor + "Z"), // Store in UTC by appending Z
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
