"use server";

import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { verifyPassword } from "@/src/lib/auth/password";
import { SessionManager } from "@/src/lib/auth/session";
import { SignInSchema } from "@/src/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = SignInSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: "ACCEPTED" },
          include: { organisation: true },
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
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user has any memberships
    if (!user.memberships.length) {
      return NextResponse.json(
        { error: "No organisation available" },
        { status: 400 }
      );
    }

    // Get first organisation
    const firstMembership = user.memberships[0];

    try {
      // Create session
      await SessionManager.createSession(
        user.id,
        firstMembership.organisationId
      );

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organisation: firstMembership.organisation,
      });
    } catch (sessionError) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
