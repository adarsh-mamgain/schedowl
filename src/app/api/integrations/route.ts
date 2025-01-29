import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");

  if (!userId || !type) {
    return NextResponse.json(
      { error: "User ID and type are required" },
      { status: 400 }
    );
  }

  try {
    const { data: integration, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .single();

    if (error) {
      throw NextResponse.json(
        { error: "Failed to fetch integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: !!integration,
      integration,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}
