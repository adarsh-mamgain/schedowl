import logger from "@/src/services/logger";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  return new Response("Hello World!", {
    status: 200,
  });
}
