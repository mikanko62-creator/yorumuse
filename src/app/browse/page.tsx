"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ContentCard from "@/components/content/ContentCard";
import TrailerModal from "@/components/video/TrailerModal";
import { MOCK_CONTENT, CATEGORIES } from "@/data/mockContent";
import { ContentItem } from "@/types/content";

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSort = searchParams.get("sort") || "latest";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedAccess, setSelectedAccess] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTrailer, setSelectedTrailer] = useState<ContentItem | null>(null);

  const filteredItems = useMemo(() => {
    return MOCK_CONTENT.filter((item) => {
      // Category filter
      if (selectedCategory !== "all") {
        const catObj = CATEGORIES.find((c) => c.slug === selectedCategory);
        if (catObj && item.category !== catObj.name) {
          return false;
        }
      }

      // Access level filter
      if (selectedAccess !== "all" && item.accessLevel !== selectedAccess) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOption === "popular") {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortOption === "title") {
        return a.title.localeCompare(b.title);
      }
      // default: latest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [selectedCategory, selectedAccess, sortOption, searchQuery]);

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      {/* Browse Hero Header */}
      <section
        style={{
          padding: "60px 0 40px",
          background: "linear-gradient(180deg, #0e0e14 0%, var(--bg-base) 100%)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container">
          <span className="section-subtitle">Catalog & Archives</span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: "16px" }}>
            Explore All Productions
          </h1>
          <p style={{ maxWidth: "600px", color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            Browse our complete vault of cinematic adult originals, moody noir shorts, and exclusive member sessions.
          </p>

          {/* Filter Controls Bar */}
          <div
            style={{
              marginTop: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Search Input and Sort Row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Search Field */}
              <div style={{ position: "relative", minWidth: "280px", flexGrow: 1, maxWidth: "480px" }}>
                <input
                  type="search"
                  placeholder="Search by title, director, or theme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: "42px" }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                >
                  
                </span>
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Sort By:
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    padding: "10px 16px",
                  }}
                >
                  <option value="latest">Latest Releases</option>
                  <option value="popular">Most Viewed</option>
                  <option value="title">Title (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Category Buttons Pill Bar */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "8px",
                scrollbarWidth: "none",
              }}
            >
              <button
                onClick={() => setSelectedCategory("all")}
                className={`btn btn-sm ${selectedCategory === "all" ? "btn-primary" : "btn-secondary"}`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`btn btn-sm ${selectedCategory === cat.slug ? "btn-primary" : "btn-secondary"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Access Level Filters */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Tier:
              </span>
              {["all", "PUBLIC", "MEMBER", "PREMIUM"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedAccess(tier)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    border: selectedAccess === tier ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                    backgroundColor: selectedAccess === tier ? "var(--accent-gold)" : "var(--bg-surface)",
                    color: selectedAccess === tier ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    boxShadow: selectedAccess === tier ? "0 2px 6px rgba(166, 124, 30, 0.2)" : "none",
                  }}
                >
                  {tier === "all" ? "All Tiers" : tier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid Results */}
      <div className="container" style={{ padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: "24px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Showing {filteredItems.length} {filteredItems.length === 1 ? "film" : "films"}
        </div>

        {filteredItems.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "28px",
            }}
          >
            {filteredItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onWatchTrailer={(it) => setSelectedTrailer(it)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            
            <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "8px" }}>
              No productions match your criteria
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Try adjusting your category, tier filters, or search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedAccess("all");
                setSearchQuery("");
              }}
              className="btn btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={!!selectedTrailer}
        onClose={() => setSelectedTrailer(null)}
        videoUrl={selectedTrailer?.trailer || ""}
        posterImage={selectedTrailer?.thumbnail}
        title={selectedTrailer?.title || ""}
        category={selectedTrailer?.category}
      />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: "120px" }}>Loading catalog...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
