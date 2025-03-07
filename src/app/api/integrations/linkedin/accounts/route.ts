import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import logger from "@/src/services/logger";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const session = await getServerSession(authOptions);

  try {
    if (!session?.organisation.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await prisma.socialAccount.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" },
    });
    console.log("result: ", result);
    return NextResponse.json(result);
  } catch (error) {
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Error fetching linkedin accounts:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
