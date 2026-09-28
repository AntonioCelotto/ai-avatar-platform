"use client";

import { useEffect, useMemo, useState } from "react";

const LEGACY = new Set(["new-digital-app", "demo-cliente-01"]);

export default function KnowledgeManager({ clients, initialSlug }) {
  const [slug, setSlug] = useState(initialSlug);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = clients.find((client) => client.slug === slug) || clients[0];
  const readyCount = documents.filter((item) => ["ready", "active"].includes(item.status)).length;
  const score = documents.length ? Math.round((readyCount / documents.length) * 100) : 0;
  const apiUrl = useMemo(() => LEGACY.has(slug) ? `/api/documents?tenantSlug=${encodeURIComponent(slug)}` : `/api/avatar-knowledge?client=${encodeURIComponent(slug)}`, [slug]);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(apiUrl, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossibile leggere le fonti.");
      setDocuments(data.documents || []);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [apiUrl]);

  async function uploadPdf(event) {
    event.preventDefault(); const form = event.currentTarget; const file = form.elements.knowledgeFile.files?.[0];
    if (!file) return; if (file.size > 10 * 1024 * 1024) return setError("PDF troppo grande. Limite: 10 MB.");
    setWorking(true); setError(""); setMessage("");
    try {
      const endpoint = LEGACY.has(slug) ? "/api/documents" : "/api/avatar-knowledge";
      const tenantKey = LEGACY.has(slug) ? "tenantSlug" : "clientSlug";
      const prepare = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_pdf_upload", [tenantKey]: slug, fileName: file.name, fileType: file.type, fileSize: file.size }) });
      const upload = await prepare.json(); if (!prepare.ok) throw new Error(upload.error || "Preparazione non riuscita.");
      const body = new FormData(); body.append("cacheControl", "3600"); body.append("", file);
      const sent = await fetch(upload.signedUrl, { method: "PUT", headers: { "x-upsert": "false" }, body });
      if (!sent.ok) throw new Error("Invio del PDF a Supabase non riuscito.");
      const process = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "process_pdf_upload", [tenantKey]: slug, fileName: file.name, fileType: file.type, fileSize: file.size, storagePath: upload.storagePath }) });
      const result = await process.json(); if (!process.ok) throw new Error(result.error || "Elaborazione non riuscita.");
      setMessage(`${file.name} è stato elaborato ed è disponibile per ${selected?.spoken_avatar_name || selected?.avatar_name}.`); form.reset(); await load();
    } catch (uploadError) { setError(uploadError.message); }
    finally { setWorking(false); }
  }

  async function importWebsite(event) {
    event.preventDefault(); const form = event.currentTarget; const url = form.elements.websiteUrl.value.trim(); if (!url) return;
    setWorking(true); setError(""); setMessage("");
    try {
      let response;
      if (LEGACY.has(slug)) {
        const body = new FormData(); body.append("action", "website"); body.append("tenantSlug", slug); body.append("url", url);
        response = await fetch("/api/documents", { method: "POST", body });
      } else {
        response = await fetch("/api/avatar-knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "website", clientSlug: slug, url }) });
      }
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Importazione non riuscita.");
      setMessage("Sito analizzato e collegato alla persona digitale."); form.reset(); await load();
    } catch (siteError) { setError(siteError.message); }
    finally { setWorking(false); }
  }

  async function remove(document) {
    if (!window.confirm(`Rimuovere “${document.title}” dalla conoscenza?`)) return;
    setWorking(true); setError("");
    try {
      const response = LEGACY.has(slug)
        ? await fetch("/api/documents", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantSlug: slug, sourceId: document.id }) })
        : await fetch("/api/avatar-knowledge", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientSlug: slug, documentId: document.id }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Rimozione non riuscita.");
      setMessage("Fonte rimossa."); await load();
    } catch (removeError) { setError(removeError.message); }
    finally { setWorking(false); }
  }

  return <main className="platform-shell platform-shell--single"><section className="platform-main platform-main--centered">
    <header className="platform-mobile-topbar"><a href="/platform">←</a><div><span>AvatarOne</span><strong>Knowledge</strong></div><a href="#upload">＋</a></header>
    <section className="platform-hero platform-hero--app knowledge-hero"><div><p className="platform-kicker">Knowledge Center</p><h1>Cosa sa il tuo assistente</h1><p>Un unico spazio per collegare PDF e siti a ogni persona digitale.</p></div><div className="knowledge-score"><span>Knowledge Score</span><strong>{score}%</strong></div></section>
    <section className="platform-section"><div className="platform-section-head"><div><p className="platform-kicker">Persona digitale</p><h2>{selected?.company_name || "Seleziona un cliente"}</h2></div></div><div className="knowledge-client-switcher">{clients.map((client) => <button className={client.slug === slug ? "is-active" : ""} key={client.slug} onClick={() => { setSlug(client.slug); history.replaceState(null, "", `/platform/knowledge?client=${client.slug}`); }} type="button">{client.spoken_avatar_name || client.avatar_name}<small>{client.company_name}</small></button>)}</div></section>
    <section className="platform-grid-two" id="upload"><article className="platform-section knowledge-panel"><div className="platform-section-head"><div><p className="platform-kicker">Sito Web</p><h2>Analizza sito</h2></div></div><form className="knowledge-form" onSubmit={importWebsite}><label htmlFor="websiteUrl">URL del sito</label><input id="websiteUrl" name="websiteUrl" placeholder="https://www.azienda.it" required /><button disabled={working} type="submit">{working ? "Elaborazione…" : "Analizza sito"}</button></form></article>
    <article className="platform-section knowledge-panel"><div className="platform-section-head"><div><p className="platform-kicker">Documenti</p><h2>Carica PDF</h2></div></div><form className="knowledge-form" onSubmit={uploadPdf}><label htmlFor="knowledgeFile">PDF fino a 10 MB</label><input id="knowledgeFile" name="knowledgeFile" type="file" accept="application/pdf,.pdf" required /><button disabled={working} type="submit">{working ? "Caricamento…" : "Carica e insegna"}</button></form></article></section>
    {message ? <p className="creator-message creator-message--success">{message}</p> : null}{error ? <p className="creator-message creator-message--error">{error}</p> : null}
    <section className="platform-stats platform-stats--mobile knowledge-stats"><article className="platform-card"><span>Fonti</span><strong>{documents.length}</strong><small>Totali</small></article><article className="platform-card"><span>Pronte</span><strong>{readyCount}</strong><small>Utilizzabili</small></article><article className="platform-card"><span>Stato</span><strong>{loading ? "…" : score === 100 ? "OK" : "Check"}</strong><small>Knowledge</small></article></section>
    <section className="platform-section"><div className="platform-section-head"><div><p className="platform-kicker">Fonti</p><h2>Materiale acquisito</h2></div><span className="platform-soft-label">{documents.length} fonti</span></div><div className="knowledge-list">{documents.length ? documents.map((document) => <article className="knowledge-item" key={document.id}><div><span>{document.source_type === "website" || document.file_type === "website" ? "🌐" : "📄"}</span><strong>{document.title}</strong><small>{document.source_url || document.file_url || document.file_name || document.storage_path || "Fonte interna"}</small></div><mark>🟢 Pronto</mark><button className="knowledge-remove" disabled={working} onClick={() => remove(document)} type="button">Rimuovi</button></article>) : <div className="knowledge-empty"><strong>{loading ? "Caricamento…" : "Nessuna conoscenza caricata"}</strong><p>Aggiungi un sito o un PDF per iniziare.</p></div>}</div></section>
  </section></main>;
}
