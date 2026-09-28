"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AvatarManager({ client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: client.spoken_avatar_name || client.avatar_name || "",
    companyName: client.company_name || "",
    category: client.category || "",
    website: client.website || "",
    whatsappPhone: client.whatsapp_phone || "",
    liveAvatarId: client.liveavatar_avatar_id || "",
    mediaMode: client.media_mode || (client.avatar_video_url ? "video" : client.avatar_poster_url ? "image" : "placeholder"),
    status: client.status || "active"
  });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function save(event) {
    event.preventDefault(); setWorking(true); setError("");
    try {
      const response = await fetch("/api/avatar-clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: client.slug, ...form }) });
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
    <label>Modalità avatar<select value={form.mediaMode} onChange={(event) => update("mediaMode", event.target.value)}><option value="image">Immagine statica</option><option value="video">Video parlante</option><option value="liveavatar">LiveAvatar sincronizzato</option><option value="placeholder">Da configurare</option></select></label>
    {form.mediaMode === "liveavatar" ? <label>ID LiveAvatar<input value={form.liveAvatarId} onChange={(event) => update("liveAvatarId", event.target.value)} /></label> : null}
    <label>Stato<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="active">Online</option><option value="paused">In pausa</option><option value="draft">Bozza</option></select></label>
    {error ? <p className="creator-message creator-message--error">{error}</p> : null}
    <div className="avatar-manager-actions"><button disabled={working} type="submit">Salva modifiche</button>{!["new-digital-app", "demo-cliente-01"].includes(client.slug) ? <button className="danger-button" disabled={working} onClick={remove} type="button">Elimina AI</button> : null}</div>
  </form> : null}</div>;
}
