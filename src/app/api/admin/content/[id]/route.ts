import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.content.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.description && { description: body.description.trim() }),
        ...(body.thumbnail && { thumbnail: body.thumbnail.trim() }),
        ...(body.trailer && { trailer: body.trailer.trim() }),
        ...(body.videoUrl && { videoUrl: body.videoUrl.trim() }),
        ...(body.category && { category: body.category }),
        ...(body.accessLevel && { accessLevel: body.accessLevel }),
        ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
        ...(body.published !== undefined && { published: Boolean(body.published) }),
        ...(body.duration && { duration: body.duration }),
      },
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (error) {
    console.error("Admin patch content error:", error);
    return NextResponse.json({ error: "Failed to update content." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.content.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Content deleted successfully." });
  } catch (error) {
    console.error("Admin delete content error:", error);
    return NextResponse.json({ error: "Failed to delete content." }, { status: 500 });
  }
}
