import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MOCK_CONTENT } from "../src/data/mockContent";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Seeding YoruMuse database...");

  // 1. Create Admin User
  const adminPasswordHash = await bcrypt.hash("AdminPassword18+", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@yorumuse.com" },
    update: {},
    create: {
      email: "admin@yorumuse.com",
      username: "YoruMuseAdmin",
      passwordHash: adminPasswordHash,
      birthDate: "1990-01-01",
      role: "ADMIN",
      status: "ACTIVE",
      bio: "Executive Platform Administrator and Curator at YoruMuse.",
    },
  });

  // Admin Active VIP Subscription
  await prisma.subscription.upsert({
    where: { id: "sub-admin" },
    update: {},
    create: {
      id: "sub-admin",
      userId: admin.id,
      planId: "vip_premium",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Create Active Member User
  const memberPasswordHash = await bcrypt.hash("MemberPassword18+", 10);
  const member = await prisma.user.upsert({
    where: { email: "member@yorumuse.com" },
    update: {},
    create: {
      email: "member@yorumuse.com",
      username: "VelvetPatron",
      passwordHash: memberPasswordHash,
      birthDate: "1994-06-15",
      role: "USER",
      status: "ACTIVE",
      bio: "Connoisseur of atmospheric noir and visual storytelling.",
    },
  });

  await prisma.subscription.upsert({
    where: { id: "sub-member-1" },
    update: {},
    create: {
      id: "sub-member-1",
      userId: member.id,
      planId: "member_monthly",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Create Free User
  const userPasswordHash = await bcrypt.hash("UserPassword18+", 10);
  const freeUser = await prisma.user.upsert({
    where: { email: "user@yorumuse.com" },
    update: {},
    create: {
      email: "user@yorumuse.com",
      username: "NocturneGuest",
      passwordHash: userPasswordHash,
      birthDate: "1998-11-20",
      role: "USER",
      status: "ACTIVE",
      bio: "Exploring the public previews and community discussions.",
    },
  });

  await prisma.subscription.upsert({
    where: { id: "sub-free-1" },
    update: {},
    create: {
      id: "sub-free-1",
      userId: freeUser.id,
      planId: "free_tier",
      status: "FREE",
    },
  });

  // 4. Seed Content Items and Chapters
  for (const item of MOCK_CONTENT) {
    const content = await prisma.content.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        trailer: item.trailer,
        videoUrl: item.videoUrl,
        category: item.category,
        accessLevel: item.accessLevel,
        featured: item.featured,
        published: item.published,
        duration: item.duration,
        views: item.views || 0,
        likes: item.likes || 0,
        releaseYear: item.releaseYear || 2026,
        tags: item.tags ? JSON.stringify(item.tags) : null,
      },
      create: {
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description,
        thumbnail: item.thumbnail,
        trailer: item.trailer,
        videoUrl: item.videoUrl,
        category: item.category,
        accessLevel: item.accessLevel,
        featured: item.featured,
        published: item.published,
        duration: item.duration,
        views: item.views || 0,
        likes: item.likes || 0,
        releaseYear: item.releaseYear || 2026,
        tags: item.tags ? JSON.stringify(item.tags) : null,
      },
    });

    // Seed Chapter 1 for each content item
    const chapter1 = await prisma.chapter.upsert({
      where: {
        contentId_chapterNumber: {
          contentId: content.id,
          chapterNumber: 1,
        },
      },
      update: {
        title: `Chapter 1: The Overture`,
        videoUrl: item.videoUrl || item.trailer,
        duration: item.duration || "42 min",
        thumbnail: item.thumbnail,
        published: true,
      },
      create: {
        contentId: content.id,
        chapterNumber: 1,
        title: `Chapter 1: The Overture`,
        description: `Bagian pembuka yang memukau memperkenalkan tema narasi dan atmosfer visual karya ini.`,
        videoUrl: item.videoUrl || item.trailer,
        duration: item.duration || "42 min",
        thumbnail: item.thumbnail,
        published: true,
      },
    });

    // Seed Chapter 2 for featured items
    if (item.featured) {
      const chapter2 = await prisma.chapter.upsert({
        where: {
          contentId_chapterNumber: {
            contentId: content.id,
            chapterNumber: 2,
          },
        },
        update: {
          title: `Chapter 2: Midnight Reverie`,
          videoUrl: item.videoUrl || item.trailer,
          duration: "38 min",
          thumbnail: item.thumbnail,
          published: true,
        },
        create: {
          contentId: content.id,
          chapterNumber: 2,
          title: `Chapter 2: Midnight Reverie`,
          description: `Bab lanjutan yang mendalami tensi emosional dan sinematografi noir yang intim.`,
          videoUrl: item.videoUrl || item.trailer,
          duration: "38 min",
          thumbnail: item.thumbnail,
          published: true,
        },
      });

      // Seed a chapter comment on chapter 2
      await prisma.chapterComment.upsert({
        where: { id: `cc-chap2-${item.id.slice(0, 8)}` },
        update: {},
        create: {
          id: `cc-chap2-${item.id.slice(0, 8)}`,
          chapterId: chapter2.id,
          authorId: member.id,
          content: "Transisi musik ambient di pertengahan bab kedua ini luar biasa tenang dan elegan. Sangat menyukai detail visualnya.",
          status: "PUBLISHED",
        },
      });
    }

    // Seed a chapter comment on chapter 1
    await prisma.chapterComment.upsert({
      where: { id: `cc-chap1-${item.id.slice(0, 8)}` },
      update: {},
      create: {
        id: `cc-chap1-${item.id.slice(0, 8)}`,
        chapterId: chapter1.id,
        authorId: member.id,
        content: "Sinematografi di Chapter 1 ini benar-benar memanjakan mata. Pencahayaan natural dan gradasi warna terasa sangat berkelas.",
        status: "PUBLISHED",
      },
    });
  }

  // 5. Seed Initial Community Posts
  const post1 = await prisma.post.upsert({
    where: { id: "post-001" },
    update: {},
    create: {
      id: "post-001",
      authorId: member.id,
      title: "The aesthetic direction of 'Shadows in Champagne'",
      content: "The lighting design in scene three completely subverts traditional tropes. The chiaroscuro contrast between the amber glow of the chandeliers and the deep obsidian shadows feels deeply inspired by 1940s Parisian cinema. Thoughts on the director's cut?",
      category: "Content Discussions",
      status: "PUBLISHED",
      likesCount: 14,
    },
  });

  await prisma.comment.upsert({
    where: { id: "comm-001" },
    update: {},
    create: {
      id: "comm-001",
      postId: post1.id,
      authorId: admin.id,
      content: "Thank you for noticing that detail! Our cinematographer specifically chose vintage anamorphic lenses to produce that warm, authentic roll-off.",
      status: "PUBLISHED",
    },
  });

  const post2 = await prisma.post.upsert({
    where: { id: "post-002" },
    update: {},
    create: {
      id: "post-002",
      authorId: admin.id,
      title: "Welcome to YoruMuse: Community Standards & Private Etiquette",
      content: "Welcome to our sanctuary. YoruMuse is built on three pillars: absolute consent, discerning taste, and uncompromised privacy. All members are expected to uphold mutual respect in every interaction.",
      category: "Announcements",
      status: "PUBLISHED",
      likesCount: 38,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
