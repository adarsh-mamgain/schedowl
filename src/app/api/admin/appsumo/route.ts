import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { AppSumoCodeStatus } from "@prisma/client";

// Create multiple AppSumo codes
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && session?.user?.email !== "work.mamgain@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { codes } = await req.json();
    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: "Codes array is required" },
        { status: 400 }
      );
    }

    const createdCodes = await prisma.appSumoCode.createMany({
      data: codes.map((code: string) => ({
        code,
        status: "ACTIVE",
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Codes created successfully",
      count: createdCodes.count,
    });
  } catch (error) {
    console.error("Error creating codes:", error);
    return NextResponse.json(
      { error: "Failed to create codes" },
      { status: 500 }
    );
  }
}

// Get all AppSumo codes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await prisma.appSumoCode.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error("Error fetching codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch codes" },
      { status: 500 }
    );
  }
}

// Update AppSumo code status
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && session?.user?.email !== "work.mamgain@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, status } = await req.json();
    if (!code || !status) {
      return NextResponse.json(
        { error: "Code and status are required" },
        { status: 400 }
      );
    }

    const updatedCode = await prisma.appSumoCode.update({
      where: { code },
      data: { status: status as AppSumoCodeStatus },
    });

    return NextResponse.json({
      message: "Code updated successfully",
      code: updatedCode,
    });
  } catch (error) {
    console.error("Error updating code:", error);
    return NextResponse.json(
      { error: "Failed to update code" },
      { status: 500 }
    );
  }
}

// Delete all AppSumo codes
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && session?.user?.email !== "work.mamgain@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.appSumoCode.deleteMany();

    return NextResponse.json({ message: "All codes deleted" });
  } catch (error) {
    console.error("Error deleting codes:", error);
    return NextResponse.json(
      { error: "Failed to delete codes" },
      { status: 500 }
    );
  }
}
