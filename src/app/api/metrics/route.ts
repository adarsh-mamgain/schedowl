import logger from "@/src/services/logger";
import { Monitoring } from "@/src/services/monitoring";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  const metrics = await Monitoring.getMetrics();
  return new NextResponse(metrics, {
    headers: { "Content-Type": "text/plain" },
  });
}
