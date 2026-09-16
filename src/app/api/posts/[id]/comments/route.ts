import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to comment." }, { status: 401 });
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account is restricted and cannot comment." }, { status: 403 });
    }

    const { id: postId } = await params;

    // Verify post exists and is active
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });

    if (!post || post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Post not found or is no longer active." }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim() || content.trim().length > 3000) {
      return NextResponse.json({ error: "Comment content cannot be empty (maximum 3,000 characters)." }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        content: content.trim(),
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

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
