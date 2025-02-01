import { auth } from "@/src/auth";
import { LinkedInService } from "@/src/services/linkedin";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organisationId = session.user.organisationId;
    if (!organisationId) {
      return NextResponse.json(
        { error: "User ID is undefined" },
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
