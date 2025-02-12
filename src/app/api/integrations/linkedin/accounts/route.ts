import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const organisationId = requestHeaders.get("x-organisation-id");

  try {
    if (!organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await prisma.linkedInAccount.findMany({
      where: { organisationId },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scheduling posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
