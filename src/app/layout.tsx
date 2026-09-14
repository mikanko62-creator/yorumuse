import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AgeGate from "@/components/common/AgeGate";

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
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
  title: "YORUMUSE | Premium Cinema & Serial Streaming Platform",
  description: "Curated cinematic streaming platform, serialized original films, and private creator community designed for discerning audiences.",
  keywords: ["YoruMuse", "streaming platform", "cinema series", "cinematic originals", "exclusive membership", "film series", "curated cinema"],
  authors: [{ name: "YoruMuse Inc." }],
  openGraph: {
    title: "YORUMUSE | Premium Cinema & Serial Streaming Platform",
    description: "Curated cinematic streaming platform, serialized original films, and private creator community designed for discerning audiences.",
    url: "https://yorumuse.com",
    siteName: "YoruMuse",
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable}`}>
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
