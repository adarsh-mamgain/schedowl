"use server";

import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/src/lib/prisma";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export type UserSession = {
  sessionId: string;
  userId: string;
  organisationId: string;
  exp: string;
};

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
) {
  return await compare(password, hashedPassword);
}

export async function createSession(userId: string, organisationId?: string) {
  try {
    const cookieStore = await cookies();
    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId,
        organisationId,
        sessionToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        organisation: true,
      },
    });

    if (!session) {
      throw new Error("Failed to create session.");
    }

    // Create JWT token
    const tokenPayload = {
      sessionId: session.id,
      userId: session.userId,
      organisationId: session.organisationId,
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET_KEY);

    // Set cookie using server action
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/", // Explicitly set path
    });

    return session;
  } catch (error) {
    throw error;
  }
}

export async function validateSession() {
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    const { payload }: { payload: UserSession } = await jwtVerify(
      token,
      SECRET_KEY
    );

    // const session = await prisma.session.findUnique({
    //   where: { id: payload.sessionId as string },
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         email: true,
    //         name: true,
    //       },
    //     },
    //     organisation: true,
    //   },
    // });

    // if (!session || session.expiresAt < new Date()) {
    //   cookieStore.delete("auth-token");
    //   return null;
    // }

    return payload;
  } catch (error) {
    cookieStore.delete("auth-token");
    throw error;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    await prisma.session.delete({
      where: { id: payload.sessionId as string },
    });

    cookieStore.delete("auth-token");
  } catch (error) {
    cookieStore.delete("auth-token");
    throw error;
  }
}
