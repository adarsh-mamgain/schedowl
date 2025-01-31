import { auth } from "@/src/auth";
import { LinkedInService } from "@/src/app/services/linkedin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text } = await request.json();
    if (typeof session.user.id === "string") {
      const result = await LinkedInService.post(session.user.id, text);
      console.log("result", result);
    } else {
      throw new Error("User ID is not a string");
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to post to LinkedIn" },
      { status: 500 }
    );
  }
}
