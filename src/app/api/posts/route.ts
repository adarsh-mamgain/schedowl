import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const memberId = requestHeaders.get("x-member-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!userId || !memberId || !organisationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfMonth = dayjs().startOf("month").toISOString();
  const endOfMonth = dayjs().endOf("month").toISOString();

  try {
    const posts = await prisma.post.findMany({
      where: {
        organisationId,
        scheduledFor: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
