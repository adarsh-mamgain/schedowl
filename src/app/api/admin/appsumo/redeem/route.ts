import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import {
  APPSUMO_STACK_FEATURES,
  DEFAULT_FEATURES,
} from "@/src/constants/productFeatures";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to redeem a code" },
        { status: 401 }
      );
    }

    const { codes } = await req.json();
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > 5) {
      return NextResponse.json(
        { error: "You must provide between 1 and 5 codes." },
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

    // Prepare results
    const results: Array<{
      code: string;
      status: "success" | "error";
      message: string;
    }> = [];
    let redeemedCount = 0;

    // Use a transaction for all successful redemptions
    await prisma.$transaction(async (tx) => {
      for (const code of uniqueCodes) {
        // Check if code exists and is active
        const appSumoCode = await tx.appSumoCode.findUnique({
          where: { code, status: "ACTIVE" },
        });
        if (!appSumoCode) {
          results.push({
            code,
            status: "error",
            message: "Invalid or already redeemed/revoked code.",
          });
          continue;
        }
        // Check if this user already redeemed this code
        if (appSumoCode.userId && appSumoCode.userId === session.user.id) {
          results.push({
            code,
            status: "error",
            message: "You have already redeemed this code.",
          });
          continue;
        }
        // Redeem the code
        await tx.appSumoCode.update({
          where: { id: appSumoCode.id },
          data: {
            status: "REDEEMED",
            userId: session.user.id,
            redeemedAt: new Date(),
          },
        });
        // Create a lifetime subscription for the user
        const subscription = await tx.subscription.create({
          data: {
            subscriptionId: `appsumo-${appSumoCode.id}`,
            subscriptionStatus: "ACTIVE",
            nextBillingDate: new Date("2099-12-31"),
            payload: {
              type: "appsumo",
              code: appSumoCode.code,
            },
          },
        });
        // Create payment record after subscription exists
        await tx.payment.create({
          data: {
            paymentId: `appsumo-${appSumoCode.id}`,
            subscriptionId: subscription.subscriptionId,
            status: "SUCCEEDED",
            payload: {
              type: "appsumo",
              code: appSumoCode.code,
            },
            userId: session.user.id,
          },
        });
        results.push({
          code,
          status: "success",
          message: "Redeemed successfully.",
        });
        redeemedCount++;
      }
    });

    // Count how many AppSumo codes this user has redeemed (including these)
    const totalRedeemed = await prisma.appSumoCode.count({
      where: { userId: session.user.id, status: "REDEEMED" },
    });

    // Find the highest tier the user qualifies for
    const stackCounts = Object.keys(APPSUMO_STACK_FEATURES)
      .map(Number)
      .sort((a, b) => b - a); // Descending

    let features = DEFAULT_FEATURES;
    for (const count of stackCounts) {
      if (totalRedeemed >= count) {
        features = APPSUMO_STACK_FEATURES[count] || DEFAULT_FEATURES;
        break;
      }
    }

    // Update user features
    await prisma.user.update({
      where: { id: session.user.id },
      data: { features },
    });

    return NextResponse.json({
      message: "Redemption complete.",
      results,
      totalRedeemed,
      features,
    });
  } catch (error) {
    console.error("Error redeeming codes:", error);
    return NextResponse.json(
      { error: "Failed to redeem codes" },
      { status: 500 }
    );
  }
}
