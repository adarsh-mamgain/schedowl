import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const memberId = requestHeaders.get("x-member-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!userId || !memberId || !organisationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, linkedInAccountIds, scheduledFor } = body;

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

    const results = await Promise.all(
      linkedInAccountIds.map(async (linkedInId: string) => {
        try {
          const data = {
            type: "LINKEDIN",
            content: content.trim(),
            scheduledFor: new Date(scheduledFor),
            status: "SCHEDULED",
            linkedInId,
            createdById: memberId,
          };

          if (
            !data.type ||
            !data.content ||
            !data.scheduledFor ||
            !data.status ||
            !data.linkedInId ||
            !data.createdById
          ) {
            console.error("Invalid data detected", data);
            throw new Error("Invalid data structure");
          }

          const result = await prisma.post.create({
            data: {
              type: "LINKEDIN",
              content: content.trim(),
              scheduledFor: new Date(scheduledFor),
              status: "SCHEDULED",
              linkedInId,
              createdById: memberId,
              organisationId,
            },
          });

          return result;
        } catch (dbError) {
          console.error(
            "Database error while creating post:",
            dbError instanceof Error ? dbError.message : dbError
          );
          return null;
        }
      })
    );

    const successfulResults = results.filter(Boolean);

    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: "All post insertions failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, posts: successfulResults });
  } catch (error) {
    console.error(
      "Error scheduling posts:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
