import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateCommentContent } from "@/lib/antiSpam";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;

    const comments = await prisma.chapterComment.findMany({
      where: {
        chapterId,
        status: "PUBLISHED",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Fetch chapter comments error:", error);
    return NextResponse.json({ error: "Failed to load chapter comments." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must sign in first to post a comment." },
        { status: 401 }
      );
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account does not have permission to comment." },
        { status: 403 }
      );
    }

    const { id: chapterId } = await params;
    const body = await request.json();
    const { content, honeypot } = body;

    // 1. Anti-Spam Validation
    const antiSpam = validateCommentContent(content || "", user.id, honeypot);
    if (!antiSpam.isValid) {
      return NextResponse.json({ error: antiSpam.error }, { status: 400 });
    }

    // 2. Ensure chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
    }

    // 3. Create chapter comment
    const newComment = await prisma.chapterComment.create({
      data: {
        chapterId,
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
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Create chapter comment error:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
