import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Admin moderation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation queue." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, action, adminNotes } = body;

    if (!reportId || !action) {
      return NextResponse.json({ error: "Report ID and action are required." }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Execute Moderation Action
    switch (action) {
      case "APPROVE":
        // Mark target back to PUBLISHED if it was quarantined
        if (report.targetType === "POST") {
          await prisma.post.update({
            where: { id: report.targetId },
            data: { status: "PUBLISHED" },
          }).catch(() => {});
        }
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "RESOLVED", adminNotes: adminNotes || "Approved as compliant." },
        });
        break;

      case "HIDE":
        if (report.targetType === "POST") {
          await prisma.post.update({
            where: { id: report.targetId },
            data: { status: "HIDDEN" },
          }).catch(() => {});
        } else if (report.targetType === "COMMENT") {
          await prisma.comment.update({
            where: { id: report.targetId },
            data: { status: "HIDDEN" },
          }).catch(() => {});
        }
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "RESOLVED", adminNotes: adminNotes || "Content hidden from community." },
        });
        break;

      case "REMOVE":
        if (report.targetType === "POST") {
          await prisma.post.delete({
            where: { id: report.targetId },
          }).catch(() => {});
        } else if (report.targetType === "COMMENT") {
          await prisma.comment.delete({
            where: { id: report.targetId },
          }).catch(() => {});
        }
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "RESOLVED", adminNotes: adminNotes || "Content permanently deleted." },
        });
        break;

      case "SUSPEND_USER":
        // Find author of target
        let suspendUserId = report.targetType === "USER" ? report.targetId : null;
        if (!suspendUserId && report.targetType === "POST") {
          const p = await prisma.post.findUnique({ where: { id: report.targetId } });
          suspendUserId = p?.authorId || null;
        }
        if (suspendUserId) {
          await prisma.user.update({
            where: { id: suspendUserId },
            data: { status: "SUSPENDED" },
          }).catch(() => {});
        }
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "RESOLVED", adminNotes: adminNotes || "User temporarily suspended." },
        });
        break;

      case "BAN_USER":
        let banUserId = report.targetType === "USER" ? report.targetId : null;
        if (!banUserId && report.targetType === "POST") {
          const p = await prisma.post.findUnique({ where: { id: report.targetId } });
          banUserId = p?.authorId || null;
        }
        if (banUserId) {
          await prisma.user.update({
            where: { id: banUserId },
            data: { status: "BANNED" },
          }).catch(() => {});
          // Delete active sessions
          await prisma.session.deleteMany({ where: { userId: banUserId } }).catch(() => {});
        }
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "RESOLVED", adminNotes: adminNotes || "User permanently banned." },
        });
        break;

      case "DISMISS":
      default:
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "DISMISSED", adminNotes: adminNotes || "Dismissed by moderator." },
        });
        break;
    }

    return NextResponse.json({ success: true, message: `Action ${action} executed successfully.` });
  } catch (error) {
    console.error("Admin moderation action error:", error);
    return NextResponse.json({ error: "Failed to process moderation action." }, { status: 500 });
  }
}
