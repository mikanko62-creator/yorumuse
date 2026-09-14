import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    if (slides.length > 0) {
      return NextResponse.json({ slides });
    }

    // Fallback if no hero slides in table yet: fetch featured content
    const featuredContent = await prisma.content.findMany({
      where: { featured: true, published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const fallbackSlides = featuredContent.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      badge: index === 0 ? "Exclusive Premiere" : "Curated Masterpiece",
      category: item.category,
      thumbnail: item.thumbnail,
      trailerUrl: item.trailer,
      contentSlug: item.slug,
      ctaPrimaryText: "Nonton Sekarang",
      ctaPrimaryLink: `/content/${item.slug}`,
      ctaSecondaryText: "Lihat Trailer",
      order: index,
      isActive: true,
    }));

    return NextResponse.json({ slides: fallbackSlides });
  } catch (error) {
    console.error("Fetch hero slides error:", error);
    return NextResponse.json({ error: "Failed to fetch hero slides." }, { status: 500 });
  }
}
