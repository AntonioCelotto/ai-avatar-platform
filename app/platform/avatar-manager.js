"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AvatarManager({ client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaNotice, setMediaNotice] = useState("");
  const [posterUrl, setPosterUrl] = useState(client.avatar_poster_url || "");
  const [videoUrl, setVideoUrl] = useState(client.avatar_video_url || "");
  async function uploadMedia(file, kind) {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setError("File troppo grande: massimo 30 MB."); return; }
    setMediaUploading(true); setError(""); setMediaNotice("");
    try {
      const prep = await fetch("/api/avatar-creator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_media_upload", slug: client.slug, kind, fileName: file.name, fileType: file.type }) });
      const data = await prep.json();
      if (!prep.ok || !data.upload?.signedUrl) throw new Error(data.error || "Preparazione upload non riuscita.");
      const sent = await fetch(data.upload.signedUrl, { method: "PUT", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: file });
      if (!sent.ok) throw new Error("Caricamento file non riuscito.");
      const url = data.upload.publicUrl || data.upload.url;
      if (!url) throw new Error("URL del file non disponibile.");
      const changes = kind === "image" ? { avatarPosterUrl: url } : { avatarVideoUrl: url, mediaMode: "video" };
      const saved = await fetch("/api/avatar-clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: client.slug, ...changes }) });
      const result = await saved.json();
      if (!saved.ok) throw new Error(result.error || "Il file è stato caricato ma non associato all’avatar.");
      if (kind === "image") setPosterUrl(url); else { setVideoUrl(url); update("mediaMode", "video"); }
      setMediaNotice(`${kind === "image" ? "Fotografia" : "Video"} caricato e salvato sull’avatar. Puoi aprire il link pubblico per provarlo.`);
    } catch (e) { setError(e.message); } finally { setMediaUploading(false); }
  }
  const [form, setForm] = useState({
    name: client.spoken_avatar_name || client.avatar_name || "",
    companyName: client.company_name || "",
    category: client.category || "",
    website: client.website || "",
    whatsappPhone: client.whatsapp_phone || "",
    liveAvatarId: client.liveavatar_avatar_id || "",
    mediaMode: client.media_mode || (client.avatar_video_url ? "video" : client.avatar_poster_url ? "image" : "placeholder"),
    voiceProvider: client.voice_provider || "openai",
    voiceId: client.voice_id || "",
    voiceLabel: client.voice_label || "",
    status: client.status || "active"
  });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function save(event) {
    event.preventDefault(); setWorking(true); setError("");
    try {
      if (form.mediaMode === "video" && !videoUrl) throw new Error("Hai scelto Video parlante, ma manca il file MP4. Caricalo prima di salvare.");
      const response = await fetch("/api/avatar-clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: client.slug, ...form, avatarPosterUrl: posterUrl, avatarVideoUrl: videoUrl }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Salvataggio non riuscito.");
      setOpen(false); router.refresh();
    } catch (saveError) { setError(saveError.message); }
    finally { setWorking(false); }
  }

  async function remove() {
    if (!window.confirm(`Eliminare definitivamente ${form.name}? Verranno rimosse anche le sue conoscenze.`)) return;
    setWorking(true); setError("");
    try {
      const response = await fetch("/api/avatar-clients", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: client.slug }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Eliminazione non riuscita.");
      router.refresh();
    } catch (removeError) { setError(removeError.message); setWorking(false); }
  }

  return <div className="avatar-manager"><button className="platform-manage-link" onClick={() => setOpen((value) => !value)} type="button">{open ? "Chiudi gestione" : "Gestisci AI"}</button>{open ? <form className="avatar-manager-form" onSubmit={save}>
    <label>Nome<input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
    <label>Azienda<input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} /></label>
    <label>Categoria<input value={form.category} onChange={(event) => update("category", event.target.value)} /></label>
    <label>Sito<input placeholder="https://..." value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
    <label>WhatsApp<input placeholder="393..." value={form.whatsappPhone} onChange={(event) => update("whatsappPhone", event.target.value)} /></label>
    <label>Foto avatar (sostituisci)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={mediaUploading || working} onChange={(event) => uploadMedia(event.target.files?.[0], "image")} /></label>
    <label>Video avatar MP4 (sostituisci)<input type="file" accept="video/mp4,video/webm" disabled={mediaUploading || working} onChange={(event) => uploadMedia(event.target.files?.[0], "video")} /></label>
    {mediaUploading ? <p>Caricamento e salvataggio file in corso… Attendi la conferma.</p> : null}
    {mediaNotice ? <p role="status">{mediaNotice}</p> : null}
    {videoUrl ? <p>Video MP4 associato all’avatar.</p> : <p>Video MP4 non ancora caricato.</p>}
    <label>Modalità avatar<select value={form.mediaMode} onChange={(event) => update("mediaMode", event.target.value)}><option value="image">Immagine statica</option><option value="video">Video parlante</option><option value="liveavatar">LiveAvatar sincronizzato</option><option value="placeholder">Da configurare</option></select></label>
    {form.mediaMode === "liveavatar" ? <label>ID LiveAvatar<input value={form.liveAvatarId} onChange={(event) => update("liveAvatarId", event.target.value)} /></label> : null}
    <label>Provider voce<select value={form.voiceProvider} onChange={(event) => update("voiceProvider", event.target.value)}><option value="openai">OpenAI</option><option value="elevenlabs">ElevenLabs (voce personalizzata)</option></select></label>
    {form.voiceProvider === "elevenlabs" ? <><label>Nome voce<input placeholder="Es. Fabio" value={form.voiceLabel} onChange={(event) => update("voiceLabel", event.target.value)} /></label><label>ElevenLabs Voice ID<input placeholder="ID voce ElevenLabs" value={form.voiceId} onChange={(event) => update("voiceId", event.target.value)} required /></label></> : null}
    <label>Stato<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="active">Online</option><option value="paused">In pausa</option><option value="draft">Bozza</option></select></label>
    {error ? <p className="creator-message creator-message--error">{error}</p> : null}
    <div className="avatar-manager-actions"><button disabled={working || mediaUploading} type="submit">Salva modifiche</button>{!["new-digital-app", "demo-cliente-01"].includes(client.slug) ? <button className="danger-button" disabled={working} onClick={remove} type="button">Elimina AI</button> : null}</div>
  </form> : null}</div>;
}
