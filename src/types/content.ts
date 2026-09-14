export type AccessLevel = "PUBLIC" | "MEMBER" | "PREMIUM";

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  trailer: string;
  videoUrl?: string;
  category: string;
  accessLevel: AccessLevel;
  featured: boolean;
  published: boolean;
  duration?: string;
  views?: number;
  likes?: number;
  releaseYear?: number;
  tags?: string[];
  createdAt: string;
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  count: number;
}
