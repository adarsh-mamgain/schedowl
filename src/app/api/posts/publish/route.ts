import { authOptions } from "@/src/lib/auth";
import { LinkedInService } from "@/src/services/linkedin";
import logger from "@/src/services/logger";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { SocialAccount } from "@prisma/client";

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.organisation.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, linkedInAccountIds, mediaIds = [] } = await request.json();

    if (!content || !linkedInAccountIds) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the social accounts
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

    // Post to LinkedIn and store in database for each account
    const results = await Promise.all(
      socialAccounts.map(async (account: SocialAccount) => {
        try {
          // Post to LinkedIn
          await LinkedInService.publishPost(account.id, content, mediaIds);

          // Store in database as published
          const post = await prisma.post.create({
            data: {
              type: "LINKEDIN",
              content,
              status: "PUBLISHED",
              publishedAt: new Date(),
              scheduledFor: new Date(),
              socialAccountId: account.id,
              createdById: session.user.id,
              organisationId: session.organisation.id,
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
        } catch (error) {
          logger.error(
            `Error posting to LinkedIn for account ${account.name}:`,
            error
          );
          throw error;
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Error publishing posts:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
