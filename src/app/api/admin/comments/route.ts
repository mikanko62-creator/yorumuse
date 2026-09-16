import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied: Only authorized admin accounts are allowed." },
        { status: 403 }
      );
    }

    const [postComments, chapterComments] = await Promise.all([
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          author: {
            select: { id: true, username: true, email: true, role: true },
          },
          post: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.chapterComment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          author: {
            select: { id: true, username: true, email: true, role: true },
          },
          chapter: {
            select: {
              id: true,
              title: true,
              chapterNumber: true,
              content: { select: { title: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ postComments, chapterComments });
  } catch (error) {
    console.error("Admin comments fetch error:", error);
    return NextResponse.json({ error: "Failed to load comments list." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied: Only authorized admin accounts are allowed." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");
    const type = searchParams.get("type"); // "post" or "chapter"

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required." }, { status: 400 });
    }

    if (type === "chapter") {
      await prisma.chapterComment.delete({
        where: { id: commentId },
      });
    } else {
      await prisma.comment.delete({
        where: { id: commentId },
      });
    }

    return NextResponse.json({ success: true, message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Admin delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment." }, { status: 500 });
  }
}
