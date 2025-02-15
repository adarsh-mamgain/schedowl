import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!userId || !organisationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.member.findFirst({
    where: {
      userId: userId as string,
      organisationId: organisationId,
    },
    include: {
      user: {
        omit: {
          password: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      organisation: {
        omit: {
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    omit: {
      userId: true,
      organisationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(user);
}
