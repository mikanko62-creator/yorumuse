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

    const { id: postId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment text cannot be empty." }, { status: 400 });
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
