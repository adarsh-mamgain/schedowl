import { SessionManager } from "@/src/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
  await SessionManager.destroySession();
  return NextResponse.json({ success: true });
}
