import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { hashPassword, createSession, verifyJWT } from "@/src/lib/auth";
import { z } from "zod";
import { generateUniqueSlug } from "@/src/lib/common";
import { sendEmail } from "@/src/lib/mailer";
import type { Prisma } from "@prisma/client";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  token: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, token } = signupSchema.parse(body);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let user = await tx.user.findUnique({ where: { email } });

      if (token) {
        await verifyJWT(token);

        const invitation = await tx.member.findUnique({ where: { token } });

        if (
          !invitation ||
          !invitation.expiresAt ||
          invitation.expiresAt < new Date()
        ) {
          return NextResponse.json(
            { error: "Invalid or expired invite." },
            { status: 400 }
          );
        }

        if (!user) {
          user = await tx.user.create({
            data: {
              name,
              email,
              password: await hashPassword(password),
            },
          });
        }

        await tx.member.update({
          where: { id: invitation.id },
          data: {
            userId: user.id,
            status: "ACCEPTED",
            token: null,
            expiresAt: null,
          },
        });

        sendEmail(
          user.email,
          "Welcome!",
          `<p>You've successfully joined ${invitation.organisationId}!</p>`
        );

        return NextResponse.json({
          message: "Successfully joined organisation.",
        });
      }

      if (user) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      user = await tx.user.create({
        data: { email, password: hashedPassword, name },
      });

      const organisation = await tx.organisation.create({
        data: {
          name: "My Workspace",
          slug: generateUniqueSlug("My Workspace"),
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
              status: "ACCEPTED",
            },
          },
        },
      });

      const session = await createSession(user.id, organisation.id);

      sendEmail(
        user.email,
        "Welcome!",
        `<p>You've successfully joined ${organisation.name}!</p>`
      );

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name },
        organisation: session.organisation,
      });
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
