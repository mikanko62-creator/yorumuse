import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { targetType, targetId, reason, details } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "Target type, target ID, and reason are required." },
        { status: 400 }
      );
    }

    // Require logged-in user or use an anonymous reporter ID if not logged in
    const reporterId = user ? user.id : (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id || "anonymous";

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    // If reason is severe (harassment or copyright), immediately set target to UNDER_REVIEW
    if (reason === "HARASSMENT" || reason === "COPYRIGHT" || reason === "INAPPROPRIATE") {
      if (targetType === "POST") {
        await prisma.post.update({
          where: { id: targetId },
          data: { status: "UNDER_REVIEW" },
        }).catch(() => {});
      } else if (targetType === "COMMENT") {
        await prisma.comment.update({
          where: { id: targetId },
          data: { status: "HIDDEN" },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report filed securely. Our moderation team reviews all reports promptly.",
    });
  } catch (error) {
    console.error("Report filing error:", error);
    return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
  }
}
