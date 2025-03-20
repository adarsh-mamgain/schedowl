import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "unhealthy", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
