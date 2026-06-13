"use client";

import { useEffect, useRef } from "react";

const mediaStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 8%",
  filter: "saturate(1.03) contrast(1.02)",
  background: "#050505"
};

export function AvatarVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = () => {
      video.muted = true;
      video.play().catch(() => {});
    };

    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);
    playVideo();

    return () => {
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplay", playVideo);
      video.pause();
    };
  }, []);

  return (
    <video
      aria-label="Avatar video Mia"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      ref={videoRef}
      src="/api/avatar-video"
      style={mediaStyle}
    />
  );
}
