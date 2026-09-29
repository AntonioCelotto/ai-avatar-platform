"use client";

import { useEffect, useRef } from "react";

const mediaStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 35%",
  filter: "saturate(1.03) contrast(1.02)",
  background: "#050505"
};

export function AvatarVideo({ label = "Avatar video Mia", poster, src = "/mia-avatar-video.mp4" }) {
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

    const playWhileSpeaking = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      if (video.readyState === 0) video.load();
      if (video.ended || (Number.isFinite(video.duration) && video.currentTime >= video.duration - 0.15)) {
        video.currentTime = 0.05;
      }

      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          video.addEventListener("canplay", () => {
            if (document.documentElement.dataset.miaAvatarState === "speaking") {
              video.play().catch(() => {});
            }
          }, { once: true });
          video.load();
        });
      }
    };

    const syncWithMiaState = () => {
      const isSpeaking =
        document.documentElement.dataset.miaAvatarState === "speaking";

      video.muted = true;

      if (isSpeaking) {
        playWhileSpeaking();
        return;
      }

      pauseAtStart();
    };

    video.addEventListener("loadedmetadata", pauseAtStart);
    video.addEventListener("canplay", syncWithMiaState);
    window.addEventListener("mia-avatar-state-change", syncWithMiaState);

    const observer = new MutationObserver(syncWithMiaState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mia-avatar-state"]
    });

    pauseAtStart();
    video.load();
    syncWithMiaState();

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", pauseAtStart);
      video.removeEventListener("canplay", syncWithMiaState);
      window.removeEventListener("mia-avatar-state-change", syncWithMiaState);
      video.pause();
    };
  }, [src]);

  return (
    <video
      aria-label={label}
      loop
      muted
      playsInline
      poster={poster}
      preload="auto"
      ref={videoRef}
      src={src}
      style={mediaStyle}
    />
  );
}
