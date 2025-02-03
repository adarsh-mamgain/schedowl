import { LinkedInService } from "@/src/services/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const organisationId = requestHeaders.get("x-organisation-id");

  try {
    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation ID is undefined" },
        { status: 400 }
      );
    }
    const authUrl = await LinkedInService.getAuthUrl(organisationId);
    return NextResponse.json({ url: authUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
