import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { SocialPlatform } from "@/src/enums/social-platoform";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get("platform");

  const requestHeaders = new Headers(request.headers);
  const organisationId = requestHeaders.get("x-organisation-id");

  console.log("organisationId", organisationId);

  if (!organisationId || !platform) {
    return NextResponse.json(
      { error: "Organisation ID and platform are required" },
      { status: 400 }
    );
  }

  try {
    const integration = await prisma.socialAccount.findFirst({
      where: {
        organisationId: organisationId,
        platform: platform as SocialPlatform,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "No integration exists" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: !!integration,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}
