import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check against directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Invalid filename", { status: 400 });
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

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
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
