import prisma from "@/src/lib/prisma";
import { authOptions } from "@/src/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";
import logger from "@/src/services/logger";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  if (!session?.organisation.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfMonth = dayjs().startOf("month").toISOString();
  const endOfMonth = dayjs().endOf("month").toISOString();

  try {
    const posts = await prisma.post.findMany({
      where: {
        organisationId: session.organisation.id,
        scheduledFor: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    logger.error(`${request.method} ${request.nextUrl.pathname} ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
