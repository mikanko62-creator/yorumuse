import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya email yang terdaftar sebagai admin yang diizinkan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { author: { username: { contains: search } } },
        { author: { email: { contains: search } } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            avatarUrl: true,
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Admin posts fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar postingan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya email yang terdaftar sebagai admin yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { postId, status } = body;

    if (!postId || !status) {
      return NextResponse.json({ error: "Post ID dan status diperlukan." }, { status: 400 });
    }

    const validStatuses = ["PUBLISHED", "HIDDEN", "UNDER_REVIEW", "REMOVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { status },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error("Admin patch post error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status postingan." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya email yang terdaftar sebagai admin yang diizinkan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "Post ID diperlukan." }, { status: 400 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: "Postingan berhasil dihapus permanen." });
  } catch (error) {
    console.error("Admin delete post error:", error);
    return NextResponse.json({ error: "Gagal menghapus postingan." }, { status: 500 });
  }
}
