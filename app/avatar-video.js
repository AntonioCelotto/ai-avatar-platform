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

    const pauseAtStart = () => {
      try {
        video.pause();
        if (Number.isFinite(video.duration)) {
          video.currentTime = 0.05;
        }
      } catch {
        // Browsers can reject currentTime changes before metadata is ready.
      }
    };

    const syncWithMiaState = () => {
      const isSpeaking =
        document.documentElement.dataset.miaAvatarState === "speaking";

      video.muted = true;

      if (isSpeaking) {
        video.play().catch(() => {});
        return;
      }

      pauseAtStart();
    };

    video.addEventListener("loadedmetadata", pauseAtStart);

    const observer = new MutationObserver(syncWithMiaState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mia-avatar-state"]
    });

    pauseAtStart();
    syncWithMiaState();

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", pauseAtStart);
      video.pause();
    };
  }, []);

  return (
    <video
      aria-label="Avatar video Mia"
      loop
      muted
      playsInline
      preload="auto"
      ref={videoRef}
      src="/mia-avatar-video.mp4"
      style={mediaStyle}
    />
  );
}
