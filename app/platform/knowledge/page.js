import { revalidatePath } from "next/cache";
import {
  getAvatarClientBySlug,
  insertAvatarDocument,
  insertAvatarKnowledgeSource,
  listAvatarClients,
  listAvatarDocuments,
  isSupabaseConfigured
} from "../../lib/supabase-server";
import "../platform.css";

function cleanHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 45000);
}

function normalizeUrl(url = "") {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return "";
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;
  return `https://${cleanUrl}`;
}

async function analyzeWebsite(formData) {
  "use server";

  const slug = String(formData.get("clientSlug") || "new-digital-app");
  const rawUrl = String(formData.get("websiteUrl") || "");
  const websiteUrl = normalizeUrl(rawUrl);

  if (!websiteUrl) return;

  const client = await getAvatarClientBySlug(slug);
  if (!client?.id) return;

  let title = websiteUrl;
  let extractedText = "";
  let status = "ready";
  let errorMessage = "";

  try {
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "AvatarOneBot/1.0 (+https://newdigitalapp.com)"
      },
      next: { revalidate: 0 }
    });

    const html = await response.text();
    title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || websiteUrl;
    extractedText = cleanHtml(html);

    if (!response.ok || !extractedText) {
      status = "error";
      errorMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    status = "error";
    errorMessage = error?.message || "Impossibile leggere il sito";
  }

  await insertAvatarDocument({
    clientId: client.id,
    title,
    fileName: websiteUrl,
    fileType: "website",
    fileUrl: websiteUrl,
    extractedText,
    status,
    metadata: { source: "website", error: errorMessage }
  });

  await insertAvatarKnowledgeSource({
    clientId: client.id,
    sourceType: "website",
    title,
    sourceUrl: websiteUrl,
    content: extractedText || errorMessage,
    status: status === "ready" ? "active" : "error",
    metadata: { error: errorMessage }
  });

  revalidatePath(`/platform/knowledge?client=${slug}`);
}

