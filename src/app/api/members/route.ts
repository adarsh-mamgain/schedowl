import { generateJWT } from "@/src/lib/auth";
import { sendEmail } from "@/src/lib/mailer";
import prisma from "@/src/lib/prisma";
import { InviteSchema } from "@/src/schema";
import { NextRequest, NextResponse } from "next/server";

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

  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = InviteSchema.parse(body);

    const organisationId = request.headers.get("x-organisation-id");
    if (!organisationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists in the organisation
    const existingMember = await prisma.member.findFirst({
      where: {
        organisationId,
        OR: [{ user: { email } }],
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organisation." },
        { status: 400 }
      );
    }

    const token = await generateJWT({
      email,
      organisationId,
      exp: Math.floor(Date.now() / 1000) + 604800,
    });

    await prisma.member.create({
      data: {
        organisationId,
        role,
        token,
        expiresAt: new Date(Date.now() + 604800000),
      },
    });

    sendEmail(
      email,
      `Invitation to join ${organisationId}`,
      `<p>Hey,</p> <p>Join our team at ${organisationId}.</p>

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

    return NextResponse.json({ message: "Invitation sent successfully" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
