import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadToBunny } from "@/lib/bunny";
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

    const blockedExts = ["php", "html", "htm", "js", "svg", "xml", "exe", "sh", "bat", "cmd", "py", "pl", "cgi", "phar", "phtml"];
    if (blockedExts.includes(fileExt)) {
      return NextResponse.json(
        { error: "Tipe file ini dilarang demi keamanan sistem." },
        { status: 400 }
      );
    }

    // Validation by upload type
    if (uploadType === "video") {
      const allowedVideoExts = ["mp4", "webm", "mov", "mkv"];
      if (!allowedVideoExts.includes(fileExt) || !file.type.startsWith("video/")) {
        return NextResponse.json(
          { error: "Format video tidak valid. Format didukung: MP4, WebM, MOV, MKV." },
          { status: 400 }
        );
      }

      // Max size: 250MB
      const maxVideoBytes = 250 * 1024 * 1024;
      if (file.size > maxVideoBytes) {
        return NextResponse.json(
          { error: "Ukuran file video terlalu besar. Maksimum 250MB." },
          { status: 400 }
        );
      }

      const safeFilename = `video_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let videoUrl = "";
      try {
        // Primary: Upload to Bunny.net Cloud Storage & CDN
        videoUrl = await uploadToBunny(buffer, "videos", safeFilename, file.type || "video/mp4");
      } catch (cloudErr) {
        console.warn("Bunny upload failed, falling back to local storage:", cloudErr);
        const targetDir = path.join(process.cwd(), "storage", "videos");
        await fs.mkdir(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, safeFilename);
        await fs.writeFile(targetPath, buffer);
        videoUrl = `/api/stream/${safeFilename}`;
      }

      return NextResponse.json({
        success: true,
        type: "video",
        filename: safeFilename,
        originalName,
        size: file.size,
        url: videoUrl,
      });
    } else {
      // Thumbnail image
      const allowedImageExts = ["jpg", "jpeg", "png", "webp", "avif"];
      if (!allowedImageExts.includes(fileExt) || !file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Format gambar tidak valid. Format didukung: JPG, PNG, WebP, AVIF." },
          { status: 400 }
        );
      }

      // Max image size: 15MB
      const maxImageBytes = 15 * 1024 * 1024;
      if (file.size > maxImageBytes) {
        return NextResponse.json(
          { error: "Ukuran file gambar terlalu besar. Maksimum 15MB." },
          { status: 400 }
        );
      }

      const safeFilename = `thumb_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let publicUrl = "";
      try {
        // Primary: Upload to Bunny.net Cloud Storage & CDN
        publicUrl = await uploadToBunny(buffer, "thumbnails", safeFilename, file.type || "image/jpeg");
      } catch (cloudErr) {
        console.warn("Bunny upload failed, falling back to local storage:", cloudErr);
        const targetDir = path.join(process.cwd(), "public", "uploads", "thumbnails");
        await fs.mkdir(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, safeFilename);
        await fs.writeFile(targetPath, buffer);
        publicUrl = `/uploads/thumbnails/${safeFilename}`;
      }

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
