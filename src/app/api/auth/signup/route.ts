"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { hashPassword } from "@/src/lib/auth/password";
import { generateUniqueSlug } from "@/src/lib/common";
import { sendEmail } from "@/src/lib/mailer";
import { SessionManager } from "@/src/lib/auth/session";
import { SignUpSchema } from "@/src/schema";
import logger from "@/src/services/logger";

export async function POST(request: NextRequest) {
  logger.info(`${request.method} ${request.nextUrl.pathname}`);
  try {
    const body = await request.json();
    const { email, password, name, token } = SignUpSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (token) {
      const invitation = await prisma.member.findUnique({
        where: { token },
        include: { organisation: true },
      });

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

      let user = existingUser;
      const hashedPassword = await hashPassword(password);

      // Transaction for invitation flow
      const result = await prisma.$transaction(async (tx) => {
        if (!user) {
          user = await tx.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
            include: { memberships: { include: { organisation: true } } },
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

        return { user, organisation: invitation.organisation };
      });

      await SessionManager.createSession(
        result.user.id,
        invitation.organisationId
      );

      await sendEmail(
        result.user.email,
        "Welcome to " + invitation.organisation.name,
        `<p>You've successfully joined ${invitation.organisation.name}!</p>`
      );

      return NextResponse.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        organisation: result.organisation,
      });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Transaction for regular signup flow
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: await hashPassword(password),
          name,
        },
      });

      const organisation = await tx.organisation.create({
        data: {
          name: "My Workspace",
          slug: generateUniqueSlug("my-workspace"),
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
              status: "ACCEPTED",
            },
          },
        },
      });

      return { user, organisation };
    });

    await SessionManager.createSession(result.user.id, result.organisation.id);

    await sendEmail(
      result.user.email,
      `Welcome to ${result.organisation.name}`,
      `<h1>Welcome to ${result.organisation.name}!<h1> <p>Your workspace is ready.</p>`
    );

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      organisation: result.organisation,
    });
  } catch (error) {
    logger.error(
      `${request.method} ${request.nextUrl.pathname} Signup error:`,
      error
    );
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
