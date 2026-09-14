import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("type") as string) || "video"; // "video" | "thumbnail"

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const originalName = file.name;
    const fileExt = path.extname(originalName).toLowerCase().replace(".", "") || (uploadType === "video" ? "mp4" : "jpg");

    // Validation by upload type
    if (uploadType === "video") {
      const allowedVideoExts = ["mp4", "webm", "mov", "mkv"];
      if (!allowedVideoExts.includes(fileExt) && !file.type.startsWith("video/")) {
        return NextResponse.json(
          { error: "Invalid video format. Supported: MP4, WebM, MOV." },
          { status: 400 }
        );
      }

      // Max size: 250MB
      const maxVideoBytes = 250 * 1024 * 1024;
      if (file.size > maxVideoBytes) {
        return NextResponse.json(
          { error: "Video file is too large. Maximum supported size is 250MB." },
          { status: 400 }
        );
      }

      const safeFilename = `video_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const targetDir = path.join(process.cwd(), "storage", "videos");
      await fs.mkdir(targetDir, { recursive: true });

      const targetPath = path.join(targetDir, safeFilename);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

      // Protected streaming URL
      const streamUrl = `/api/stream/${safeFilename}`;

      return NextResponse.json({
        success: true,
        type: "video",
        filename: safeFilename,
        originalName,
        size: file.size,
        url: streamUrl,
      });
    } else {
      // Thumbnail image
      const allowedImageExts = ["jpg", "jpeg", "png", "webp", "avif"];
      if (!allowedImageExts.includes(fileExt) && !file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Invalid image format. Supported: JPG, PNG, WebP." },
          { status: 400 }
        );
      }

      // Max image size: 15MB
      const maxImageBytes = 15 * 1024 * 1024;
      if (file.size > maxImageBytes) {
        return NextResponse.json(
          { error: "Image file is too large. Maximum supported size is 15MB." },
          { status: 400 }
        );
      }

      const safeFilename = `thumb_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const targetDir = path.join(process.cwd(), "public", "uploads", "thumbnails");
      await fs.mkdir(targetDir, { recursive: true });

      const targetPath = path.join(targetDir, safeFilename);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

      const publicUrl = `/uploads/thumbnails/${safeFilename}`;

      return NextResponse.json({
        success: true,
        type: "thumbnail",
        filename: safeFilename,
        originalName,
        size: file.size,
        url: publicUrl,
      });
    }
  } catch (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
