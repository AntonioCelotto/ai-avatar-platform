"use client";

import { useEffect, useMemo, useState } from "react";

const fallbackTenant = {
  slug: "new-digital-app",
  name: "New Digital App",
  assistantName: "Mia.Ai",
  spokenAssistantName: "Mia",
  website: "https://www.newdigitalapp.com"
};

export function DocumentsDashboard({ tenant: tenantConfig = fallbackTenant }) {
  const tenant = { ...fallbackTenant, ...tenantConfig };
  const apiUrl = useMemo(
    () => `/api/documents?tenantSlug=${encodeURIComponent(tenant.slug)}`,
    [tenant.slug]
  );
  const [documents, setDocuments] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importingSite, setImportingSite] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [pin, setPin] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(tenant.website || "https://www.newdigitalapp.com");

  async function loadDocuments() {
    const response = await fetch(apiUrl, { cache: "no-store" });
    const data = await response.json();
    setConfigured(Boolean(data.configured));
    setDocuments(data.documents || []);
    setError("");
    if (data.error) setError(data.error);
  }

  useEffect(() => {
    setPin(window.localStorage.getItem("dashboard_upload_pin") || "");
    loadDocuments();
  }, [apiUrl]);

  async function uploadDocument(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    const file = event.currentTarget.elements.file.files?.[0];
    if (!file) {
      setError("Seleziona un PDF da caricare.");
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("action", "pdf");
    body.append("tenantSlug", tenant.slug);
    body.append("file", file);
    body.append("pin", pin);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Caricamento non riuscito.");
      }

      setStatus(
        `${data.document.title} caricato: ${data.document.chunks} blocchi di conoscenza creati per ${tenant.spokenAssistantName}.`
      );
      window.localStorage.setItem("dashboard_upload_pin", pin);
      event.currentTarget.reset();
      await loadDocuments();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function importWebsite(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setImportingSite(true);

    const body = new FormData();
    body.append("action", "website");
    body.append("tenantSlug", tenant.slug);
    body.append("url", websiteUrl);
    body.append("pin", pin);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import sito non riuscito.");
      }

      setStatus(
        `${data.document.title} importato: ${data.document.chunks} blocchi di conoscenza creati per ${tenant.spokenAssistantName}.`
      );
      window.localStorage.setItem("dashboard_upload_pin", pin);
      await loadDocuments();
    } catch (importError) {
      setError(importError.message);
    } finally {
      setImportingSite(false);
    }
  }

  async function deleteSource(source) {
    setError("");
    setStatus("");
    setDeletingId(source.id);

    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, pin, tenantSlug: tenant.slug })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Rimozione non riuscita.");
      }

      setStatus(`${source.title} rimosso dalla memoria di ${tenant.spokenAssistantName}.`);
      await loadDocuments();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId("");
    }
  }

  function getSourceLabel(source) {
    if (source.source_type === "website") return "Sito";
    if (source.source_type === "document") return "PDF";
    return "Fonte";
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <a href={tenant.slug === "new-digital-app" ? "/" : `/${tenant.slug}`} className="back-link">
          Torna a {tenant.spokenAssistantName}
        </a>
        <div>
          <span className="eyebrow">Knowledge base</span>
          <h1>Fonti {tenant.name}</h1>
          <p>
            Carica PDF e importa pagine del sito: {tenant.spokenAssistantName} li usera' come fonti quando risponde in chat.
          </p>
        </div>
      </section>

      <section className="dashboard-controls">
        {!configured ? (
          <div className="dashboard-alert">
            Supabase non e' ancora configurato su Vercel. Servono SUPABASE_URL e
            SUPABASE_SERVICE_ROLE_KEY.
          </div>
        ) : null}

        <form className="source-form" onSubmit={uploadDocument}>
          <label htmlFor="file">PDF da far imparare a {tenant.spokenAssistantName}</label>
          <input
            aria-label="PIN dashboard"
            name="pin"
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN dashboard"
            type="password"
            value={pin}
          />
          <input id="file" name="file" type="file" accept="application/pdf" />
          <button disabled={uploading || !configured} type="submit">
            {uploading ? "Caricamento..." : "Carica PDF"}
          </button>
        </form>

        <form className="source-form" onSubmit={importWebsite}>
          <label htmlFor="website-url">Pagina sito da importare</label>
          <input
            id="website-url"
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder={tenant.website || "https://www.newdigitalapp.com"}
            type="url"
            value={websiteUrl}
          />
          <button disabled={importingSite || !configured} type="submit">
            {importingSite ? "Importazione..." : "Importa sito"}
          </button>
        </form>

        {status ? <div className="dashboard-success">{status}</div> : null}
        {error ? <div className="dashboard-alert">{error}</div> : null}
      </section>

      <section className="document-list" aria-label="Documenti caricati">
        <h2>Fonti caricate</h2>
        {documents.length ? (
          <div className="document-items">
            {documents.map((document) => (
              <article className="document-item" key={document.id}>
                <div>
                  <strong>{document.title}</strong>
                  <small>{document.source_url || document.storage_path}</small>
                </div>
                <div className="document-actions">
                  <span>{getSourceLabel(document)} - {document.status}</span>
                  <button
                    disabled={deletingId === document.id}
                    onClick={() => deleteSource(document)}
                    type="button"
                  >
                    {deletingId === document.id ? "Rimuovo..." : "Rimuovi"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Nessuna fonte caricata. Il primo PDF o sito diventera' la prima memoria reale di {tenant.spokenAssistantName}.
          </p>
        )}
      </section>
    </main>
  );
}
