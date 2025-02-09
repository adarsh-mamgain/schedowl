import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { hashPassword, createSession } from "@/src/lib/auth";
import { z } from "zod";
import { generateUniqueSlug } from "@/src/lib/common";
import { sendEmail } from "@/src/lib/mailer";

const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const organisation = await prisma.organisation.create({
      data: {
        name: "Workspace 1",
        slug: generateUniqueSlug("Workspace 1"),
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    const session = await createSession(user.id, organisation.id);

    sendEmail(
      user.email,
      "Welcome to SchedOwl",
      `<p>Hey ${user.name}</p> <p>We are very happy to have you onboard at SchedOwl :)</p>`
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organisation: session.organisation,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
