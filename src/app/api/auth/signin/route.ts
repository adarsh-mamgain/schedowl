import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { comparePasswords, createSession } from "@/src/lib/auth";
import { z } from "zod";

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = signinSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organisation: true,
          },
          take: 1, // Get first organisation if exists
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await comparePasswords(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session with first organisation if exists
    const firstOrg = user.memberships[0]?.organisation;
    const session = await createSession(user.id, firstOrg?.id);

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
