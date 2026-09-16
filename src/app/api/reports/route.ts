import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to submit a content report." },
        { status: 401 }
      );
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account does not have permission to perform this action." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetType, targetId, reason, details } = body;

    const allowedTargetTypes = ["POST", "COMMENT", "USER", "CONTENT"];
    if (!targetType || !allowedTargetTypes.includes(targetType) || !targetId || !reason) {
      return NextResponse.json(
        { error: "Invalid report data. Target type and reason are required." },
        { status: 400 }
      );
    }

    // Rate-limiting / duplicate check: prevent flooding reports for the same target
    const existingPendingReport = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        targetId,
        status: "PENDING",
      },
    });

    if (existingPendingReport) {
      return NextResponse.json({
        success: true,
        reportId: existingPendingReport.id,
        message: "A report for this content is already queued for moderator review.",
      });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason: String(reason).slice(0, 100),
        details: details ? String(details).slice(0, 1000) : null,
        status: "PENDING",
      },
    });

    // Content stays active until human administrator reviews and moderates it in the admin panel
    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report submitted successfully. Our moderation team will review this content shortly.",
    });
  } catch (error) {
    console.error("Report filing error:", error);
    return NextResponse.json({ error: "Failed to process report." }, { status: 500 });
  }
}
