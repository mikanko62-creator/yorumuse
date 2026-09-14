import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides > 0) {
    console.log(`Already have ${existingSlides} hero slides. Skipping initial seed.`);
    return;
  }

  const featuredContent = await prisma.content.findMany({
    where: { featured: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (featuredContent.length === 0) {
    console.log("No featured content found.");
    return;
  }

  for (let i = 0; i < featuredContent.length; i++) {
    const item = featuredContent[i];
    await prisma.heroSlide.create({
      data: {
        title: item.title,
        subtitle: item.description,
        badge: i === 0 ? "Exclusive Premiere" : "Curated Masterpiece",
        category: item.category,
        thumbnail: item.thumbnail,
        trailerUrl: item.trailer,
        contentSlug: item.slug,
        ctaPrimaryText: "Nonton Sekarang",
        ctaPrimaryLink: `/content/${item.slug}`,
        ctaSecondaryText: "Lihat Trailer",
        order: i,
        isActive: true,
      },
    });
    console.log(`Created HeroSlide for: ${item.title}`);
  }

  console.log("HeroSlide initialization complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
