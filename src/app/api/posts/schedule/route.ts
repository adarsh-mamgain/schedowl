import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!userId || !organisationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, linkedInAccountIds, scheduledFor } = await request.json();

    if (!content || !linkedInAccountIds || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create posts for each selected LinkedIn account
    const posts = await Promise.all(
      linkedInAccountIds.map((linkedInId: string) =>
        prisma.post.create({
          data: {
            type: "LINKEDIN",
            content,
            scheduledFor: new Date(scheduledFor),
            status: "SCHEDULED",
            linkedInId,
            createdById: userId,
          },
        })
      )
    );

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error scheduling posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
