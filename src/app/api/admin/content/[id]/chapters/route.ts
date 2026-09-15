import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id: contentId } = await params;

    const chapters = await prisma.chapter.findMany({
      where: { contentId },
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { chapterNumber: "asc" },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Admin fetch all chapters error:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar chapter." }, { status: 500 });
  }
}
