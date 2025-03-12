import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { minioClient } from "@/src/lib/minio";
import prisma from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketName = "profile-images";
    const objectName = `user-${session.user.id}-${Date.now()}-${file.name}`;

    // Ensure bucket exists
    try {
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName);
      }
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      return NextResponse.json(
        { error: "Failed to prepare storage" },
        { status: 500 }
      );
    }

    // Upload file to MinIO
    await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
      "Content-Type": file.type,
    });

    // Generate URL
    const url = `${process.env.MINIO_ENDPOINT}/${bucketName}/${objectName}`;

    // Update user profile in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { error: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}
