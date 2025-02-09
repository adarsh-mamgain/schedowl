import { sendEmail } from "@/src/lib/mailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { to, subject, html } = await req.json();

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const info = await sendEmail(to, subject, html);
    return NextResponse.json({ message: "Email sent", info });
  } catch (error) {
    return NextResponse.json({ message: "Email sending failed", error });
  }
}
