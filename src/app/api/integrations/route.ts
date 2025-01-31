import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { IntegrationType } from "@/src/enums/integrations";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const provider = searchParams.get("provider");

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
        provider: provider as IntegrationType,
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
