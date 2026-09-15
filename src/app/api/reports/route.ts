import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk mengirimkan laporan konten." },
        { status: 401 }
      );
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Akun Anda tidak memiliki izin untuk melakukan tindakan ini." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetType, targetId, reason, details } = body;

    const allowedTargetTypes = ["POST", "COMMENT", "USER", "CONTENT"];
    if (!targetType || !allowedTargetTypes.includes(targetType) || !targetId || !reason) {
      return NextResponse.json(
        { error: "Data laporan tidak valid. Tipe target dan alasan wajib diisi." },
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
        message: "Laporan untuk konten ini sudah dalam antrean peninjauan tim moderator.",
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
      message: "Laporan berhasil dikirim. Tim moderasi kami akan segera meninjau konten ini.",
    });
  } catch (error) {
    console.error("Report filing error:", error);
    return NextResponse.json({ error: "Gagal memproses laporan." }, { status: 500 });
  }
}
