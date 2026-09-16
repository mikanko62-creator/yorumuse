import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listBunnyFiles, deleteFromBunny, uploadToBunny } from "@/lib/bunny";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const folder = searchParams.get("folder") || "";

    const items = await listBunnyFiles(folder);
    const totalBytes = items.reduce((acc, it) => acc + (it.Length || 0), 0);

    return NextResponse.json({
      folder,
      items,
      count: items.length,
      totalBytes,
    });
  } catch (error: any) {
    console.error("Storage list error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list storage items" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const filePath = body.path;

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    await deleteFromBunny(filePath);

    return NextResponse.json({ success: true, message: `Deleted ${filePath}` });
  } catch (error: any) {
    console.error("Storage delete error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete storage item" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cdnUrl = await uploadToBunny(
      buffer,
      folder,
      file.name,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      cdnUrl,
    });
  } catch (error: any) {
    console.error("Storage upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload to storage" },
      { status: 500 }
    );
  }
}
