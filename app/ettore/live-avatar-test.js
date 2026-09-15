"use client";

import { useState } from "react";

export default function LiveAvatarTest() {
  const [embedUrl, setEmbedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/liveavatar/embed", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sessione non disponibile.");
      setEmbedUrl(data.url);
    } catch (startError) { setError(startError.message); }
    finally { setLoading(false); }
  }

  if (embedUrl) return <iframe className="liveavatar-frame" src={embedUrl} allow="microphone; camera; autoplay" title="LiveAvatar Sandbox di Ettore" />;

  return <div className="liveavatar-cover">
    <img className="custom-avatar-image" alt="Avatar Ettore" src="/generated/ettore-avatar.svg" />
    <div className="mia-name-mark" aria-hidden="true"><span>ETTORE</span></div>
    <div className="liveavatar-start"><strong>LiveAvatar Sandbox</strong><span>Prova voce, ascolto e labiale in tempo reale.</span><button disabled={loading} onClick={start} type="button">{loading ? "Collegamento…" : "Avvia avatar parlante"}</button>{error ? <small>{error}</small> : null}</div>
  </div>;
}
