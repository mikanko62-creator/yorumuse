import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Hak akses Super User diperlukan." }, { status: 403 });
    }

    const { id: chapterId } = await params;
    const body = await request.json();
    const {
      chapterNumber,
      title,
      description,
      videoUrl,
      duration,
      thumbnail,
      published,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (chapterNumber !== undefined) updateData.chapterNumber = Number(chapterNumber);
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl.trim();
    if (duration !== undefined) updateData.duration = duration ? duration.trim() : "45 min";
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail ? thumbnail.trim() : null;
    if (published !== undefined) updateData.published = Boolean(published);

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
    });

    if (updatedChapter.contentId) {
      await prisma.content.update({
        where: { id: updatedChapter.contentId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      chapter: updatedChapter,
      message: "Chapter berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Admin update chapter error:", error);
    return NextResponse.json({ error: "Gagal memperbarui chapter." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Hak akses Super User diperlukan." }, { status: 403 });
    }

    const { id: chapterId } = await params;

    const chapterToDelete = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { contentId: true },
    });

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    if (chapterToDelete?.contentId) {
      await prisma.content.update({
        where: { id: chapterToDelete.contentId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Chapter dan semua komentar terkait berhasil dihapus.",
    });
  } catch (error) {
    console.error("Admin delete chapter error:", error);
    return NextResponse.json({ error: "Gagal menghapus chapter." }, { status: 500 });
  }
}
