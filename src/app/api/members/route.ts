import { generateJWT } from "@/src/lib/auth";
import { sendEmail } from "@/src/lib/mailer";
import prisma from "@/src/lib/prisma";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const organisationId = requestHeaders.get("x-organisation-id");

  if (!organisationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await prisma.member.findMany({
    where: { organisationId },
    include: { user: { omit: { password: true } } },
  });
  console.log("members", members);
  return NextResponse.json(members);
}

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = memberSchema.parse(body);

    const invitation = await prisma.invitation.findUnique({
      where: { email },
    });

    if (invitation) {
      return NextResponse.json(
        { error: "User is already invited" },
        { status: 400 }
      );
    }

    const userId = request.headers.get("x-user-id");
    const organisationId = request.headers.get("x-organisation-id");

    if (!organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // Adds 7 days

    const token = await generateJWT({
      organisationId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    }); // Convert to UNIX timestamp (seconds)

    await prisma.invitation.create({
      data: { email, organisationId, role, token, expiresAt },
    });

    sendEmail(
      email,
      `Invitation to join ${organisationId}`,
      `<p>Hey,</p> <p>${userId} is inviting you to join the ${organisationId}.</p>

       <p>Please click on the button below to sign up and then accept the invite.</p>

       <p>
         <a
           type="button"
           target="_blank"
           href=${process.env.NEXT_PUBLIC_BASE_URL}/signup?token=${token}
         >
           Accept Invite
         </a>
       </p>`
    );
    return NextResponse.json(true);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
