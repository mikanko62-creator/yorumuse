"use client";

import React, { useRef, useState } from "react";

interface PlayerProps {
  videoUrl: string;
  poster: string;
  title: string;
}

export default function ContentPlayerClient({ videoUrl, poster, title }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [showControls, setShowControls] = useState(true);

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setProgress((cur / dur) * 100);
      setCurrentTime(formatTime(cur));
      setDuration(formatTime(dur));
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
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
        poster={poster}
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "auto",
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
          top: "18px",
          right: "20px",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "5px 12px",
          borderRadius: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(166, 124, 30, 0.35)",
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          pointerEvents: "none",
          userSelect: "none",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
      >
        
        <span>YORUMUSE • ENCRYPTED STREAM</span>
      </div>

      {/* Play Overlay when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Start streaming"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e5c158 0%, #d4af37 100%)",
            color: "#08080a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.4)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        </button>
      )}

      {/* Controls Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 4,
          background: "linear-gradient(0deg, rgba(5, 5, 7, 0.95) 0%, rgba(5, 5, 7, 0.6) 60%, transparent 100%)",
          padding: "32px 24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          transition: "opacity 0.3s ease",
          opacity: showControls || !isPlaying ? 1 : 0,
          pointerEvents: showControls || !isPlaying ? "auto" : "none",
        }}
      >
        {/* Scrubber */}
        <div
          onClick={handleSeek}
          style={{
            width: "100%",
            height: "6px",
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
              boxShadow: "0 0 10px var(--accent-gold)",
            }}
          />
        </div>

        {/* Row Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
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
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (videoRef.current) {
                    videoRef.current.volume = val;
                    videoRef.current.muted = val === 0;
                  }
                  setIsMuted(val === 0);
                }}
                style={{
                  width: "80px",
                  height: "4px",
                  accentColor: "var(--accent-gold)",
                  cursor: "pointer",
                }}
              />
            </div>

            <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.9)" }}>
              {currentTime} / {duration}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-gold)",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              4K MASTER
            </span>

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
  );
}
