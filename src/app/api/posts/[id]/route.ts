import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
            bio: true,
          },
        },
        comments: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!post || (post.status !== "PUBLISHED" && post.status !== "UNDER_REVIEW")) {
      return NextResponse.json({ error: "Post not found or unavailable." }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Fetch post error:", error);
    return NextResponse.json({ error: "Unable to retrieve post." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions." }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Post deleted." });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post." }, { status: 500 });
  }
}
