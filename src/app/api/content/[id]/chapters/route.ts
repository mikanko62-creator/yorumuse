import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/content/[id]/chapters - List all published chapters for a content item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;

    const chapters = await prisma.chapter.findMany({
      where: {
        contentId,
        published: true,
      },
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        chapterNumber: "asc",
      },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Fetch chapters error:", error);
    return NextResponse.json({ error: "Failed to fetch chapters." }, { status: 500 });
  }
}

// POST /api/content/[id]/chapters - Admin creates a new chapter for an existing production
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id: contentId } = await params;
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

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: "Chapter title and video URL are required." },
        { status: 400 }
      );
    }

    // Verify content exists
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return NextResponse.json({ error: "Production content not found." }, { status: 404 });
    }

    // Determine chapter number if not explicitly specified
    let targetChapterNum = Number(chapterNumber);
    if (!targetChapterNum || targetChapterNum < 1) {
      const highestChapter = await prisma.chapter.findFirst({
        where: { contentId },
        orderBy: { chapterNumber: "desc" },
      });
      targetChapterNum = (highestChapter?.chapterNumber || 0) + 1;
    }

    const newChapter = await prisma.chapter.upsert({
      where: {
        contentId_chapterNumber: {
          contentId,
          chapterNumber: targetChapterNum,
        },
      },
      update: {
        title: title.trim(),
        description: description ? description.trim() : null,
        videoUrl: videoUrl.trim(),
        duration: duration || "45 min",
        thumbnail: thumbnail ? thumbnail.trim() : content.thumbnail,
        published: published !== undefined ? Boolean(published) : true,
      },
      create: {
        contentId,
        chapterNumber: targetChapterNum,
        title: title.trim(),
        description: description ? description.trim() : null,
        videoUrl: videoUrl.trim(),
        duration: duration || "45 min",
        thumbnail: thumbnail ? thumbnail.trim() : content.thumbnail,
        published: published !== undefined ? Boolean(published) : true,
      },
    });

    return NextResponse.json({ success: true, chapter: newChapter }, { status: 201 });
  } catch (error) {
    console.error("Create chapter error:", error);
    return NextResponse.json({ error: "Failed to create chapter." }, { status: 500 });
  }
}
