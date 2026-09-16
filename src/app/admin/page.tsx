"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditContentModal from "@/components/admin/EditContentModal";
import ManageChaptersModal from "@/components/admin/ManageChaptersModal";
import UserCrudModal from "@/components/admin/UserCrudModal";
import StorageFileManager from "@/components/admin/StorageFileManager";
import UploadVideoContentModal from "@/components/admin/UploadVideoContentModal";

// --- Interfaces ---

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  contentCount: number;
  postCount: number;
  pendingReports: number;
}

interface ContentRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  accessLevel: string;
  featured: boolean;
  published: boolean;
  duration?: string;
  thumbnail: string;
  trailer: string;
  views: number;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  birthDate: string;
  createdAt: string;
  subscriptions: {
    status: string;
    planId: string;
  }[];
  _count: {
    posts: number;
    comments: number;
  };
}

interface ReportRow {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  reporter?: {
    username: string;
  };
}

interface PostAuthor {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
}

interface PostCommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

interface PostRow {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  likesCount: number;
  createdAt: string;
  author: PostAuthor;
  comments: PostCommentItem[];
  _count: {
    likes: number;
    comments: number;
  };
}

interface HeroSlideRow {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  category?: string | null;
  thumbnail: string;
  trailerUrl?: string | null;
  contentSlug?: string | null;
  ctaPrimaryText?: string | null;
  ctaPrimaryLink?: string | null;
  ctaSecondaryText?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface CatalogItemForHero {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  trailer: string;
  featured: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "hero" | "content" | "users" | "moderation" | "storage">("overview");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; username: string; role: string } | null>(null);

  // Platform Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [contentList, setContentList] = useState<ContentRow[]>([]);
  const [userList, setUserList] = useState<UserRow[]>([]);
  const [reportList, setReportList] = useState<ReportRow[]>([]);

