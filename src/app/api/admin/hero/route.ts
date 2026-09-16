import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied: Only authorized admin accounts are allowed." },
        { status: 403 }
      );
    }

    const [slides, catalogItems] = await Promise.all([
      prisma.heroSlide.findMany({
        orderBy: { order: "asc" },
      }),
      prisma.content.findMany({
        where: { published: true },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          thumbnail: true,
          trailer: true,
          featured: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ slides, catalogItems });
  } catch (error) {
    console.error("Admin hero fetch error:", error);
    return NextResponse.json({ error: "Failed to load hero slides." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied: Only authorized admin accounts are allowed." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      badge,
      category,
      thumbnail,
      trailerUrl,
      contentSlug,
      ctaPrimaryText,
      ctaPrimaryLink,
      ctaSecondaryText,
      order,
      isActive,
    } = body;

    if (!title || !thumbnail) {
      return NextResponse.json(
        { error: "Title and thumbnail image URL are required." },
        { status: 400 }
      );
    }

    const maxOrderSlide = await prisma.heroSlide.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const defaultOrder = (maxOrderSlide?.order ?? -1) + 1;

    const newSlide = await prisma.heroSlide.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        badge: badge ? badge.trim() : "Exclusive Premiere",
        category: category ? category.trim() : "Manhwa",
        thumbnail: thumbnail.trim(),
        trailerUrl: trailerUrl ? trailerUrl.trim() : null,
        contentSlug: contentSlug ? contentSlug.trim() : null,
        ctaPrimaryText: ctaPrimaryText ? ctaPrimaryText.trim() : "Watch Now",
        ctaPrimaryLink: ctaPrimaryLink ? ctaPrimaryLink.trim() : (contentSlug ? `/content/${contentSlug}` : "/browse"),
        ctaSecondaryText: ctaSecondaryText ? ctaSecondaryText.trim() : "Watch Trailer",
        order: typeof order === "number" ? order : defaultOrder,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, slide: newSlide });
  } catch (error) {
    console.error("Admin create hero slide error:", error);
    return NextResponse.json({ error: "Failed to add hero slide." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied: Only authorized admin accounts are allowed." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Slide ID is required." }, { status: 400 });
    }

    const updated = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title.trim() }),
        ...(updates.subtitle !== undefined && { subtitle: updates.subtitle?.trim() || null }),
        ...(updates.badge !== undefined && { badge: updates.badge?.trim() || null }),
        ...(updates.category !== undefined && { category: updates.category?.trim() || null }),
        ...(updates.thumbnail && { thumbnail: updates.thumbnail.trim() }),
        ...(updates.trailerUrl !== undefined && { trailerUrl: updates.trailerUrl?.trim() || null }),
        ...(updates.contentSlug !== undefined && { contentSlug: updates.contentSlug?.trim() || null }),
        ...(updates.ctaPrimaryText && { ctaPrimaryText: updates.ctaPrimaryText.trim() }),
        ...(updates.ctaPrimaryLink && { ctaPrimaryLink: updates.ctaPrimaryLink.trim() }),
        ...(updates.ctaSecondaryText !== undefined && { ctaSecondaryText: updates.ctaSecondaryText?.trim() || null }),
        ...(typeof updates.order === "number" && { order: updates.order }),
        ...(updates.isActive !== undefined && { isActive: Boolean(updates.isActive) }),
      },
    });

    return NextResponse.json({ success: true, slide: updated });
  } catch (error) {
    console.error("Admin update hero slide error:", error);
    return NextResponse.json({ error: "Failed to update hero slide." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied: Only authorized admin accounts are allowed." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Slide ID is required." }, { status: 400 });
    }

    await prisma.heroSlide.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Hero slide deleted successfully." });
  } catch (error) {
    console.error("Admin delete hero slide error:", error);
    return NextResponse.json({ error: "Failed to delete hero slide." }, { status: 500 });
  }
}
