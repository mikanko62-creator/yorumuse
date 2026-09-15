import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { getCurrentUser, hasMemberAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".mkv", ".ogg"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check against directory traversal and invalid filenames
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      !/^[a-zA-Z0-9_\-\.]+$/.test(filename)
    ) {
      return new NextResponse("Invalid filename format", { status: 400 });
    }

    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
      return new NextResponse("Unsupported media type", { status: 400 });
    }

    // Access authorization check for protected content
    const user = await getCurrentUser();
    const isMember = await hasMemberAccess(user);

    // Look up if file is associated with a paid Chapter or restricted Content
    const chapter = await prisma.chapter.findFirst({
      where: {
        videoUrl: { contains: filename },
      },
      include: {
        content: true,
      },
    }).catch(() => null);

    if (chapter) {
      // Chapter 1 of PUBLIC content is free; higher chapters or non-public content require membership
      const isRestricted = chapter.chapterNumber > 1 || chapter.content?.accessLevel !== "PUBLIC";
      if (isRestricted && !isMember && user?.role !== "ADMIN") {
        return new NextResponse("Subscription required to stream this chapter", { status: 403 });
      }
    } else {
      const contentItem = await prisma.content.findFirst({
        where: {
          videoUrl: { contains: filename },
        },
      }).catch(() => null);

      if (contentItem && contentItem.accessLevel !== "PUBLIC" && !isMember && user?.role !== "ADMIN") {
        return new NextResponse("Subscription required to stream this production", { status: 403 });
      }
    }

    // Locate protected video path
    let filePath = path.join(process.cwd(), "storage", "videos", filename);

    if (!fs.existsSync(filePath)) {
      // Fallback check
      const fallbackPath = path.join(process.cwd(), "public", "uploads", "videos", filename);
      if (fs.existsSync(fallbackPath)) {
        filePath = fallbackPath;
      } else {
        return new NextResponse("Video not found", { status: 404 });
      }
    }

    // Ensure resolved path is strictly within project root
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(process.cwd()))) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    // Determine content type
    const mimeTypes: Record<string, string> = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".mkv": "video/x-matroska",
      ".ogg": "video/ogg",
    };
    const contentType = mimeTypes[ext] || "video/mp4";

    // Common security and anti-download headers
    const securityHeaders = {
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };

    if (range) {
      // Parse Range header (e.g. "bytes=32324-")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      // Chunk size: 1MB or remaining
      const CHUNK_SIZE = 1024 * 1024; // 1MB chunk
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, fileSize - 1);

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const contentLength = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(fileStream);

      return new NextResponse(webStream as ReadableStream, {
        status: 206,
        headers: {
          ...securityHeaders,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": contentLength.toString(),
          "Content-Type": contentType,
        },
      });
    } else {
      // Full stream (or initial byte probe)
      const fileStream = fs.createReadStream(filePath);
      const webStream = Readable.toWeb(fileStream);

      return new NextResponse(webStream as ReadableStream, {
        status: 200,
        headers: {
          ...securityHeaders,
          "Content-Length": fileSize.toString(),
          "Content-Type": contentType,
        },
      });
    }
  } catch (error) {
    console.error("Secure stream error:", error);
    return new NextResponse("Internal Server Error during streaming", { status: 500 });
  }
}
