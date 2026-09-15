"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "avatarone:custom-avatars";
function readAvatars() { try { const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function saveAvatar(avatar) { const current = readAvatars(); window.localStorage.setItem(STORAGE_KEY, JSON.stringify([avatar, ...current.filter((item) => item.slug !== avatar.slug)].slice(0, 20))); window.dispatchEvent(new Event("avatarone:avatars-changed")); }

export function AvatarCreator() {
  const [prompt, setPrompt] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [created, setCreated] = useState(null);
  async function createAvatar(event) {
    event.preventDefault(); const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 15) { setError("Descrivi l’avatar con almeno 15 caratteri."); return; }
    setLoading(true); setError(""); setCreated(null);
    try { const response = await fetch("/api/avatar-creator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: cleanPrompt }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Creazione non riuscita."); saveAvatar(data.avatar); setCreated(data.avatar); setPrompt(""); }
    catch (creationError) { setError(creationError.message); } finally { setLoading(false); }
  }
  return <><form className="platform-creator-card" onSubmit={createAvatar}><label htmlFor="creatorPrompt">Descrivi cosa vuoi creare</label><textarea id="creatorPrompt" onChange={(event) => setPrompt(event.target.value)} placeholder="Esempio: crea Sofia, assistente per un hotel di lusso. Deve essere elegante, cordiale e aiutare gli ospiti con servizi e prenotazioni." value={prompt} /><button disabled={loading} type="submit">{loading ? "Sto creando…" : "✨ Crea con AI"}</button></form>{error ? <p className="creator-message creator-message--error">{error}</p> : null}{created ? <div className="creator-result"><div><span>✓ Avatar creato</span><strong>{created.name}</strong><small>{created.companyName}</small></div><a href={`/avatar/${created.slug}`} target="_blank">Apri e prova {created.name} ↗</a></div> : null}</>;
}

export function CreatedAvatarCards() {
  const [avatars, setAvatars] = useState([]);
  useEffect(() => { const refresh = () => setAvatars(readAvatars()); refresh(); window.addEventListener("avatarone:avatars-changed", refresh); window.addEventListener("storage", refresh); return () => { window.removeEventListener("avatarone:avatars-changed", refresh); window.removeEventListener("storage", refresh); }; }, []);
  return avatars.map((avatar) => <article className="platform-client-card" key={avatar.slug}><div className="platform-client-head"><div className="platform-client-avatar">✨</div><mark>Test</mark></div><div className="platform-client-title"><span>AI</span><div><h3>{avatar.name}</h3><p>{avatar.companyName}</p></div></div><div className="platform-client-meta"><span>{avatar.category}</span><span>Voce OpenAI</span></div><div className="platform-client-launch"><span>Creator Beta</span><strong>Pronto</strong></div><div className="platform-client-actions"><a className="platform-open-button" href={`/avatar/${avatar.slug}`} target="_blank">Apri e prova {avatar.name} <span>↗</span></a><span className="platform-local-label">Salvato su questo dispositivo</span></div></article>);
}