async function uploadKnowledgeFile(formData) {
  "use server";

  const slug = String(formData.get("clientSlug") || "new-digital-app");
  const file = formData.get("knowledgeFile");
  const client = await getAvatarClientBySlug(slug);

  if (!client?.id || !file || typeof file === "string" || !file.name) return;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || "application/octet-stream";
  let extractedText = "";
  let status = "ready";
  let errorMessage = "";

  try {
    if (mimeType.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      extractedText = String(parsed.text || "").replace(/\s+/g, " ").trim().slice(0, 45000);
    } else if (mimeType.includes("text") || file.name.toLowerCase().endsWith(".txt")) {
      extractedText = buffer.toString("utf8").replace(/\s+/g, " ").trim().slice(0, 45000);
    } else {
      extractedText = `Documento caricato: ${file.name}. Estrazione automatica del formato ${mimeType} in fase di abilitazione.`;
      status = "processing";
    }
  } catch (error) {
    status = "error";
    errorMessage = error?.message || "Errore lettura documento";
  }

  await insertAvatarDocument({
    clientId: client.id,
    title: file.name,
    fileName: file.name,
    fileType: mimeType,
    extractedText,
    status,
    metadata: { size: file.size, error: errorMessage }
  });

  await insertAvatarKnowledgeSource({
    clientId: client.id,
    sourceType: mimeType.includes("pdf") ? "pdf" : "text",
    title: file.name,
    content: extractedText || errorMessage,
    status: status === "ready" ? "active" : status,
    metadata: { fileType: mimeType, size: file.size, error: errorMessage }
  });

  revalidatePath(`/platform/knowledge?client=${slug}`);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusLabel(status) {
  if (status === "ready" || status === "active") return ["🟢", "Elaborato"];
  if (status === "processing" || status === "draft") return ["🟡", "In elaborazione"];
  return ["🔴", "Errore"];
}

export default async function KnowledgeCenterPage({ searchParams }) {
  const params = await searchParams;
  const clients = isSupabaseConfigured() ? await listAvatarClients() : [];
  const selectedSlug = params?.client || clients?.[0]?.slug || "new-digital-app";
  const selectedClient = clients.find((client) => client.slug === selectedSlug) || clients[0];
  const documents = selectedClient?.id ? await listAvatarDocuments(selectedClient.id) : [];
  const websites = documents.filter((document) => document.file_type === "website");
  const files = documents.filter((document) => document.file_type !== "website");
  const readyCount = documents.filter((document) => document.status === "ready").length;
  const score = documents.length ? Math.round((readyCount / documents.length) * 100) : 0;

  return (
    <main className="platform-shell platform-shell--single">
      <section className="platform-main platform-main--centered">
        <header className="platform-mobile-topbar">
          <a href="/platform">←</a>
          <div>
            <span>AvatarOne</span>
            <strong>Conoscenze</strong>
          </div>
          <a href="#upload">＋</a>
        </header>

        <section className="platform-hero platform-hero--app knowledge-hero">
          <div>
            <p className="platform-kicker">Knowledge Center V1</p>
            <h1>📚 Cosa sa il tuo Assistente</h1>
            <p>
              Aggiungi un sito o un documento: AvatarOne lo trasforma in conoscenza per la Persona Digitale.
            </p>
          </div>
          <div className="knowledge-score">
            <span>Knowledge Score</span>
            <strong>{score}%</strong>
          </div>
        </section>

        <section className="platform-section">
          <div className="platform-section-head">
            <div>
              <p className="platform-kicker">Cliente</p>
              <h2>{selectedClient?.company_name || "Nessun cliente"}</h2>
            </div>
          </div>
          <div className="knowledge-client-switcher">
            {clients.map((client) => (
              <a className={client.slug === selectedSlug ? "is-active" : ""} href={`/platform/knowledge?client=${client.slug}`} key={client.slug}>
                {client.spoken_avatar_name || client.avatar_name}
                <small>{client.company_name}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="platform-grid-two" id="upload">
          <article className="platform-section knowledge-panel">
            <div className="platform-section-head">
              <div>
                <p className="platform-kicker">Sito Web</p>
                <h2>🌐 Analizza sito</h2>
              </div>
            </div>
            <form action={analyzeWebsite} className="knowledge-form">
              <input type="hidden" name="clientSlug" value={selectedSlug} />
              <label htmlFor="websiteUrl">URL del sito</label>
              <input id="websiteUrl" name="websiteUrl" placeholder="https://www.hotel-luna.it" required />
              <button type="submit">Analizza sito</button>
            </form>
          </article>

          <article className="platform-section knowledge-panel">
            <div className="platform-section-head">
              <div>
                <p className="platform-kicker">Documenti</p>
                <h2>📄 Carica materiale</h2>
              </div>
            </div>
            <form action={uploadKnowledgeFile} className="knowledge-form">
              <input type="hidden" name="clientSlug" value={selectedSlug} />
              <label htmlFor="knowledgeFile">PDF o TXT</label>
              <input id="knowledgeFile" name="knowledgeFile" type="file" accept=".pdf,.txt,text/plain,application/pdf" required />
              <button type="submit">Carica documento</button>
            </form>
          </article>
        </section>

        <section className="platform-stats platform-stats--mobile knowledge-stats">
          <article className="platform-card"><span>Siti</span><strong>{websites.length}</strong><small>Analizzati</small></article>
          <article className="platform-card"><span>Documenti</span><strong>{files.length}</strong><small>Caricati</small></article>
          <article className="platform-card"><span>Pronti</span><strong>{readyCount}</strong><small>Fonti elaborate</small></article>
          <article className="platform-card"><span>Ultimo update</span><strong>{documents[0] ? formatDate(documents[0].created_at) : "-"}</strong><small>Knowledge</small></article>
        </section>

        <section className="platform-section">
          <div className="platform-section-head">
            <div>
              <p className="platform-kicker">Fonti</p>
              <h2>Materiale acquisito</h2>
            </div>
            <span className="platform-soft-label">{documents.length} fonti</span>
          </div>

          <div className="knowledge-list">
            {documents.length ? documents.map((document) => {
              const [icon, label] = statusLabel(document.status);
              return (
                <article className="knowledge-item" key={document.id}>
                  <div>
                    <span>{document.file_type === "website" ? "🌐" : "📄"}</span>
                    <strong>{document.title}</strong>
                    <small>{document.file_url || document.file_name || "Fonte interna"}</small>
                  </div>
                  <mark>{icon} {label}</mark>
                </article>
              );
            }) : (
              <div className="knowledge-empty">
                <strong>Nessuna conoscenza caricata</strong>
                <p>Inserisci un sito o carica un PDF per iniziare il primo test.</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
