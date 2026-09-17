import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { safeErrorResponse, sanitizeString, sanitizeUrl } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category");
    const category = rawCategory ? sanitizeString(rawCategory, 50) : null;

    const whereClause: { status: string; category?: string } = {
      status: "PUBLISHED",
    };

    if (category && category !== "all") {
      whereClause.category = category;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: { where: { status: "PUBLISHED" } },
            likes: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return safeErrorResponse("Unable to retrieve community discussions.", 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return safeErrorResponse("You must be signed in to post in the community.", 401);
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return safeErrorResponse("Akun Anda sedang dibatasi dan tidak dapat membuat postingan.", 403);
    }

    const body = await request.json();
    const cleanTitle = sanitizeString(body.title, 200);
    const cleanContent = sanitizeString(body.content, 20000);
    const cleanCategory = sanitizeString(body.category || "Discussions", 50);
    const cleanMedia = body.media ? sanitizeUrl(body.media) : null;

    if (!cleanTitle || !cleanContent) {
      return safeErrorResponse("Title and content are required.", 400);
    }

    // Safety checks on title and content
    if (cleanTitle.length < 5 || cleanContent.length < 10) {
      return safeErrorResponse(
        "Judul minimal 5 karakter, isi postingan minimal 10 karakter.",
        400
      );
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        title: cleanTitle,
        content: cleanContent,
        category: cleanCategory || "Discussions",
        media: cleanMedia,
        status: "PUBLISHED",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Unable to publish community post." },
      { status: 500 }
    );
  }
}
