import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse, sanitizeString } from "@/lib/security";
import path from "path";
import fs from "fs/promises";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return safeErrorResponse("Unauthorized", 401);
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return safeErrorResponse("File gambar tidak ditemukan.", 400);
    }

    // Strict MIME-type validation and extension derivation
    const safeExt = MIME_TO_EXT[file.type];
    if (!safeExt) {
      return safeErrorResponse(
        "Tipe file tidak didukung. Hanya file JPG, PNG, WebP, dan GIF yang diizinkan.",
        400
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return safeErrorResponse("Ukuran file terlalu besar. Maksimal 5MB.", 400);
    }

    // Safe sanitized filename
    const filename = `avatar_${user.id}_${Date.now()}.${safeExt}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    // Delete old avatar safely (prevent directory traversal)
    if (user.avatarUrl && typeof user.avatarUrl === "string") {
      const sanitizedOldUrl = sanitizeString(user.avatarUrl, 255);
      if (
        sanitizedOldUrl.startsWith("/uploads/avatars/") &&
        !sanitizedOldUrl.includes("..") &&
        !sanitizedOldUrl.includes("\\")
      ) {
        const oldPath = path.join(process.cwd(), "public", sanitizedOldUrl);
        await fs.unlink(oldPath).catch(() => {});
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    return safeErrorResponse("Gagal memproses upload avatar.", 500, error);
  }
}
