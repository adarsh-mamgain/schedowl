import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  try {
    if (!userId || !organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkedInId, content, scheduledFor } = await request.json();
    if (!linkedInId || !content || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        linkedInId,
        content,
        type: "LINKEDIN",
        scheduledFor: new Date(scheduledFor),
        status: "SCHEDULED",
        createdById: userId,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error scheduling post:", error);
    return NextResponse.json({ error: "Internal Server Error" });
  }
}
