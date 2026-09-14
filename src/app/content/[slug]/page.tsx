import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasMemberAccess } from "@/lib/auth";
import { MOCK_CONTENT } from "@/data/mockContent";
import SeriesDetailView, { ChapterItem } from "@/components/content/SeriesDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch content from database with chapters and comment counts
  const dbContent = await prisma.content.findUnique({
    where: { slug },
    include: {
      chapters: {
        where: { published: true },
        orderBy: { chapterNumber: "asc" },
        include: {
          _count: {
            select: { comments: true },
          },
        },
      },
    },
  });

  let contentData = dbContent;

  if (!contentData) {
    const mock = MOCK_CONTENT.find((m) => m.slug === slug);
    if (!mock) {
      notFound();
    }
    contentData = {
      id: mock.id,
      title: mock.title,
      slug: mock.slug,
      description: mock.description,
      thumbnail: mock.thumbnail,
      trailer: mock.trailer,
      videoUrl: mock.videoUrl || mock.trailer,
      category: mock.category,
      accessLevel: mock.accessLevel,
      featured: mock.featured,
      published: mock.published,
      duration: mock.duration || "45 min",
      views: mock.views || 0,
      likes: mock.likes || 18,
      releaseYear: mock.releaseYear || 2026,
      tags: mock.tags ? JSON.stringify(mock.tags) : null,
      createdAt: new Date(mock.createdAt),
      updatedAt: new Date(mock.createdAt),
      chapters: [],
    };
  }

  const content = contentData;

  // 2. Server-side Authentication & Access Verification
  const user = await getCurrentUser();
  const isMember = await hasMemberAccess(user);
  const isVip = user?.role === "ADMIN" || (isMember && user?.subscription?.planId === "vip_premium");

  let isAuthorized = false;
  if (content.accessLevel === "PUBLIC") {
    isAuthorized = true;
  } else if (content.accessLevel === "MEMBER") {
    isAuthorized = isMember;
  } else if (content.accessLevel === "PREMIUM") {
    isAuthorized = isVip;
  }

  // 3. Prepare chapters list (fallback to Chapter 1 if none found)
  const chapters: ChapterItem[] =
    content.chapters && content.chapters.length > 0
      ? content.chapters.map((ch) => ({
          id: ch.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          description: ch.description,
          thumbnail: ch.thumbnail,
          videoUrl: ch.videoUrl,
          duration: ch.duration,
          published: ch.published,
          _count: ch._count,
        }))
      : [
          {
            id: `ch-default-${content.id}`,
            chapterNumber: 1,
            title: `Chapter 1: The Overture`,
            description: content.description,
            thumbnail: content.thumbnail,
            videoUrl: content.videoUrl || content.trailer,
            duration: content.duration || "45 min",
            published: true,
          },
        ];

  // Related content items
  const relatedItems = MOCK_CONTENT.filter(
    (item) => item.slug !== content.slug && item.category === content.category
  ).slice(0, 3);

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* 2-Column Series & Chapter View */}
      <SeriesDetailView
        content={{
          id: content.id,
          title: content.title,
          slug: content.slug,
          description: content.description,
          category: content.category,
          accessLevel: content.accessLevel,
          thumbnail: content.thumbnail,
          trailer: content.trailer,
          duration: content.duration,
          releaseYear: content.releaseYear,
          views: content.views,
          likes: content.likes,
          tags: content.tags,
        }}
        chapters={chapters}
        currentUser={
          user
            ? {
                id: user.id,
                username: user.username,
                role: user.role,
                avatarUrl: user.avatarUrl,
              }
            : null
        }
        isAuthorized={isAuthorized}
      />

      {/* Related Series */}
      {relatedItems.length > 0 && (
        <section
          style={{
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-surface)",
            padding: "48px 0 60px",
          }}
        >
          <div className="container" style={{ maxWidth: "1240px", padding: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Rekomendasi Serupa
                </span>
                <h3 style={{ fontSize: "1.4rem", color: "var(--text-primary)", fontFamily: "var(--font-serif)", marginTop: "2px" }}>
                  Lebih Banyak di {content.category}
                </h3>
              </div>
              <Link href={`/browse?category=${content.category.toLowerCase().replace(/ /g, "-")}`} className="view-all-link" style={{ color: "var(--accent-gold)" }}>
                Lihat Semua →
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "24px",
              }}
            >
              {relatedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/content/${item.slug}`}
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                    textDecoration: "none",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                  }}
                  className="related-series-card"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover" }}
                  />
                  <div style={{ padding: "16px" }}>
                    <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                      {item.title}
                    </h4>
                    <span className="badge badge-member" style={{ fontSize: "0.68rem" }}>
                      {item.accessLevel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
