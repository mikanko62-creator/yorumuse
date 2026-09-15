import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_CONTENT } from "@/data/mockContent";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "latest";
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const whereClause: Record<string, unknown> = {
      published: true,
    };

    if (category && category !== "all") {
      whereClause.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sort === "popular") {
      orderBy = { views: "desc" };
    } else if (sort === "title") {
      orderBy = { title: "asc" };
    } else if (sort === "updated") {
      orderBy = { updatedAt: "desc" };
    }

    const dbContents = await prisma.content.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      include: {
        chapters: {
          where: { published: true },
          orderBy: { chapterNumber: "desc" },
          include: {
            _count: {
              select: { comments: true },
            },
          },
        },
      },
    });

    if (dbContents && dbContents.length > 0) {
      const formatted = dbContents.map((c) => {
        const latestChapter = c.chapters[0] || null;
        let parsedTags: string[] = [];
        if (c.tags) {
          try {
            parsedTags = JSON.parse(c.tags);
            if (!Array.isArray(parsedTags)) parsedTags = [String(c.tags)];
          } catch {
            parsedTags = c.tags.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }

        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          thumbnail: latestChapter?.thumbnail || c.thumbnail,
          trailer: c.trailer,
          videoUrl: latestChapter?.videoUrl || c.videoUrl || c.trailer,
          category: c.category,
          accessLevel: c.accessLevel,
          featured: c.featured,
          published: c.published,
          duration: latestChapter?.duration || c.duration || "45 min",
          views: c.views,
          likes: c.likes,
          releaseYear: c.releaseYear,
          tags: parsedTags,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          latestChapterNumber: latestChapter ? latestChapter.chapterNumber : 1,
          latestChapterTitle: latestChapter ? latestChapter.title : null,
          totalChapters: c.chapters.length,
        };
      });

      return NextResponse.json({ content: formatted });
    }

    return NextResponse.json({ content: MOCK_CONTENT });
  } catch (error) {
    console.error("GET /api/content error:", error);
    return NextResponse.json({ content: MOCK_CONTENT });
  }
}
