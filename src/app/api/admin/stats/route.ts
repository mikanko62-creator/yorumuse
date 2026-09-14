import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    const [totalUsers, activeSubscriptions, contentCount, postCount, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.content.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    const recentReports = await prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        reporter: {
          select: { username: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        contentCount,
        postCount,
        pendingReports,
      },
      recentReports,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin statistics." }, { status: 500 });
  }
}
