"use client";

import { useEffect, useRef, useState } from "react";

const mediaStyle = {
  width: "100%", height: "100%", display: "block", objectFit: "cover",
  objectPosition: "center top", filter: "saturate(1.03) contrast(1.02)",
  background: "#050505"
};

// Two preloaded players overlap at the end of each clip, avoiding the visible
// seek/reload jump of the native loop attribute.
function SmoothVideoLoop({ src, poster, label, active = true, style = {} }) {
  const refs = useRef([null, null]);
  const currentRef = useRef(0);
  const swappingRef = useRef(false);
  const timersRef = useRef([]);
  const [front, setFront] = useState(0);
  const [ready, setReady] = useState([false, false]);

  useEffect(() => {
    const players = refs.current;
    const timers = timersRef.current;
    currentRef.current = 0;
    swappingRef.current = false;
    setFront(0);
    setReady([false, false]);
    for (const player of players) {
      if (!player) continue;
      player.pause();
      try { player.currentTime = 0; } catch {}
      player.muted = true;
      player.playsInline = true;
    }
    if (active) players[0]?.play().catch(() => {});
    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      players.forEach(player => player?.pause());
    };
  }, [src]);

  useEffect(() => {
    const players = refs.current;
    if (active) {
      players[currentRef.current]?.play().catch(() => {});
    } else {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.length = 0;
      players.forEach(player => {
        if (!player) return;
        player.pause();
        try { player.currentTime = 0; } catch {}
      });
      currentRef.current = 0;
      swappingRef.current = false;
      setFront(0);
    }
  }, [active, src]);

  function onProgress(index) {
    if (!active || currentRef.current !== index || swappingRef.current) return;
    const player = refs.current[index];
    const next = refs.current[1 - index];
    if (!player || !next || !Number.isFinite(player.duration) || player.duration <= 1) return;
    const overlap = Math.min(0.45, player.duration * 0.08);
    if (player.duration - player.currentTime > overlap) return;
    if (next.readyState < 2) return;
    swappingRef.current = true;
    try { next.currentTime = 0; } catch {}
    const playback = next.play();
    if (playback?.catch) playback.catch(() => { swappingRef.current = false; });
    currentRef.current = 1 - index;
    setFront(1 - index);
    const timer = setTimeout(() => {
      player.pause();
      try { player.currentTime = 0; } catch {}
      swappingRef.current = false;
    }, overlap * 1000);
    timersRef.current.push(timer);
  }

  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
    {[0, 1].map(index => <video
      key={index}
      ref={element => { refs.current[index] = element; }}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      aria-label={label}
      onCanPlay={() => setReady(old => old[index] ? old : old.map((value, i) => i === index ? true : value))}
      onTimeUpdate={() => onProgress(index)}
      onEnded={() => {
        if (!active || currentRef.current !== index || swappingRef.current) return;
        const player = refs.current[index];
        if (player) { player.currentTime = 0; player.play().catch(() => {}); }
      }}
      style={{
        ...mediaStyle, position: "absolute", inset: 0,
        opacity: index === front ? 1 : 0,
        transition: "opacity 360ms linear",
        pointerEvents: "none"
      }}
    />)}
  </div>;
}

export function AvatarVideo({ label = "Avatar video Mia", poster, idleSrc = "", src = "/mia-avatar-video.mp4" }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const sync = () => setSpeaking(document.documentElement.dataset.miaAvatarState === "speaking");
    sync();
    window.addEventListener("mia-avatar-state-change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mia-avatar-state"] });
    return () => {
      observer.disconnect();
      window.removeEventListener("mia-avatar-state-change", sync);
    };
  }, []);

  return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
    {idleSrc
      ? <video src={idleSrc} poster={poster} aria-label={`${label} in attesa`} autoPlay loop muted playsInline preload="auto" style={{ ...mediaStyle, position: "absolute", inset: 0, opacity: speaking ? 0 : 1, transition: "opacity 250ms ease", pointerEvents: "none" }} />
      : poster ? <img src={poster} alt={`${label} in attesa`} style={{ ...mediaStyle, position: "absolute", inset: 0, opacity: speaking ? 0 : 1, transition: "opacity 250ms ease" }} /> : null}
    <video src={src} poster={poster} aria-label={label} autoPlay loop muted playsInline preload="auto" style={{ ...mediaStyle, position: "absolute", inset: 0, opacity: speaking ? 1 : 0, transition: "opacity 250ms ease", pointerEvents: "none" }} />
  </div>;
}
