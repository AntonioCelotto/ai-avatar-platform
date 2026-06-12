"use client";

import { useEffect, useState } from "react";

export function DocumentsDashboard() {
  const [documents, setDocuments] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pin, setPin] = useState("");

  async function loadDocuments() {
    const response = await fetch("/api/documents", { cache: "no-store" });
    const data = await response.json();
    setConfigured(Boolean(data.configured));
    setDocuments(data.documents || []);
    if (data.error) setError(data.error);
  }

  useEffect(() => {
    setPin(window.localStorage.getItem("dashboard_upload_pin") || "");
    loadDocuments();
  }, []);

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
        `${data.document.title} caricato: ${data.document.chunks} blocchi di conoscenza creati.`
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

  return (
    <main className="dashboard-shell">
      <section className="dashboard-header">
        <a href="/" className="back-link">
          Torna a Mia
        </a>
        <div>
          <span className="eyebrow">Knowledge base</span>
          <h1>Documenti New Digital App</h1>
          <p>
            Carica PDF aziendali: Mia li usera' come fonti quando risponde in chat.
          </p>
        </div>
      </section>

      <section className="document-uploader">
        {!configured ? (
          <div className="dashboard-alert">
            Supabase non e' ancora configurato su Vercel. Servono
            `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
          </div>
        ) : null}

        <form onSubmit={uploadDocument}>
          <label htmlFor="file">PDF da far imparare a Mia</label>
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

        {status ? <div className="dashboard-success">{status}</div> : null}
        {error ? <div className="dashboard-alert">{error}</div> : null}
      </section>

      <section className="document-list" aria-label="Documenti caricati">
        <h2>Documenti caricati</h2>
        {documents.length ? (
          <div className="document-items">
            {documents.map((document) => (
              <article className="document-item" key={document.id}>
                <strong>{document.title}</strong>
                <span>{document.status}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Nessun PDF caricato. Il primo documento diventera' la prima memoria reale di Mia.
          </p>
        )}
      </section>
    </main>
  );
}