  // Post Control States
  const [postList, setPostList] = useState<PostRow[]>([]);
  const [postFilterStatus, setPostFilterStatus] = useState<string>("ALL");
  const [postSearch, setPostSearch] = useState<string>("");
  const [inspectingPost, setInspectingPost] = useState<PostRow | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Hero Section Management States
  const [heroSlides, setHeroSlides] = useState<HeroSlideRow[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItemForHero[]>([]);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHeroId, setEditingHeroId] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroBadge, setHeroBadge] = useState("Exclusive Premiere");
  const [heroCategory, setHeroCategory] = useState("Manhwa");
  const [heroThumbnail, setHeroThumbnail] = useState("");
  const [heroTrailerUrl, setHeroTrailerUrl] = useState("");
  const [heroContentSlug, setHeroContentSlug] = useState("");
  const [heroCtaPrimaryText, setHeroCtaPrimaryText] = useState("Nonton Sekarang");
  const [heroCtaPrimaryLink, setHeroCtaPrimaryLink] = useState("/browse");
  const [heroCtaSecondaryText, setHeroCtaSecondaryText] = useState("Watch Trailer");
  const [heroIsActive, setHeroIsActive] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [heroThumbUploadMode, setHeroThumbUploadMode] = useState<"upload" | "url">("upload");
  const [heroThumbUploading, setHeroThumbUploading] = useState(false);
  const [heroThumbFileName, setHeroThumbFileName] = useState("");

  // Upload Video & Create Content Modal State
  const [isUploadVideoModalOpen, setIsUploadVideoModalOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Manhwa");
  const [newAccess, setNewAccess] = useState("PUBLIC");
  const [newThumb, setNewThumb] = useState("");
  const [newTrailer, setNewTrailer] = useState("");
  const [newDuration, setNewDuration] = useState("45 min");
  const [newFeatured, setNewFeatured] = useState(false);
  const [newChapterNum, setNewChapterNum] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState("Chapter 1: The Encounter");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [creatingContent, setCreatingContent] = useState(false);

  // File Upload states for Content
  const [videoUploadMode, setVideoUploadMode] = useState<"upload" | "url">("upload");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoFileName, setVideoFileName] = useState("");
  const [thumbUploadMode, setThumbUploadMode] = useState<"upload" | "url">("upload");
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbFileName, setThumbFileName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add Chapter to Existing Production Modal State
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<ContentRow | null>(null);
  const [extraChapterNum, setExtraChapterNum] = useState(2);
  const [extraChapterTitle, setExtraChapterTitle] = useState("");
  const [extraChapterDesc, setExtraChapterDesc] = useState("");
  const [extraChapterVideo, setExtraChapterVideo] = useState("");
  const [extraChapterDuration, setExtraChapterDuration] = useState("45 min");
  const [extraChapterUploadMode, setExtraChapterUploadMode] = useState<"upload" | "url">("upload");
  const [extraChapterUploading, setExtraChapterUploading] = useState(false);
  const [extraChapterFileName, setExtraChapterFileName] = useState("");
  const [savingChapter, setSavingChapter] = useState(false);

  // Edit Content Modal State
  const [editingContentItem, setEditingContentItem] = useState<ContentRow | null>(null);
  const [isEditContentModalOpen, setIsEditContentModalOpen] = useState(false);

  // Manage Chapters Modal State
  const [managingContentForChapters, setManagingContentForChapters] = useState<ContentRow | null>(null);
  const [isManageChaptersModalOpen, setIsManageChaptersModalOpen] = useState(false);

  // User CRUD Modal State
  const [userToEdit, setUserToEdit] = useState<UserRow | null>(null);
  const [isUserCrudModalOpen, setIsUserCrudModalOpen] = useState(false);

  // --- 2. Data Loading ---
  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, contentRes, usersRes, reportsRes, postsRes, heroRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/content"),
        fetch("/api/admin/users"),
        fetch("/api/admin/moderation"),
        fetch("/api/admin/posts"),
        fetch("/api/admin/hero"),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }
      if (contentRes.ok) {
        const d = await contentRes.json();
        setContentList(d.content || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUserList(d.users || []);
      }
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReportList(d.reports || []);
      }
      if (postsRes.ok) {
        const d = await postsRes.json();
        setPostList(d.posts || []);
      }
      if (heroRes.ok) {
        const d = await heroRes.json();
        setHeroSlides(d.slides || []);
        setCatalogItems(d.catalogItems || []);
      }
    } catch (e) {
      console.error("Error loading admin data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own administrator account.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user "${email}"? All related data (posts, comments, and subscriptions) will be permanently removed.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user.");
      setUserList((prev) => prev.filter((u) => u.id !== userId));
      alert("User permanently deleted.");
      await loadAllAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  // Whitelist / New Admin State
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null);
  const [adminFormEmail, setAdminFormEmail] = useState("");
  const [adminFormUsername, setAdminFormUsername] = useState("");
  const [adminFormPassword, setAdminFormPassword] = useState("");
  const [adminFormLoading, setAdminFormLoading] = useState(false);


  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormEmail || !adminFormPassword) {
      alert("Email and password are required.");
      return;
    }
    setAdminFormLoading(true);
    try {
      const res = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminFormEmail.trim(),
          username: adminFormUsername.trim(),
          password: adminFormPassword,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create admin account.");
      setAdminActionMessage(`Success: Administrator account ${adminFormEmail} saved to Supabase!`);
      setAdminFormEmail("");
      setAdminFormUsername("");
      setAdminFormPassword("");
      await loadAllAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to process.");
    } finally {
      setAdminFormLoading(false);
    }
  };

  // --- 1. Authorization Verification ---
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setAuthorized(false);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setCurrentUser(data.user);
        if (data.user?.role !== "ADMIN") {
          setAuthorized(false);
          setLoading(false);
          return;
        }
        setAuthorized(true);
        await loadAllAdminData();
      } catch {
        if (!mounted) return;
        setAuthorized(false);
        setCurrentUser(null);
        setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [loadAllAdminData]);

  // Lock body scroll when any modal or drawer is open
  useEffect(() => {
    const anyModalOpen =
      isHeroModalOpen ||
      isAddContentOpen ||
      isAddChapterModalOpen ||
      isUserCrudModalOpen ||
      isEditContentModalOpen ||
      isManageChaptersModalOpen ||
      Boolean(inspectingPost);

    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    isHeroModalOpen,
    isAddContentOpen,
    isAddChapterModalOpen,
    isUserCrudModalOpen,
    isEditContentModalOpen,
    isManageChaptersModalOpen,
    inspectingPost,
  ]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const query = new URLSearchParams();
      if (postFilterStatus !== "ALL") query.set("status", postFilterStatus);
      if (postSearch.trim()) query.set("search", postSearch.trim());

      const res = await fetch(`/api/admin/posts?${query.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setPostList(d.posts || []);
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadHeroData = async () => {
    try {
      const res = await fetch("/api/admin/hero");
      if (res.ok) {
        const d = await res.json();
        setHeroSlides(d.slides || []);
        setCatalogItems(d.catalogItems || []);
      }
    } catch (e) {
      console.error("Error loading hero data:", e);
    }
  };

  // --- 3. Community Post Control Handlers ---
  const handleTogglePostStatus = async (postId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, status: newStatus }),
      });
      if (res.ok) {
        setPostList((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
        );
        if (inspectingPost && inspectingPost.id === postId) {
          setInspectingPost({ ...inspectingPost, status: newStatus });
        }
      } else {
        alert("Failed to update post status.");
      }
    } catch {
      alert("Network error occurred.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this post along with all its comments?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPostList((prev) => prev.filter((p) => p.id !== postId));
        if (inspectingPost && inspectingPost.id === postId) {
          setInspectingPost(null);
        }
        if (stats) setStats({ ...stats, postCount: Math.max(0, stats.postCount - 1) });
        alert("Post permanently deleted.");
      } else {
        alert("Failed to delete post.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeletePostComment = async (commentId: string) => {
    if (!confirm("Delete this member's comment?")) return;
    try {
      const res = await fetch(`/api/admin/comments?id=${commentId}&type=post`, { method: "DELETE" });
      if (res.ok) {
        if (inspectingPost) {
          const updatedComments = inspectingPost.comments.filter((c) => c.id !== commentId);
          setInspectingPost({
            ...inspectingPost,
            comments: updatedComments,
            _count: {
              ...inspectingPost._count,
              comments: Math.max(0, inspectingPost._count.comments - 1),
            },
          });
        }
        setPostList((prev) =>
          prev.map((p) =>
            p.id === inspectingPost?.id
              ? {
                  ...p,
                  comments: p.comments.filter((c) => c.id !== commentId),
                  _count: { ...p._count, comments: Math.max(0, p._count.comments - 1) },
                }
              : p
          )
        );
      } else {
        alert("Failed to delete comment.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  // --- 4. Hero Section Management Handlers ---
  const openNewHeroModal = () => {
    setEditingHeroId(null);
    setHeroTitle("");
    setHeroSubtitle("");
    setHeroBadge("Exclusive Premiere");
    setHeroCategory("Manhwa");
    setHeroThumbnail("");
    setHeroTrailerUrl("");
    setHeroContentSlug("");
    setHeroCtaPrimaryText("Watch Now");
    setHeroCtaPrimaryLink("/browse");
    setHeroCtaSecondaryText("Watch Trailer");
    setHeroIsActive(true);
    setIsHeroModalOpen(true);
  };

  const openEditHeroModal = (slide: HeroSlideRow) => {
    setEditingHeroId(slide.id);
    setHeroTitle(slide.title);
    setHeroSubtitle(slide.subtitle || "");
    setHeroBadge(slide.badge || "Exclusive Premiere");
    setHeroCategory(slide.category || "Manhwa");
    setHeroThumbnail(slide.thumbnail);
    setHeroTrailerUrl(slide.trailerUrl || "");
    setHeroContentSlug(slide.contentSlug || "");
    setHeroCtaPrimaryText(slide.ctaPrimaryText || "Watch Now");
    setHeroCtaPrimaryLink(slide.ctaPrimaryLink || (slide.contentSlug ? `/content/${slide.contentSlug}` : "/browse"));
    setHeroCtaSecondaryText(slide.ctaSecondaryText || "Watch Trailer");
    setHeroIsActive(slide.isActive);
    setIsHeroModalOpen(true);
  };

  const handleQuickImportCatalogToHero = (item: CatalogItemForHero) => {
    setHeroTitle(item.title);
    setHeroSubtitle(item.description);
    setHeroCategory(item.category);
    setHeroThumbnail(item.thumbnail);
    setHeroTrailerUrl(item.trailer);
    setHeroContentSlug(item.slug);
    setHeroCtaPrimaryText("Tonton Serial");
    setHeroCtaPrimaryLink(`/content/${item.slug}`);
    setHeroCtaSecondaryText("Preview Trailer");
    setHeroBadge(item.featured ? "Featured Premiere" : "Curated Masterpiece");
  };

  const handleSaveHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroTitle.trim() || !heroThumbnail.trim()) {
      alert("Hero banner title and thumbnail are required.");
      return;
    }

    setSavingHero(true);
    try {
      if (editingHeroId) {
        // Edit existing slide
        const res = await fetch("/api/admin/hero", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingHeroId,
            title: heroTitle.trim(),
            subtitle: heroSubtitle.trim(),
            badge: heroBadge.trim(),
            category: heroCategory.trim(),
            thumbnail: heroThumbnail.trim(),
            trailerUrl: heroTrailerUrl.trim() || null,
            contentSlug: heroContentSlug.trim() || null,
            ctaPrimaryText: heroCtaPrimaryText.trim(),
            ctaPrimaryLink: heroCtaPrimaryLink.trim(),
            ctaSecondaryText: heroCtaSecondaryText.trim(),
            isActive: heroIsActive,
          }),
        });

        if (res.ok) {
          setIsHeroModalOpen(false);
          await loadHeroData();
          alert("Hero slide updated successfully!");
        } else {
          const d = await res.json();
          alert(d.error || "Failed to update hero slide.");
        }
      } else {
        // Create new slide
        const res = await fetch("/api/admin/hero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: heroTitle.trim(),
            subtitle: heroSubtitle.trim(),
            badge: heroBadge.trim(),
            category: heroCategory.trim(),
            thumbnail: heroThumbnail.trim(),
            trailerUrl: heroTrailerUrl.trim() || null,
            contentSlug: heroContentSlug.trim() || null,
            ctaPrimaryText: heroCtaPrimaryText.trim(),
            ctaPrimaryLink: heroCtaPrimaryLink.trim(),
            ctaSecondaryText: heroCtaSecondaryText.trim(),
            isActive: heroIsActive,
          }),
        });

        if (res.ok) {
          setIsHeroModalOpen(false);
          await loadHeroData();
          alert("New hero slide successfully added to homepage!");
        } else {
          const d = await res.json();
          alert(d.error || "Failed to add hero slide.");
        }
      }
    } catch {
      alert("Network error occurred.");
    } finally {
      setSavingHero(false);
    }
  };

  const handleToggleHeroActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        setHeroSlides((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s))
        );
      }
    } catch {
      alert("Failed to update slide status.");
    }
  };

  const handleMoveHeroSlide = async (id: string, direction: "up" | "down") => {
    const index = heroSlides.findIndex((s) => s.id === id);
    if (index < 0) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === heroSlides.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentSlide = heroSlides[index];
    const targetSlide = heroSlides[targetIndex];

    try {
      await Promise.all([
        fetch("/api/admin/hero", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentSlide.id, order: targetSlide.order }),
        }),
        fetch("/api/admin/hero", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetSlide.id, order: currentSlide.order }),
        }),
      ]);
      await loadHeroData();
    } catch {
      alert("Failed to reorder slides.");
    }
  };

  const handleDeleteHeroSlide = async (id: string) => {
    if (!confirm("Delete this slide from the homepage Hero Section?")) return;
    try {
      const res = await fetch(`/api/admin/hero?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHeroSlides((prev) => prev.filter((s) => s.id !== id));
        alert("Hero slide deleted successfully.");
      }
    } catch {
      alert("Failed to delete slide.");
    }
  };

  // --- 5. User & Admin Whitelist Handlers ---
  const handlePromoteToAdmin = async (userId: string, email: string) => {
    if (!confirm(`Grant ADMINISTRATOR access to email: ${email}? This user will be able to access the entire admin panel.`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "ADMIN" }),
      });
      if (res.ok) {
        setUserList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: "ADMIN" } : u)));
        setAdminActionMessage(`Success! Account ${email} is now officially registered as an Admin.`);
        setTimeout(() => setAdminActionMessage(null), 5000);
      } else {
        alert("Failed to promote user.");
      }
    } catch {
      alert("Network error occurred.");
    }
  };

  const handleDemoteAdmin = async (userId: string, email: string) => {
    const adminCount = userList.filter((u) => u.role === "ADMIN").length;
    if (adminCount <= 1) {
      alert("Attention: Cannot revoke the last admin! The system requires at least one active administrator account.");
      return;
    }
    if (currentUser?.id === userId) {
      if (!confirm("You are about to revoke your own admin rights! You will lose access to this control panel. Continue?")) {
        return;
      }
    } else {
      if (!confirm(`Revoke Administrator access from email: ${email}?`)) return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "USER" }),
      });
      if (res.ok) {
        setUserList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: "USER" } : u)));
        if (currentUser?.id === userId) {
          router.push("/");
        } else {
          setAdminActionMessage(`Admin rights for ${email} have been revoked.`);
          setTimeout(() => setAdminActionMessage(null), 5000);
        }
      }
    } catch {
      alert("Failed to revoke admin status.");
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        setUserList((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      }
    } catch {
      alert("Failed to update user status.");
    }
  };

  // --- 6. Content Catalog Handlers ---
  const togglePublishContent = async (id: string, currentPublished: boolean) => {
    const res = await fetch(`/api/admin/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !currentPublished }),
    });
    if (res.ok) {
      setContentList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, published: !currentPublished } : c))
      );
    }
  };

  const toggleFeatureContent = async (id: string, currentFeatured: boolean) => {
    const res = await fetch(`/api/admin/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !currentFeatured }),
    });
    if (res.ok) {
      setContentList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, featured: !currentFeatured } : c))
      );
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this production?")) return;
    const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    if (res.ok) {
      setContentList((prev) => prev.filter((c) => c.id !== id));
      if (stats) setStats({ ...stats, contentCount: Math.max(0, stats.contentCount - 1) });
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setUploadError(null);
    setVideoFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video upload failed");

      setNewTrailer(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload video.";
      setUploadError(msg);
      setNewTrailer("");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    setUploadError(null);
    setThumbFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thumbnail upload failed");

      setNewThumb(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload poster.";
      setUploadError(msg);
      setNewThumb("");
    } finally {
      setThumbUploading(false);
    }
  };

  const handleHeroThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroThumbUploading(true);
    setHeroThumbFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");

      setHeroThumbnail(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      alert(msg);
      setHeroThumbnail("");
    } finally {
      setHeroThumbUploading(false);
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingContent(true);
    setUploadError(null);

    const finalCategory = isCustomCategory && customCategory.trim() ? customCategory.trim() : newCategory;
    const finalTrailerUrl = newTrailer.trim();
    const finalThumbUrl = newThumb.trim();

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          category: finalCategory,
          accessLevel: newAccess,
          thumbnail: finalThumbUrl,
          trailer: finalTrailerUrl,
          videoUrl: finalTrailerUrl,
          duration: newDuration,
          featured: newFeatured,
          published: true,
          chapterNumber: newChapterNum,
          chapterTitle: newChapterTitle.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddContentOpen(false);
        setContentList((prev) => [data.content, ...prev]);
        if (stats) setStats({ ...stats, contentCount: stats.contentCount + 1 });
        setNewTitle("");
        setNewDesc("");
        setNewThumb("");
        setNewTrailer("");
        alert("New production successfully added to the catalog!");
      } else {
        setUploadError(data.error || "Failed to create new content.");
      }
    } catch {
      setUploadError("Network error while saving content.");
    } finally {
      setCreatingContent(false);
    }
  };

  const openAddChapterModal = (contentItem: ContentRow) => {
    setSelectedProduction(contentItem);
    setExtraChapterNum(2);
    setExtraChapterTitle(`Chapter 2: Continuation of ${contentItem.title}`);
    setExtraChapterDesc("");
    setExtraChapterVideo("");
    setExtraChapterFileName("");
    setIsAddChapterModalOpen(true);
  };

  const handleExtraChapterVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtraChapterUploading(true);
    setExtraChapterFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload chapter video");

      setExtraChapterVideo(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload chapter video.";
      alert(msg);
      setExtraChapterVideo("");
    } finally {
      setExtraChapterUploading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    setSavingChapter(true);

    try {
      const res = await fetch(`/api/content/${selectedProduction.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterNumber: extraChapterNum,
          title: extraChapterTitle.trim() || `Chapter ${extraChapterNum}`,
          description: extraChapterDesc,
          videoUrl: extraChapterVideo,
          duration: extraChapterDuration,
        }),
      });

      if (res.ok) {
        setIsAddChapterModalOpen(false);
        alert(`Success! Chapter ${extraChapterNum} has been added to "${selectedProduction.title}".`);
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add chapter.");
      }
    } catch {
      alert("Network error occurred.");
    } finally {
      setSavingChapter(false);
    }
  };

  // --- 7. Moderation Handlers ---
  const handleModerate = async (reportId: string, action: string) => {
    const res = await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    if (res.ok) {
      setReportList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "RESOLVED" } : r))
      );
      if (stats) {
        setStats({ ...stats, pendingReports: Math.max(0, stats.pendingReports - 1) });
      }
    }
  };

  // --- 8. Render Loading & Access Gates ---

  if (loading) {
    return (
      <div style={{ paddingTop: "140px", textAlign: "center", color: "var(--accent-gold)" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(212, 175, 55, 0.2)",
            borderTopColor: "var(--accent-gold)",
            borderRadius: "50%",
            margin: "0 auto 16px",
          }}
          className="animate-spin"
        />
        <p style={{ fontWeight: 600 }}>Memverifikasi hak akses administratif...</p>
      </div>
    );
  }

  // Security Gate: User is not authenticated OR Email is not an Admin
  if (!authorized) {
    return (
      <div
        className="container"
        style={{
          paddingTop: "150px",
          paddingBottom: "100px",
          textAlign: "center",
          maxWidth: "560px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            padding: "48px 36px",
            borderRadius: "20px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 800, fontSize: "1.2rem" }}>!</div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              marginBottom: "16px",
            }}
          >
            RESTRICTED ADMIN PORTAL
          </div>

          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.9rem",
              color: "var(--text-primary)",
              marginBottom: "12px",
            }}
          >
            Registered Admin Email Only
          </h2>

          {currentUser ? (
            <div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                You are currently connected as:
              </p>
              <div
                style={{
                  padding: "12px 18px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.95rem",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                {currentUser.email} <span style={{ color: "#ef4444", fontSize: "0.8rem", fontWeight: 700 }}>(Not Admin)</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "32px", lineHeight: 1.6 }}>
                This account's email does not have administrator access. Please sign out and sign in with an account that has an official administrator email (e.g.: <code>admin@yorumuse.com</code>).
              </p>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", marginBottom: "32px", lineHeight: 1.6 }}>
              This admin portal is strictly protected. Only users with emails officially registered as Administrators can sign in to control posts, hero section, and catalog.
            </p>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login?redirect=/admin" className="btn btn-primary btn-lg">
              Sign In with Admin Email
            </Link>
            <Link href="/" className="btn btn-secondary btn-lg">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registered Admin Whitelist List
  const adminUsers = userList.filter((u) => u.role === "ADMIN");

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* Top Admin Control Header & Menu */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "20px 0",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.75rem", padding: "3px 10px", backgroundColor: "#b91c1c", color: "#ffffff", borderRadius: "4px", fontWeight: 800, letterSpacing: "0.05em" }}>
                    ADMIN CONSOLE
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                    YORUMUSE EXECUTIVE
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    • Connected: <strong>{currentUser?.email}</strong>
                  </span>
                </div>
                <h1 style={{ fontSize: "1.75rem", color: "var(--text-primary)", marginTop: "4px", fontWeight: 700, margin: 0 }}>
                  Platform Control Center
                </h1>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setIsUploadVideoModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(212, 175, 55, 0.3)",
                }}
              >
                <span>+ Upload Video / New Title</span>
              </button>
              <Link href="/" target="_blank" className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>View Website</span>
              </Link>
            </div>
          </div>

          {/* Luxury Navigation Menu Tabs */}
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              padding: "4px",
              gap: "4px",
              overflowX: "auto",
            }}
          >
            {[
              { id: "overview", label: "Overview", count: null },
              { id: "posts", label: "Post Control", count: postList.length },
              { id: "hero", label: "Hero Section", count: heroSlides.length },
              { id: "content", label: "Catalog & Chapters", count: contentList.length },
              { id: "users", label: "Manage Users", count: userList.length },
              { id: "moderation", label: "Moderation", count: stats?.pendingReports || 0 },
              { id: "storage", label: "Bunny Storage", count: null },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    backgroundColor: isActive ? "var(--accent-gold)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    border: isActive ? "1px solid var(--accent-gold)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  id={`admin-menu-${tab.id}`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontSize: "0.72rem",
                        backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.08)",
                        color: isActive ? "#ffffff" : "var(--text-muted)",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Admin Content Container */}
      <div className="container" style={{ padding: "36px 20px 80px" }}>
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && stats && (
          <div>
            {/* KPI Metric Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "18px",
                marginBottom: "32px",
              }}
            >
              <div style={{ backgroundColor: "var(--bg-surface)", padding: "22px", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Total Registered Users
                </span>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", color: "var(--text-primary)", marginTop: "4px" }}>
                  {stats.totalUsers}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--status-success)" }}>100% Verified Accounts</span>
              </div>

              <div style={{ backgroundColor: "var(--bg-surface)", padding: "22px", borderRadius: "14px", border: "1px solid var(--border-active)", boxShadow: "var(--shadow-sm)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", textTransform: "uppercase", fontWeight: 700 }}>
                  Active Subscriptions (Patrons)
                </span>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", color: "var(--accent-gold)", marginTop: "4px" }}>
                  {stats.activeSubscriptions}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Paid Members</span>
              </div>

              <div style={{ backgroundColor: "var(--bg-surface)", padding: "22px", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Film Production Catalog
                </span>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", color: "var(--text-primary)", marginTop: "4px" }}>
                  {stats.contentCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Films & Series Chapters</span>
              </div>

              <div style={{ backgroundColor: "var(--bg-surface)", padding: "22px", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Community Posts
                </span>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", color: "var(--text-primary)", marginTop: "4px" }}>
                  {stats.postCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Discussions & Announcements</span>
              </div>

              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  padding: "22px",
                  borderRadius: "14px",
                  border: stats.pendingReports > 0 ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: stats.pendingReports > 0 ? "#dc2626" : "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Violation Reports
                </span>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2.3rem", color: stats.pendingReports > 0 ? "#dc2626" : "var(--text-primary)", marginTop: "4px" }}>
                  {stats.pendingReports}
                </div>
                <span style={{ fontSize: "0.75rem", color: stats.pendingReports > 0 ? "#dc2626" : "var(--status-success)" }}>
                  {stats.pendingReports > 0 ? "Needs Immediate Review" : "All Clear"}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: KONTROL SEMUA POSTINGAN ================= */}
        {activeTab === "posts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  Control & Moderate All Community Posts
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
                  Manage all discussions, forums, and announcements. You can change publication status, review comments, or permanently delete posts.
                </p>
              </div>

              {/* Filter and Search Bar */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search by title, content, or author email..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPosts()}
                  style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", width: "260px" }}
                />
                <button onClick={loadPosts} className="btn btn-secondary btn-sm">
                  Search
                </button>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {["ALL", "PUBLISHED", "HIDDEN", "UNDER_REVIEW"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setPostFilterStatus(st);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    backgroundColor: postFilterStatus === st ? "var(--text-primary)" : "var(--bg-surface)",
                    color: postFilterStatus === st ? "var(--bg-base)" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {st === "ALL" ? "All Status" : st}
                </button>
              ))}
            </div>

            {/* Posts Table */}
            <div style={{ backgroundColor: "var(--bg-surface)", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "14px 18px" }}>Post & Content</th>
                    <th style={{ padding: "14px 18px" }}>Author (Email)</th>
                    <th style={{ padding: "14px 18px" }}>Category</th>
                    <th style={{ padding: "14px 18px" }}>Interactions</th>
                    <th style={{ padding: "14px 18px" }}>Status</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {postList.length > 0 ? (
                    postList
                      .filter((p) => postFilterStatus === "ALL" || p.status === postFilterStatus)
                      .filter((p) => {
                        if (!postSearch.trim()) return true;
                        const s = postSearch.toLowerCase();
                        return (
                          p.title.toLowerCase().includes(s) ||
                          p.content.toLowerCase().includes(s) ||
                          p.author.username.toLowerCase().includes(s) ||
                          p.author.email.toLowerCase().includes(s)
                        );
                      })
                      .map((post) => {
                        const isPublished = post.status === "PUBLISHED";
                        return (
                          <tr key={post.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "16px 18px", maxWidth: "340px" }}>
                              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                                {post.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--text-secondary)",
                                  marginTop: "4px",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  lineHeight: 1.4,
                                }}
                              >
                                {post.content}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                Dibuat: {new Date(post.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            </td>

                            <td style={{ padding: "16px 18px" }}>
                              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {post.author.username}
                                {post.author.role === "ADMIN" && (
                                  <span style={{ marginLeft: "6px", fontSize: "0.68rem", backgroundColor: "var(--accent-gold)", color: "#fff", padding: "1px 6px", borderRadius: "4px" }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {post.author.email}
                              </div>
                            </td>

                            <td style={{ padding: "16px 18px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                                {post.category}
                              </span>
                            </td>

                            <td style={{ padding: "16px 18px" }}>
                              <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>
                                Likes: {post._count?.likes ?? post.likesCount ?? 0}
                              </div>
                              <button
                                onClick={() => setInspectingPost(post)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  marginTop: "4px",
                                  fontSize: "0.78rem",
                                  color: "var(--accent-gold)",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                {post._count?.comments ?? post.comments?.length ?? 0} Comments
                              </button>
                            </td>

                            <td style={{ padding: "16px 18px" }}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  backgroundColor:
                                    post.status === "PUBLISHED"
                                      ? "rgba(16, 185, 129, 0.12)"
                                      : post.status === "HIDDEN"
                                      ? "rgba(245, 158, 11, 0.12)"
                                      : "rgba(239, 68, 68, 0.12)",
                                  color:
                                    post.status === "PUBLISHED"
                                      ? "#059669"
                                      : post.status === "HIDDEN"
                                      ? "#d97706"
                                      : "#dc2626",
                                  border: "1px solid currentColor",
                                }}
                              >
                                {post.status}
                              </span>
                            </td>

                            <td style={{ padding: "16px 18px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => handleTogglePostStatus(post.id, post.status)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                                  title={isPublished ? "Hide from Community" : "Publish to Community"}
                                >
                                  {isPublished ? "Hide" : "Show"}
                                </button>
                                <button
                                  onClick={() => setInspectingPost(post)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: "0.78rem", padding: "4px 10px", borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
                                >
                                  Comments
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: "var(--status-error)", fontSize: "0.78rem" }}
                                  title="Delete Post Permanently"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        {loadingPosts ? "Loading posts..." : "No posts match the current filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: HERO SECTION SETTINGS ================= */}
        {activeTab === "hero" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  Hero Carousel Settings
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                  Customize the banner slides displayed on the homepage. Drag or adjust order, trailer, and CTA.
                </p>
              </div>

              <button
                onClick={openNewHeroModal}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>+</span> Add Hero Slide
              </button>
            </div>

            {/* Hero Slides List Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {heroSlides.length > 0 ? (
                heroSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderRadius: "14px",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "var(--shadow-sm)",
                      padding: "18px 22px",
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      opacity: slide.isActive ? 1 : 0.65,
                      transition: "var(--transition-fast)",
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: "110px",
                        height: "64px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-surface-elevated)",
                        flexShrink: 0,
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <img
                        src={slide.thumbnail}
                        alt={slide.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    {/* Details */}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: "var(--bg-surface-elevated)",
                            color: "var(--accent-gold)",
                            fontWeight: 700,
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          ORDER: #{index + 1}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: slide.isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(107, 114, 128, 0.12)",
                            color: slide.isActive ? "#059669" : "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          {slide.isActive ? "● ACTIVE ON HOME" : "○ INACTIVE"}
                        </span>
                      </div>

                      <h4 style={{ fontSize: "1.15rem", color: "var(--text-primary)", fontWeight: 700, margin: "2px 0" }}>
                        {slide.title}
                      </h4>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: "4px 0", maxWidth: "600px" }}>
                        {slide.subtitle || "(No synopsis)"}
                      </p>

                      <div style={{ display: "flex", gap: "14px", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                        <span>CTA: <strong>{slide.ctaPrimaryText || "Watch Now"}</strong> ({slide.ctaPrimaryLink || "/browse"})</span>
                        {slide.trailerUrl && <span>Trailer Active</span>}
                      </div>
                    </div>

                    {/* Controls / Actions */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Order Controls */}
                      <button
                        onClick={() => handleMoveHeroSlide(slide.id, "up")}
                        disabled={index === 0}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "6px 10px" }}
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveHeroSlide(slide.id, "down")}
                        disabled={index === heroSlides.length - 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "6px 10px" }}
                        title="Move Down"
                      >
                        ↓
                      </button>

                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleHeroActive(slide.id, slide.isActive)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.78rem" }}
                      >
                        {slide.isActive ? "Deactivate" : "Activate"}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditHeroModal(slide)}
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)", fontSize: "0.78rem" }}
                      >
                        Edit Slide
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteHeroSlide(slide.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--status-error)", fontSize: "0.78rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--bg-surface)", borderRadius: "14px" }}>
                  <p style={{ color: "var(--text-muted)" }}>No custom hero slides yet. Click the button above to add a slide.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: CONTENT CATALOG & CHAPTERS ================= */}
        {activeTab === "content" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  Film Production Catalog & Chapters ({contentList.length})
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
                  Manage films and chapters. Upload videos with encrypted anti-download streaming.
                </p>
              </div>
              <button onClick={() => setIsUploadVideoModalOpen(true)} className="btn btn-primary" id="admin-add-content-btn">
                + Upload Video / New Title
              </button>
            </div>

            <div style={{ backgroundColor: "var(--bg-surface)", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "14px 18px" }}>Film Production</th>
                    <th style={{ padding: "14px 18px" }}>Category</th>
                    <th style={{ padding: "14px 18px" }}>Access</th>
                    <th style={{ padding: "14px 18px" }}>Status</th>
                    <th style={{ padding: "14px 18px" }}>Featured</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            style={{ width: "64px", height: "42px", objectFit: "cover", borderRadius: "6px" }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/content/{item.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 18px", color: "var(--text-secondary)" }}>{item.category}</td>
                      <td style={{ padding: "16px 18px" }}>
                        <span className={`badge badge-${item.accessLevel.toLowerCase()}`}>
                          {item.accessLevel}
                        </span>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <button
                          onClick={() => togglePublishContent(item.id, item.published)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: item.published ? "rgba(16, 185, 129, 0.12)" : "rgba(0, 0, 0, 0.05)",
                            color: item.published ? "#059669" : "var(--text-muted)",
                            border: "1px solid var(--border-subtle)",
                            cursor: "pointer",
                          }}
                        >
                          {item.published ? "● PUBLISHED" : "○ HIDDEN"}
                        </button>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <button
                          onClick={() => toggleFeatureContent(item.id, item.featured)}
                          style={{
                            color: item.featured ? "var(--accent-gold)" : "var(--text-muted)",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                          }}
                        >
                          {item.featured ? "Featured" : "-"}
                        </button>
                      </td>
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => {
                              setManagingContentForChapters(item);
                              setIsManageChaptersModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
                            title="Manage all chapters for this film"
                          >
                            Manage Chapters
                          </button>
                          <button
                            onClick={() => {
                              setEditingContentItem(item);
                              setIsEditContentModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            title="Edit film info and metadata"
                          >
                            Edit
                          </button>
                          <Link href={`/content/${item.slug}`} className="btn btn-ghost btn-sm" style={{ color: "var(--accent-gold)", fontSize: "0.75rem", padding: "4px 8px" }}>
                            View
                          </Link>
                          <button
                            onClick={() => deleteContent(item.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--status-error)", fontSize: "0.75rem", padding: "4px 8px" }}
                            title="Delete film and all its chapters"
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: MANAGE USERS & ADMIN WHITELIST ================= */}
        {activeTab === "users" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>
                User Management & Access Control
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Manage member roles, active subscriptions, suspensions, and the dedicated admin whitelist.
              </p>
            </div>


            {adminActionMessage && (
              <div
                style={{
                  padding: "12px 18px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "10px",
                  color: "#065f46",
                  fontSize: "0.88rem",
                  marginBottom: "20px",
                  fontWeight: 600,
                }}
              >
                {adminActionMessage}
              </div>
            )}

            {/* Form: Add / Update Administrator Account */}
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "16px",
                border: "1px solid var(--border-medium)",
                padding: "24px 28px",
                marginBottom: "28px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "6px" }}>
                  Add / Update Administrator Account
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Create a new admin account or update your admin password directly in the database.
                </p>
              </div>

              <form onSubmit={handleAdminFormSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@yorumuse.com"
                    value={adminFormEmail}
                    onChange={(e) => setAdminFormEmail(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    Username (Admin Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Admin Name"
                    value={adminFormUsername}
                    onChange={(e) => setAdminFormUsername(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    New Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={adminFormPassword}
                    onChange={(e) => setAdminFormPassword(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={adminFormLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", height: "42px", fontWeight: 600 }}
                  >
                    {adminFormLoading ? "Saving..." : "Save Admin Account"}
                  </button>
                </div>
              </form>
            </div>

            {/* Dedicated Whitelist Card */}
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                borderRadius: "16px",
                border: "2px solid var(--accent-gold)",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  Official Registered Admin Emails ({adminUsers.length})
                </h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Only accounts with the email addresses below can access <code>/admin</code> and manage platform features:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {adminUsers.map((adm) => (
                  <div
                    key={adm.id}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "10px",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                        {adm.username}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--accent-gold)", fontWeight: 600 }}>
                        {adm.email}
                      </div>
                    </div>

                    {adm.id !== currentUser?.id ? (
                      <button
                        onClick={() => handleDemoteAdmin(adm.id, adm.email)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--status-error)", fontSize: "0.75rem" }}
                        title="Revoke administrator access"
                      >
                        Revoke Admin
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
                        (Your Account)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* All Users Directory Table */}
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "16px" }}>
              All Platform Users ({userList.length})
            </h3>
            <div style={{ backgroundColor: "var(--bg-surface)", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "14px 18px" }}>Patron / User</th>
                    <th style={{ padding: "14px 18px" }}>Role</th>
                    <th style={{ padding: "14px 18px" }}>Status</th>
                    <th style={{ padding: "14px 18px" }}>Tanggal Lahir</th>
                    <th style={{ padding: "14px 18px" }}>Subscription</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Manage Access</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((usr) => {
                    const sub = usr.subscriptions?.[0];
                    const isAdmin = usr.role === "ADMIN";
                    return (
                      <tr key={usr.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "16px 18px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {usr.username}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{usr.email}</div>
                        </td>

                        <td style={{ padding: "16px 18px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              backgroundColor: isAdmin ? "rgba(166, 124, 30, 0.15)" : "rgba(0, 0, 0, 0.05)",
                              color: isAdmin ? "var(--accent-gold)" : "var(--text-secondary)",
                              border: isAdmin ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                            }}
                          >
                            {usr.role}
                          </span>
                        </td>

                        <td style={{ padding: "16px 18px" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color:
                                usr.status === "ACTIVE"
                                  ? "var(--status-success)"
                                  : usr.status === "SUSPENDED"
                                  ? "var(--status-warning)"
                                  : "var(--status-error)",
                            }}
                          >
                            ● {usr.status}
                          </span>
                        </td>

                        <td style={{ padding: "16px 18px", color: "var(--text-secondary)" }}>{usr.birthDate}</td>

                        <td style={{ padding: "16px 18px" }}>
                          <span className={`badge ${sub?.status === "ACTIVE" ? "badge-member" : "badge-public"}`}>
                            {sub?.planId === "vip_premium" ? "VIP" : sub?.status === "ACTIVE" ? "MEMBER" : "FREE"}
                          </span>
                        </td>

                        <td style={{ padding: "16px 18px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setUserToEdit(usr);
                                setIsUserCrudModalOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
                              title="Edit user details, role, or subscription"
                            >
                              Edit
                            </button>

                            {/* Role Toggle Button */}
                            {!isAdmin ? (
                              <button
                                onClick={() => handlePromoteToAdmin(usr.id, usr.email)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                                title="Make Admin Account"
                              >
                                +Admin
                              </button>
                            ) : (
                              usr.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDemoteAdmin(usr.id, usr.email)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "4px 6px" }}
                                >
                                  -Admin
                                </button>
                              )
                            )}

                            {/* Status controls */}
                            {usr.role !== "ADMIN" && (
                              <>
                                {usr.status === "ACTIVE" ? (
                                  <button
                                    onClick={() => handleUpdateUserStatus(usr.id, "SUSPENDED")}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: "var(--status-warning)", fontSize: "0.75rem", padding: "4px 6px" }}
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateUserStatus(usr.id, "ACTIVE")}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: "var(--status-success)", fontSize: "0.75rem", padding: "4px 6px" }}
                                  >
                                    Activate
                                  </button>
                                )}
                              </>
                            )}

                            {/* Delete User Button */}
                            {usr.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(usr.id, usr.email)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: "var(--status-error)", fontSize: "0.75rem", padding: "4px 6px" }}
                                title="Delete user permanently"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 6: MODERATION CENTER ================= */}
        {activeTab === "moderation" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Moderation Center & Report Handling
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Review member violation reports. Copyright infringement or harassment reports are prioritized.
              </p>
            </div>

            {reportList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {reportList.map((rep) => {
                  const isSevere = rep.reason === "HARASSMENT" || rep.reason === "COPYRIGHT";
                  const isResolved = rep.status === "RESOLVED" || rep.status === "DISMISSED";

                  return (
                    <div
                      key={rep.id}
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderRadius: "14px",
                        border: isSevere
                          ? "1px solid rgba(239, 68, 68, 0.45)"
                          : "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-sm)",
                        padding: "24px",
                        opacity: isResolved ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "4px",
                                backgroundColor: isSevere ? "#fef2f2" : "rgba(166, 124, 30, 0.12)",
                                color: isSevere ? "#b91c1c" : "var(--accent-gold)",
                                border: isSevere ? "1px solid #fecaca" : "1px solid var(--accent-gold)",
                              }}
                            >
                              {rep.reason.replace(/_/g, " ")}
                            </span>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              Target: {rep.targetType} ({rep.targetId})
                            </span>
                          </div>
                          <div style={{ marginTop: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            Reported by <strong>{rep.reporter?.username || "Patron"}</strong> on {new Date(rep.createdAt).toLocaleString("en-US")}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            backgroundColor: isResolved ? "rgba(0, 0, 0, 0.05)" : "rgba(245, 158, 11, 0.15)",
                            color: isResolved ? "var(--text-muted)" : "var(--status-warning)",
                          }}
                        >
                          STATUS: {rep.status}
                        </span>
                      </div>

                      {rep.details && (
                        <div
                          style={{
                            padding: "12px 16px",
                            backgroundColor: "var(--bg-surface-elevated)",
                            borderRadius: "8px",
                            fontSize: "0.88rem",
                            color: "var(--text-primary)",
                            marginBottom: "18px",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          &ldquo;{rep.details}&rdquo;
                        </div>
                      )}

                      {!isResolved ? (
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                          <button
                            onClick={() => handleModerate(rep.id, "APPROVE")}
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--status-success)" }}
                          >
                            Keep Content
                          </button>
                          <button
                            onClick={() => handleModerate(rep.id, "HIDE")}
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--status-warning)" }}
                          >
                            Hide
                          </button>
                          <button
                            onClick={() => handleModerate(rep.id, "REMOVE")}
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--status-error)" }}
                          >
                            Delete Permanently
                          </button>
                          <button
                            onClick={() => handleModerate(rep.id, "BAN_USER")}
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
                          >
                            Ban User
                          </button>
                          <button
                            onClick={() => handleModerate(rep.id, "DISMISS")}
                            className="btn btn-ghost btn-sm"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.82rem", color: "var(--status-success)" }}>
                          Report has been resolved by administrator.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--bg-surface)", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "6px" }}>Moderation queue is empty</h3>
                <p style={{ color: "var(--text-secondary)" }}>No pending violation reports.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 7: BUNNY CLOUD STORAGE ================= */}
        {activeTab === "storage" && (
          <div>
            <StorageFileManager onOpenUploadModal={() => setIsUploadVideoModalOpen(true)} />
          </div>
        )}
      </div>

      {/* ================= MODAL: POST COMMENT INSPECTION ================= */}
      {inspectingPost && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(17, 24, 39, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingPost(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              boxShadow: "var(--shadow-lg)",
              padding: "32px",
              maxHeight: "min(92vh, 760px)",
              overflowY: "auto",
              margin: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", padding: "2px 8px", backgroundColor: "var(--accent-gold)", color: "#fff", borderRadius: "4px", fontWeight: 700 }}>
                  {inspectingPost.category}
                </span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--text-primary)", marginTop: "6px" }}>
                  {inspectingPost.title}
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  By <strong>{inspectingPost.author.username}</strong> ({inspectingPost.author.email})
                </div>
              </div>
              <button onClick={() => setInspectingPost(null)} style={{ color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer", background: "none", border: "none" }}>
                Close
              </button>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-surface-elevated)",
                borderRadius: "10px",
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                marginBottom: "24px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {inspectingPost.content}
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  Member Comments ({inspectingPost.comments?.length || 0})
                </h4>
              </div>

              {inspectingPost.comments && inspectingPost.comments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {inspectingPost.comments.map((comm) => (
                    <div
                      key={comm.id}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                          {comm.author.username} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({comm.author.email})</span>
                        </div>
                        <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", marginTop: "4px", lineHeight: 1.4 }}>
                          {comm.content}
                        </p>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {new Date(comm.createdAt).toLocaleString("en-US")}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePostComment(comm.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--status-error)", fontSize: "0.75rem", flexShrink: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  No comments on this post yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT / TAMBAH SLIDE HERO ================= */}
      {isHeroModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(17, 24, 39, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHeroModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "620px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              boxShadow: "var(--shadow-lg)",
              padding: "32px",
              maxHeight: "min(92vh, 760px)",
              overflowY: "auto",
              margin: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--text-primary)" }}>
                {editingHeroId ? "Edit Hero Section Slide" : "Add New Hero Slide"}
              </h3>
              <button onClick={() => setIsHeroModalOpen(false)} style={{ color: "var(--text-muted)", fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer" }}>
                Close
              </button>
            </div>

            {/* Quick Import from Catalog Content */}
            {!editingHeroId && catalogItems.length > 0 && (
              <div style={{ marginBottom: "20px", padding: "14px", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: 700, marginBottom: "6px" }}>
                  Auto Import from Catalog Film:
                </label>
                <select
                  onChange={(e) => {
                    const item = catalogItems.find((c) => c.id === e.target.value);
                    if (item) handleQuickImportCatalogToHero(item);
                  }}
                  defaultValue=""
                  style={{ width: "100%", fontSize: "0.85rem" }}
                >
                  <option value="" disabled>-- Select a catalog film to auto-fill --</option>
                  {catalogItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSaveHeroSlide} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                  Main Slide Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shadows in Champagne"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                  Synopsis / Banner Subtitle
                </label>
                <textarea
                  rows={3}
                  placeholder="Story description or cinematic tagline..."
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exclusive Premiere, Staff Pick"
                    value={heroBadge}
                    onChange={(e) => setHeroBadge(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    Genre Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manhwa, Romance, Fantasy"
                    value={heroCategory}
                    onChange={(e) => setHeroCategory(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Backdrop Image / Poster *
                  </label>
                  <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setHeroThumbUploadMode("upload")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: heroThumbUploadMode === "upload" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: heroThumbUploadMode === "upload" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroThumbUploadMode("url")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: heroThumbUploadMode === "url" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: heroThumbUploadMode === "url" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      Link URL
                    </button>
                  </div>
                </div>

                {heroThumbUploadMode === "upload" ? (
                  <label
                    htmlFor="hero-thumb-file-input"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      border: "2px dashed var(--border-medium)",
                      borderRadius: "12px",
                      backgroundColor: "var(--bg-surface-elevated)",
                      cursor: heroThumbUploading ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroThumbUpload}
                      disabled={heroThumbUploading}
                      style={{ display: "none" }}
                      id="hero-thumb-file-input"
                    />
                    {heroThumbnail && (
                      <img
                        src={heroThumbnail}
                        alt="Preview"
                        style={{ width: "64px", height: "42px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {heroThumbUploading
                          ? "Uploading image..."
                          : heroThumbFileName
                          ? heroThumbFileName
                          : "Click to upload poster/backdrop image"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Formats: JPG, PNG, WebP (Max. 15MB)
                      </div>
                    </div>
                  </label>
                ) : (
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={heroThumbnail}
                    onChange={(e) => setHeroThumbnail(e.target.value)}
                    style={{ width: "100%" }}
                  />
                )}

                {heroThumbnail && (
                  <div style={{ marginTop: "6px", width: "100%", height: "90px", borderRadius: "8px", overflow: "hidden" }}>
                    <img src={heroThumbnail} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                  Trailer Video URL (For Watch Trailer button)
                </label>
                <input
                  type="url"
                  placeholder="https://commondatastorage.googleapis.com/...mp4"
                  value={heroTrailerUrl}
                  onChange={(e) => setHeroTrailerUrl(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={heroCtaPrimaryText}
                    onChange={(e) => setHeroCtaPrimaryText(e.target.value)}
                    placeholder="Watch Now"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                    Primary CTA Button Link
                  </label>
                  <input
                    type="text"
                    value={heroCtaPrimaryLink}
                    onChange={(e) => setHeroCtaPrimaryLink(e.target.value)}
                    placeholder="/content/shadows-in-champagne"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                <input
                  type="checkbox"
                  id="hero-is-active"
                  checked={heroIsActive}
                  onChange={(e) => setHeroIsActive(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent-gold)" }}
                />
                <label htmlFor="hero-is-active" style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  Enable in Hero Homepage Carousel
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  type="submit"
                  disabled={savingHero}
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                >
                  {savingHero ? "Saving..." : editingHeroId ? "Save Slide Changes" : "Add to Hero Section"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsHeroModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FILM PRODUCTION ================= */}
      {isAddContentOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(17, 24, 39, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddContentOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              boxShadow: "var(--shadow-lg)",
              padding: "36px",
              maxHeight: "min(92vh, 760px)",
              overflowY: "auto",
              margin: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
                Add New Film Production
              </h3>
              <button onClick={() => setIsAddContentOpen(false)} style={{ color: "var(--text-muted)", fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer" }}>
                Close
              </button>
            </div>

            {uploadError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  fontWeight: 500,
                }}
              >
                {uploadError}
              </div>
            )}

            <form onSubmit={handleCreateContent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Film Title / Series
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nocturne in Venice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%" }}
                  id="new-film-title"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Description / Synopsis
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Cinematic story synopsis..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                  id="new-film-desc"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-gold)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                    >
                      {isCustomCategory ? "Select from List" : "+ New Category"}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="New category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="Manhwa">Manhwa</option>
                      <option value="Midnight Noir">Midnight Noir</option>
                      <option value="Velvet Sessions">Velvet Sessions</option>
                      <option value="Elegance & Silk">Elegance & Silk</option>
                      <option value="Tokyo Nocturne">Tokyo Nocturne</option>
                      <option value="Romance & Passion">Romance & Passion</option>
                      <option value="Sensual Aesthetics">Sensual Aesthetics</option>
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                    Access Level
                  </label>
                  <select
                    value={newAccess}
                    onChange={(e) => setNewAccess(e.target.value)}
                    style={{ width: "100%", fontWeight: 600 }}
                  >
                    <option value="PUBLIC">PUBLIC (Free for All Visitors)</option>
                    <option value="MEMBER">MEMBER (Patron Velvet Club)</option>
                    <option value="PREMIUM">PREMIUM (VIP Sovereign)</option>
                  </select>
                </div>
              </div>

              {/* Initial Chapter Information */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--accent-gold)" }}>
                    First Chapter Details (Pilot Episode)
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Chapter No.
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newChapterNum}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setNewChapterNum(val);
                        if (!newChapterTitle || newChapterTitle.startsWith("Chapter ")) {
                          setNewChapterTitle(`Chapter ${val}: ${newTitle || "The Encounter"}`);
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chapter 1: The Encounter"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Video Production File Uploader */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Production Video File
                  </label>
                  <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setVideoUploadMode("upload")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: videoUploadMode === "upload" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: videoUploadMode === "upload" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoUploadMode("url")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: videoUploadMode === "url" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: videoUploadMode === "url" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      URL Link
                    </button>
                  </div>
                </div>

                {videoUploadMode === "upload" ? (
                  <div>
                    <label
                      htmlFor="video-file-input"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px 16px",
                        border: "2px dashed var(--border-medium)",
                        borderRadius: "12px",
                        backgroundColor: "var(--bg-surface-elevated)",
                        cursor: videoUploading ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        onChange={handleVideoUpload}
                        disabled={videoUploading}
                        style={{ display: "none" }}
                        id="video-file-input"
                      />
                      
                      <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {videoUploading ? "Uploading Video to Protected Server..." : "Select Video File to Upload"}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Formats: MP4, WebM (Max. 250MB) • Encrypted Stream Protection
                      </span>
                    </label>

                    {newTrailer && !videoUploading && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "10px 14px",
                          backgroundColor: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          color: "#065f46",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          Video ready: <strong>{videoFileName || "Uploaded Video"}</strong>
                        </div>
                        <span style={{ fontSize: "0.68rem", backgroundColor: "#d1fae5", padding: "3px 8px", borderRadius: "4px", fontWeight: 800 }}>
                          PROTECTED STREAM
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://commondatastorage.googleapis.com/...mp4"
                    value={newTrailer}
                    onChange={(e) => setNewTrailer(e.target.value)}
                    style={{ width: "100%" }}
                    required
                  />
                )}
              </div>

              {/* Poster Thumbnail */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Film Poster / Thumbnail
                  </label>
                  <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setThumbUploadMode("upload")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: thumbUploadMode === "upload" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: thumbUploadMode === "upload" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbUploadMode("url")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: thumbUploadMode === "url" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: thumbUploadMode === "url" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      URL Link
                    </button>
                  </div>
                </div>

                {thumbUploadMode === "upload" ? (
                  <label
                    htmlFor="thumb-file-input"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      border: "2px dashed var(--border-medium)",
                      borderRadius: "12px",
                      backgroundColor: "var(--bg-surface-elevated)",
                      cursor: thumbUploading ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbUpload}
                      disabled={thumbUploading}
                      style={{ display: "none" }}
                      id="thumb-file-input"
                    />
                    {newThumb && (
                      <img
                        src={newThumb}
                        alt="Preview"
                        style={{ width: "64px", height: "42px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {thumbUploading ? "Uploading Poster..." : newThumb ? `${thumbFileName || "Poster Attached"}` : "Select Film Poster Image"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        JPG, PNG, WebP (16:9 ratio recommended)
                      </div>
                    </div>
                  </label>
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newThumb}
                    onChange={(e) => setNewThumb(e.target.value)}
                    style={{ width: "100%" }}
                    required
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
                <button
                  type="submit"
                  disabled={creatingContent}
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                >
                  {creatingContent ? "Creating..." : "Save & Publish Film"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddContentOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CHAPTER TO EXISTING FILM ================= */}
      {isAddChapterModalOpen && selectedProduction && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(17, 24, 39, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddChapterModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              boxShadow: "var(--shadow-lg)",
              padding: "32px",
              maxHeight: "min(92vh, 760px)",
              overflowY: "auto",
              margin: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase" }}>
                  {selectedProduction.category}
                </span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--text-primary)", marginTop: "2px" }}>
                  Add Chapter: {selectedProduction.title}
                </h3>
              </div>
              <button
                onClick={() => setIsAddChapterModalOpen(false)}
                style={{ color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer", background: "none", border: "none" }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateChapter} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Chapter No.
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={extraChapterNum}
                    onChange={(e) => setExtraChapterNum(parseInt(e.target.value) || 1)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 2: Midnight Reverie"
                    value={extraChapterTitle}
                    onChange={(e) => setExtraChapterTitle(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Chapter Synopsis (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief synopsis for this chapter..."
                  value={extraChapterDesc}
                  onChange={(e) => setExtraChapterDesc(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              {/* Video Production File Uploader for Chapter */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Chapter Video File
                  </label>
                  <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setExtraChapterUploadMode("upload")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: extraChapterUploadMode === "upload" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: extraChapterUploadMode === "upload" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtraChapterUploadMode("url")}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor: extraChapterUploadMode === "url" ? "var(--accent-gold)" : "var(--bg-surface-elevated)",
                        color: extraChapterUploadMode === "url" ? "#ffffff" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      URL Link
                    </button>
                  </div>
                </div>

                {extraChapterUploadMode === "upload" ? (
                  <div>
                    <label
                      htmlFor="chapter-video-input"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px 16px",
                        border: "2px dashed var(--border-medium)",
                        borderRadius: "12px",
                        backgroundColor: "var(--bg-surface-elevated)",
                        cursor: extraChapterUploading ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        onChange={handleExtraChapterVideoUpload}
                        disabled={extraChapterUploading}
                        style={{ display: "none" }}
                        id="chapter-video-input"
                      />
                      
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {extraChapterUploading ? "Uploading Chapter Video..." : "Select Chapter Video File"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Formats: MP4, WebM (Max. 250MB) • Anti-Theft Protected Stream
                      </span>
                    </label>

                    {extraChapterVideo && !extraChapterUploading && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "10px 14px",
                          backgroundColor: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          color: "#065f46",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          Video Chapter: <strong>{extraChapterFileName || "Uploaded"}</strong>
                        </div>
                        <span style={{ fontSize: "0.68rem", backgroundColor: "#d1fae5", padding: "3px 8px", borderRadius: "4px", fontWeight: 800 }}>
                          PROTECTED STREAM
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://commondatastorage.googleapis.com/...mp4"
                    value={extraChapterVideo}
                    onChange={(e) => setExtraChapterVideo(e.target.value)}
                    style={{ width: "100%" }}
                    required
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
                <button
                  type="submit"
                  disabled={savingChapter || !extraChapterVideo}
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                >
                  {savingChapter ? "Saving..." : `Save Chapter ${extraChapterNum}`}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddChapterModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD VIDEO & ADD NEW TITLE (ALL-IN-ONE) ================= */}
      <UploadVideoContentModal
        isOpen={isUploadVideoModalOpen}
        onClose={() => setIsUploadVideoModalOpen(false)}
        onSuccess={(newContent) => {
          setContentList((prev) => [newContent, ...prev]);
          if (stats) setStats({ ...stats, contentCount: stats.contentCount + 1 });
        }}
      />

      {/* ================= MODAL: EDIT FILM / SERIES (SUPER USER) ================= */}
      <EditContentModal
        isOpen={isEditContentModalOpen}
        onClose={() => {
          setIsEditContentModalOpen(false);
          setEditingContentItem(null);
        }}
        contentItem={editingContentItem}
        onSuccess={(updated) => {
          setContentList((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
          alert(`Series "${updated.title}" updated successfully!`);
        }}
      />

      {/* ================= MODAL: MANAGE SERIES CHAPTERS ================= */}
      <ManageChaptersModal
        isOpen={isManageChaptersModalOpen}
        onClose={() => {
          setIsManageChaptersModalOpen(false);
          setManagingContentForChapters(null);
        }}
        contentItem={managingContentForChapters}
      />

      {/* ================= MODAL: USER CRUD (ADD & EDIT USER) ================= */}
      <UserCrudModal
        isOpen={isUserCrudModalOpen}
        onClose={() => {
          setIsUserCrudModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
        onSuccess={async () => {
          alert(userToEdit ? "User updated successfully!" : "New user created successfully!");
          await loadAllAdminData();
        }}
      />
    </div>
  );
}

