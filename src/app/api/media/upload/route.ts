import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { MediaType } from "@prisma/client";
import { minioClient } from "@/src/lib/minio";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File and organisation ID are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and videos are allowed." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}.${extension}`;

    // Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer());
    await minioClient.putObject("media", filename, buffer, buffer.length, {
      "Content-Type": file.type,
    });

    // Determine media type
    let mediaType: MediaType = MediaType.IMAGE;
    if (file.type.startsWith("video/")) {
      mediaType = MediaType.VIDEO;
    }

    // Create media record in database
    const media = await prisma.mediaAttachment.create({
      data: {
        type: mediaType,
        url: `${process.env.MINIO_PUBLIC_URL}/media/${filename}`,
        key: filename,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        organisationId: session.organisation.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}
