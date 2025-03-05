import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { MinioClient } from "@/src/lib/minio";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await prisma.mediaAttachment.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.organisationId !== session.organisation.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete from MinIO
    await MinioClient.removeObject("media", media.key);

    // Delete from database
    await prisma.mediaAttachment.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
