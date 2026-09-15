import React from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";

export const metadata = {
  title: "404 - Halaman Tidak Ditemukan | YoruMuse",
  description: "Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d090d] text-white flex flex-col justify-between selection:bg-[#c92a54] selection:text-white">
      {/* Header Bar */}
      <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          Beranda
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900/80 border border-white/10 mb-6 shadow-2xl">
            <span className="text-3xl font-serif text-[#c92a54]">404</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3 tracking-tight">
            Halaman Tidak Ditemukan
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Alamat yang Anda tuju tidak tersedia, telah dipindahkan, atau mungkin Anda salah mengetikkan URL.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#c92a54] hover:bg-[#a32244] text-white font-medium text-xs tracking-wider uppercase transition-colors shadow-lg"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-medium text-xs tracking-wider uppercase transition-colors"
            >
              Jelajahi Katalog
            </Link>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="px-6 py-6 border-t border-white/5 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} YoruMuse. Hak cipta dilindungi.
      </footer>
    </div>
  );
}
