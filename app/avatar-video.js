"use client";

import { useEffect, useRef } from "react";
import { avatarSrc } from "./avatar-data";
import { avatarVideoSrc } from "./avatar-video-data";

const mediaStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 8%",
  filter: "saturate(1.03) contrast(1.02)"
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
        // Ignore browser timing errors while metadata is loading.
      }
    };

    const syncWithMiaState = () => {
      const isSpeaking =
        document.documentElement.dataset.miaAvatarState === "speaking";

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

    syncWithMiaState();

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", pauseAtStart);
      video.pause();
    };
  }, []);

  return (
    <>
      <video
        aria-label="Avatar video Mia"
        loop
        muted
        playsInline
        preload="auto"
        poster={avatarSrc}
        ref={videoRef}
        src={avatarVideoSrc}
        style={mediaStyle}
      />
      <noscript>
        <img alt="" src={avatarSrc} style={mediaStyle} />
      </noscript>
    </>
  );
}
