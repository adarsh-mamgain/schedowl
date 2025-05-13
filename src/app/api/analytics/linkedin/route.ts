import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://linkedin-data-api.p.rapidapi.com/get-profile-posts?username=${username}`,
      {
        headers: {
          "x-rapidapi-host": "linkedin-data-api.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPID_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching LinkedIn data:", error);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn data" },
      { status: 500 }
    );
  }
}
