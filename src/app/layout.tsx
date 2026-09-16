import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AgeGate from "@/components/common/AgeGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f8f9fa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "YORUMUSE | Premium Manhwa & Cinema Series Streaming Platform",
  description: "Curated streaming platform for serialized manhwa adaptations, cinematic releases, and private creator community.",
  keywords: ["YoruMuse", "manhwa", "manhwa adaptation", "streaming platform", "cinema series", "exclusive membership", "serialized manhwa", "curated cinema"],
  authors: [{ name: "YoruMuse Inc." }],
  openGraph: {
    title: "YORUMUSE | Premium Manhwa & Cinema Series Streaming Platform",
    description: "Curated streaming platform for serialized manhwa adaptations, cinematic releases, and private creator community.",
    url: "https://yorumuse.com",
    siteName: "YoruMuse",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/logo.png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Global Navigation Header */}
        <Header />

        {/* 18+ Age Verification Modal */}
        <AgeGate />

        {/* Main Content Area */}
        <main style={{ flex: "1 0 auto", position: "relative", zIndex: 1 }}>
          {children}
        </main>

        {/* Global Luxury Footer */}
        <Footer />
      </body>
    </html>
  );
}
