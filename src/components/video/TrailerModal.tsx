"use client";

import React, { useEffect, useRef, useState } from "react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  posterImage?: string;
  title: string;
  category?: string;
}

export default function TrailerModal({
  isOpen,
  onClose,
  videoUrl,
  posterImage,
  title,
  category,
}: TrailerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(true); // Default muted to ensure compliant autoplay
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle modal open/close video control
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen, videoUrl]);

  if (!isOpen) return null;

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 1;
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
      setDuration(formatTime(total));
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = clickPos * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      if (modalRef.current?.requestFullscreen) {
        modalRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} Trailer`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(4, 4, 6, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.25s ease-out forwards",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: "100%",
          maxWidth: "1000px",
          backgroundColor: "#0d0d12",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.9), 0 0 50px rgba(212, 175, 55, 0.12)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, #161620 0%, #0d0d12 100%)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            {category && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent-gold)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                {category} • OFFICIAL TRAILER
              </span>
            )}
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                color: "#ffffff",
                marginTop: "2px",
              }}
            >
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close trailer"
            className="btn btn-ghost"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "#ffffff",
              fontSize: "1.2rem",
            }}
          >
            Tutup
          </button>
        </div>

        {/* Video Player Container */}
        <div
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#000000",
            overflow: "hidden",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterImage}
            playsInline
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={handleTimeUpdate}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />

          {/* Anti-Theft Protection Scrim Barrier */}
          <div
            onClick={togglePlay}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              cursor: "pointer",
              userSelect: "none",
            }}
          />

          {/* Dynamic Anti-Piracy Watermark */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "16px",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(166, 124, 30, 0.35)",
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            
            <span>YORUMUSE • PROTECTED</span>
          </div>

          {/* Big Center Play Button Overlay if paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              aria-label="Play video"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(212, 175, 55, 0.9)",
                color: "#08080a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.5)",
                cursor: "pointer",
                transition: "transform 0.2s ease, background 0.2s ease",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            </button>
          )}

          {/* Mute Indicator Badge */}
          {isMuted && isPlaying && (
            <button
              onClick={toggleMute}
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                zIndex: 3,
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "var(--accent-gold)",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              <span>Muted (Klik untuk audio)</span>
            </button>
          )}

          {/* Custom Controls Bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 4,
              background: "linear-gradient(0deg, rgba(8, 8, 10, 0.95) 0%, rgba(8, 8, 10, 0.6) 60%, transparent 100%)",
              padding: "24px 20px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Scrubber Bar */}
            <div
              onClick={handleSeek}
              style={{
                width: "100%",
                height: "5px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "3px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "var(--accent-gold)",
                  borderRadius: "3px",
                  boxShadow: "0 0 8px var(--accent-gold)",
                }}
              />
            </div>

            {/* Bottom Row Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  style={{ color: "#ffffff", display: "flex", alignItems: "center" }}
                >
                  {isPlaying ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    style={{ color: "#ffffff", display: "flex", alignItems: "center" }}
                  >
                    {isMuted || volume === 0 ? "Unmute" : "Mute"}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: "70px",
                      height: "4px",
                      padding: 0,
                      cursor: "pointer",
                      accentColor: "var(--accent-gold)",
                    }}
                  />
                </div>

                <span style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.9)" }}>
                  {currentTime} / {duration}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={toggleFullscreen}
                  aria-label="Toggle Fullscreen"
                  style={{ color: "#ffffff", display: "flex", alignItems: "center" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
