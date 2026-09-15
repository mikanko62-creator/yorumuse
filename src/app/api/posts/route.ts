import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

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
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { error: "Unable to retrieve community discussions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to post in the community." },
        { status: 401 }
      );
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Akun Anda sedang dibatasi dan tidak dapat membuat postingan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category, media } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    // Safety checks on title and content
    if (title.trim().length < 5 || title.length > 200 || content.trim().length < 10 || content.length > 20000) {
      return NextResponse.json(
        { error: "Judul minimal 5 (maks 200) karakter, isi postingan minimal 10 (maks 20.000) karakter." },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        title: title.trim(),
        content: content.trim(),
        category: category || "Discussions",
        media: media || null,
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
