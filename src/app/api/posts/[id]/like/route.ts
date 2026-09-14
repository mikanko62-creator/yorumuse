import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to like posts." }, { status: 401 });
    }

    const { id: postId } = await params;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      liked = false;
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: user.id,
          postId,
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
      liked = true;
    }

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likesCount: true },
    });

    return NextResponse.json({
      success: true,
      liked,
      likesCount: updatedPost?.likesCount || 0,
    });
  } catch (error) {
    console.error("Like post error:", error);
    return NextResponse.json({ error: "Failed to toggle like." }, { status: 500 });
  }
}
