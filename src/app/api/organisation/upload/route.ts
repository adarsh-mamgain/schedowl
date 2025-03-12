import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { minioClient } from "@/src/lib/minio";
import prisma from "@/src/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.organisation?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update org profile
    const userRole = await prisma.organisationRole.findUnique({
      where: {
        userId_organisationId: {
          userId: session.user.id,
          organisationId: session.organisation.id,
        },
      },
    });

    if (!userRole || (userRole.role !== "OWNER" && userRole.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketName = "organisation-images";
    const objectName = `org-${session.organisation.id}-${Date.now()}-${
      file.name
    }`;

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
    const url = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;

    // Update organisation profile in database
    await prisma.organisation.update({
      where: { id: session.organisation.id },
      data: { image: url },
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading organisation image:", error);
    return NextResponse.json(
      { error: "Failed to upload organisation image" },
      { status: 500 }
    );
  }
}
