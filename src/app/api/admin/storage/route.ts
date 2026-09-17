import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listBunnyFiles, deleteFromBunny, uploadToBunny } from "@/lib/bunny";
import { safeErrorResponse, sanitizeString } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return safeErrorResponse("Unauthorized", 403);
    }

    const searchParams = req.nextUrl.searchParams;
    const folder = sanitizeString(searchParams.get("folder") || "", 100);

    const items = await listBunnyFiles(folder);
    const totalBytes = items.reduce((acc, it) => acc + (it.Length || 0), 0);

    return NextResponse.json({
      folder,
      items,
      count: items.length,
      totalBytes,
    });
  } catch (error) {
    return safeErrorResponse("Gagal mengambil daftar file penyimpanan.", 500, error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return safeErrorResponse("Unauthorized", 403);
    }

    const body = await req.json();
    const filePath = sanitizeString(body.path || "", 255);

    if (!filePath || filePath.includes("..") || filePath.includes("\\")) {
      return safeErrorResponse("Path file tidak valid.", 400);
    }

    await deleteFromBunny(filePath);

    return NextResponse.json({ success: true, message: `Deleted ${filePath}` });
  } catch (error) {
    return safeErrorResponse("Gagal menghapus file penyimpanan.", 500, error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return safeErrorResponse("Unauthorized", 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = sanitizeString((formData.get("folder") as string) || "", 100);

    if (!file) {
      return safeErrorResponse("No file provided", 400);
    }

    // Sanitize filename against directory traversal
    const safeFilename = sanitizeString(file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), 100);
    if (!safeFilename || safeFilename.includes("..")) {
      return safeErrorResponse("Nama file tidak valid.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cdnUrl = await uploadToBunny(
      buffer,
      folder,
      safeFilename,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({
      success: true,
      filename: safeFilename,
      size: file.size,
      cdnUrl,
    });
  } catch (error) {
    return safeErrorResponse("Gagal mengunggah file ke penyimpanan cloud.", 500, error);
  }
}
