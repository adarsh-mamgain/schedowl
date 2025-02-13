import { NextResponse } from "next/server";
import { SessionManager } from "@/src/lib/auth/session";

export async function GET() {
  const session = await SessionManager.validateSession();
  return NextResponse.json({ session });
}
