import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!organisationId) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const members = await prisma.member.findMany();
  console.log("members", members);
  return NextResponse.json(members);
}

const memberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

// export async function POST(request: NextRequest) {
//   const body = await request.json();
//   const { role, isOwner, name } = memberSchema.parse(body);

//   const requestHeaders = new Headers(request.headers);
//   const userId = requestHeaders.get("x-user-id");
//   const organisationId = requestHeaders.get("x-organisation-id");

//   const member = await prisma.member.create({
//     data: {
//       role:
//     },
//   });
// }
