import { dodopayments } from "@/src/lib/dodopayments";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await dodopayments.misc.listSupportedCountries();
  return NextResponse.json(data);
}
