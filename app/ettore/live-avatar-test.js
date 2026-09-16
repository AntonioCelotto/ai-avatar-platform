"use client";

import { useState } from "react";

export default function LiveAvatarTest() {
  const [embedUrl, setEmbedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionMode, setSessionMode] = useState("");

  async function start() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/liveavatar/embed", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sessione non disponibile.");
      setSessionMode(data.mode || "sandbox");
      setEmbedUrl(data.url);
    } catch (startError) { setError(startError.message); }
    finally { setLoading(false); }
  }

  if (embedUrl) return <div className="liveavatar-session"><iframe className="liveavatar-frame" src={embedUrl} allow="microphone; camera; autoplay" title={sessionMode === "ettore" ? "Ettore LiveAvatar" : "LiveAvatar Sandbox"} /><span className="liveavatar-mode">{sessionMode === "ettore" ? "Ettore Live" : "Modalità test LiveAvatar"}</span></div>;

  return <div className="liveavatar-cover">
    <img className="custom-avatar-image" alt="Avatar Ettore" src="/generated/ettore-avatar.svg" />
    <div className="mia-name-mark" aria-hidden="true"><span>ETTORE</span></div>
    <div className="liveavatar-start"><strong>Parla con Ettore</strong><span>Avvia la conversazione vocale con movimento e labiale sincronizzato.</span><button disabled={loading} onClick={start} type="button">{loading ? "Collegamento…" : "Avvia conversazione"}</button>{error ? <small>{error}</small> : null}</div>
  </div>;
}
