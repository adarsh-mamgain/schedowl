import { cookies } from "next/headers";
import { SessionPayload } from "@/src/types/auth";
import prisma from "@/src/lib/prisma";
import { jwtVerify, SignJWT } from "jose";
import { cache } from "react";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

const SESSION_COOKIE_NAME = "session-token";

export class SessionManager {
  static async createSession(userId: string, organisationId: string) {
    if (!userId || !organisationId) {
      console.error("Missing parameters for createSession", {
        userId,
        organisationId,
      });
      throw new Error("userId and organisationId are required");
    }

    const cookieStore = await cookies();

    const member = await prisma.member.findFirst({
      where: { userId, organisationId, status: "ACCEPTED" },
    });

    if (!member) {
      console.error("No valid membership found");
      throw new Error("No valid membership found");
    }

    const session = await prisma.session.create({
      data: {
        userId,
        organisationId,
        memberId: member.id,
        sessionToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload: SessionPayload = {
      sessionId: session.id,
      userId: session.userId,
      memberId: session.memberId,
      organisationId: session.organisationId,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET_KEY);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });

    return payload;
  }

  static async validateSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);

      // const session = await prisma.session.findUnique({
      //   where: {
      //     id: payload.sessionId as string,
      //     expiresAt: { gt: new Date() },
      //   },
      // });
      //

      // if (!session) {
      //   await SessionManager.destroySession();
      //   return null;
      // }

      return payload as SessionPayload;
    } catch (error) {
      console.error("Session validation error:", error);
      await SessionManager.destroySession();
      return null;
    }
  }

  static async destroySession(): Promise<void> {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return;

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);

      await prisma.session.delete({
        where: { id: payload.sessionId as string },
      });
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  }
}

export const getServerSession = cache(async () => {
  return await SessionManager.validateSession();
});
