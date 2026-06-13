"use client";

import { useEffect, useRef, useState } from "react";
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

const fallbackStyle = {
  ...mediaStyle,
  position: "absolute",
  inset: 0,
  zIndex: 0
};

export function AvatarVideo() {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = () => {
      video.muted = true;
      video.play().catch(() => {});
    };

    const syncWithMiaState = () => {
      const state = document.documentElement.dataset.miaAvatarState;

      if (state === "speaking" || state === "thinking" || state === "ready" || state === "idle") {
        playVideo();
      }
    };

    video.addEventListener("loadeddata", () => {
      setVideoReady(true);
      playVideo();
    });
    video.addEventListener("canplay", playVideo);

    const observer = new MutationObserver(syncWithMiaState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mia-avatar-state"]
    });

    playVideo();
    syncWithMiaState();

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <>
      {!videoReady ? <img alt="" src={avatarSrc} style={fallbackStyle} /> : null}
      <video
        aria-label="Avatar video Mia"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        ref={videoRef}
        src={avatarVideoSrc}
        style={{
          ...mediaStyle,
          position: "relative",
          zIndex: 1,
          opacity: videoReady ? 1 : 0
        }}
      />
    </>
  );
}
