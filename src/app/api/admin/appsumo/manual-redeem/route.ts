import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session?.user?.email !== "work.mamgain@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, codes } = await req.json();
    if (!email || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: "Email and codes array are required" },
        { status: 400 }
      );
    }

    // Clean and deduplicate codes
    const uniqueCodes = Array.from(
      new Set(codes.map((c: string) => c.trim()).filter(Boolean))
    );
    if (uniqueCodes.length !== codes.length) {
      return NextResponse.json(
        {
          error:
            "Duplicate or empty codes detected. Please enter unique, non-empty codes.",
        },
        { status: 400 }
      );
    }

    // Get user for the provided email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        { status: 400 }
      );
    }

    // Get active codes
    const activeCodes = await prisma.appSumoCode.findMany({
      where: {
        code: {
          in: uniqueCodes,
        },
        status: "ACTIVE",
      },
    });

    if (activeCodes.length !== uniqueCodes.length) {
      return NextResponse.json(
        {
          error: "Some codes are invalid or already redeemed.",
        },
        { status: 400 }
      );
    }

    // Prepare results
    const results: Array<{
      code: string;
      status: "success" | "error";
      message: string;
    }> = [];

    // Use a transaction for all redemptions
    await prisma.$transaction(async (tx) => {
      for (const code of activeCodes) {
        // Redeem the code
        await tx.appSumoCode.update({
          where: { id: code.id },
          data: {
            status: "REDEEMED",
            userId: user.id,
            redeemedAt: new Date(),
          },
        });

        results.push({
          code: code.code,
          status: "success",
          message: "Redeemed successfully.",
        });
      }
    });

    return NextResponse.json({
      message: "Redemption complete.",
      results,
    });
  } catch (error) {
    console.error("Error redeeming codes:", error);
    return NextResponse.json(
      { error: "Failed to redeem codes" },
      { status: 500 }
    );
  }
}
