import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get("x-user-id");
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!userId || !organisationId) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const me = await prisma.member.findFirst({
    where: {
      userId: userId as string,
      organisationId: organisationId,
    },
    include: {
      user: {
        omit: {
          password: true,
        },
      },
      organisation: true,
    },
  });

  return NextResponse.json({ user: me?.user, organisation: me?.organisation });
}
