import { LinkedInService } from "@/src/services/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  try {
    if (!userId || !organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await LinkedInService.post();

    return NextResponse.json({ message: "Posts processed" });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ message: "Internal Server Error" });
  }
}
