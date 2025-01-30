import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const provider = searchParams.get("provider");

  const session = await auth();

  console.log("checkin integration through type", session);

  if (!userId || !provider) {
    return NextResponse.json(
      { error: "User ID and provider are required" },
      { status: 400 }
    );
  }

  try {
    const integration = await prisma.integration.findFirst({
      where: {
        organisationId: userId,
        provider: provider,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Failed to fetch integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: !!integration,
      integration,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}
