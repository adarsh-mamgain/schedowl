import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.organisation?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all subscriptions for the organisation
    const subscriptions = await prisma.subscription.findMany({
      where: {
        payments: {
          some: {
            user: {
              organisations: {
                some: {
                  organisationId: session.organisation.id,
                  role: "OWNER",
                },
              },
            },
          },
        },
      },
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all payments for the organisation
    const payments = await prisma.payment.findMany({
      where: {
        user: {
          organisations: {
            some: {
              organisationId: session.organisation.id,
              role: "OWNER",
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all AppSumo codes for the organisation's owner
    const appSumoCodes = await prisma.appSumoCode.findMany({
      where: {
        user: {
          organisations: {
            some: {
              organisationId: session.organisation.id,
              role: "OWNER",
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      subscriptions,
      payments,
      appSumoCodes,
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
