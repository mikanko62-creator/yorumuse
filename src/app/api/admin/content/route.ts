import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const contentList = await prisma.content.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ content: contentList });
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch content catalog." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      thumbnail,
      trailer,
      videoUrl,
      category,
      accessLevel,
      featured,
      published,
      duration,
    } = body;

    if (!title || !description || !thumbnail || !trailer) {
      return NextResponse.json(
        { error: "Title, description, thumbnail URL, and trailer URL are required." },
        { status: 400 }
      );
    }

    let generatedSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const existing = await prisma.content.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    const chapterNum = Number(body.chapterNumber) || 1;
    const chapterName = body.chapterTitle?.trim() || `Chapter ${chapterNum}: ${title.trim()}`;
    const targetVideoUrl = videoUrl ? videoUrl.trim() : trailer.trim();
    const tagsValue = typeof body.tags === "object" ? JSON.stringify(body.tags) : body.tags || null;

    const newContent = await prisma.content.create({
      data: {
        title: title.trim(),
        slug: generatedSlug,
        description: description.trim(),
        thumbnail: thumbnail.trim(),
        trailer: trailer.trim(),
        videoUrl: targetVideoUrl,
        category: category || "Manhwa",
        accessLevel: accessLevel || "PUBLIC",
        featured: Boolean(featured),
        published: published !== undefined ? Boolean(published) : true,
        duration: duration || "45 min",
        tags: tagsValue,
        chapters: {
          create: {
            chapterNumber: chapterNum,
            title: chapterName,
            description: description.trim(),
            thumbnail: thumbnail.trim(),
            videoUrl: targetVideoUrl,
            duration: duration || "45 min",
            published: true,
          },
        },
      },
      include: {
        chapters: true,
      },
    });

    return NextResponse.json({ success: true, content: newContent });
  } catch (error) {
    console.error("Admin create content error:", error);
    return NextResponse.json({ error: "Failed to create content item." }, { status: 500 });
  }
}
