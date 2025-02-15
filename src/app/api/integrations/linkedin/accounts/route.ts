import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const requestHeaders = new Headers(request.headers);
  const organisationId = requestHeaders.get("x-organisation-id");

  try {
    if (!organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await prisma.linkedInAccount.findMany({
      where: { organisationId },
    });
    return NextResponse.json(result);
  } catch (error) {
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
