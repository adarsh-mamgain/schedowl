import { Monitoring } from "@/src/services/monitoring";
import { NextResponse } from "next/server";

export async function GET() {
  const metrics = await Monitoring.getMetrics();
  return new NextResponse(metrics, {
    headers: { "Content-Type": "text/plain" },
  });
}
