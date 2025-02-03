// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { hashPassword, createSession } from "@/src/lib/auth";
import { z } from "zod";
import { generateUniqueSlug } from "@/src/lib/common";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = signupSchema.parse(body);

    console.log("first", email, password, name);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    console.log("existingUser", existingUser);

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
            isOwner: true,
          },
        },
      },
    });

    console.log("user", user);

    const session = await createSession(user.id, organisation.id);

    console.log("session", session);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organisation: session.organisation,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
