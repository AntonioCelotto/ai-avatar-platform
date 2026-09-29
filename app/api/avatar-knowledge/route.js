import { isAdminRequest } from "../../lib/admin-auth";
import { getClientSessionFromRequest } from "../../lib/client-auth";
import dns from "node:dns/promises";
import net from "node:net";
import {
  createAvatarKnowledgeSignedUpload,
  deleteAvatarDocument,
  downloadKnowledgeFile,
  getAvatarClientBySlug,
  insertAvatarDocument,
  insertAvatarKnowledgeSource,
  listAvatarDocuments
} from "../../lib/supabase-server";

export const maxDuration = 60;

function cleanHtml(html) {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim().slice(0, 45000);
}

function privateAddress(address) {
  if (net.isIPv4(address)) return /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address);
  return address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:");
}

async function safeWebsiteUrl(value) {
  const url = new URL(String(value || "").trim().match(/^https?:\/\//i) ? value : `https://${value}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Sono ammessi solo siti HTTP o HTTPS.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) throw new Error("Indirizzo non ammesso.");
  const addresses = await dns.lookup(host, { all: true });
  if (!addresses.length || addresses.some((item) => privateAddress(item.address))) throw new Error("Indirizzo di rete non ammesso.");
  return url;
}

async function fetchWebsitePage(url) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "follow", signal: controller.signal, headers: { "User-Agent": "AvatarOne-KnowledgeBot/3.0" } });
    if (!response.ok) throw new Error(`Il sito ha risposto con errore ${response.status}.`);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain")) throw new Error("Pagina non leggibile.");
    const html = (await response.text()).slice(0, 500000);
    return { html, text: cleanHtml(html) };
  } finally { clearTimeout(timeout); }
}

async function crawlWebsite(startUrl) {
  const first = await fetchWebsitePage(startUrl);
  const links = [...first.html.matchAll(/href=["']([^"'#]+)["']/gi)]
    .map((match) => { try { return new URL(match[1], startUrl); } catch { return null; } })
    .filter((url) => url && url.origin === startUrl.origin && !/\.(pdf|jpg|jpeg|png|webp|gif|zip|mp4|mp3)$/i.test(url.pathname))
    .map((url) => { url.hash = ""; url.search = ""; return url.toString(); });
  const unique = [...new Set(links)].filter((url) => url !== startUrl.toString()).slice(0, 7);
  const pages = await Promise.allSettled(unique.map(async (url) => ({ url, ...(await fetchWebsitePage(new URL(url))) })));
  const content = [{ url: startUrl.toString(), text: first.text }, ...pages.filter((item) => item.status === "fulfilled").map((item) => item.value)]
    .filter((page) => page.text.length >= 80)
    .map((page) => `PAGINA: ${page.url}\n${page.text}`)
    .join("\n\n")
    .slice(0, 45000);
  return { content, pages: 1 + pages.filter((item) => item.status === "fulfilled").length };
}

async function requireAccess(request, slug) {
  if (isAdminRequest(request)) return null;
  const session = await getClientSessionFromRequest(request);
  const client = session?.profile?.avatar_client_id ? await getAvatarClientBySlug(String(slug || "")) : null;
  return client?.id === session?.profile?.avatar_client_id ? null : Response.json({ error: "Accesso non autorizzato." }, { status: 401 });
}

async function clientFor(slug) {
  const client = await getAvatarClientBySlug(String(slug || ""));
  if (!client?.id) throw new Error("Persona digitale non trovata.");
  return client;
}

export async function GET(request) {
  try {
    const slug = new URL(request.url).searchParams.get("client");
    const authError = await requireAccess(request, slug); if (authError) return authError;
    const client = await clientFor(slug);
    const documents = await listAvatarDocuments(client.id);
    return Response.json({ ok: true, client, documents });
  } catch (error) { return Response.json({ error: error.message, documents: [] }, { status: 404 }); }
}

export async function POST(request) {
  let payload; try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const authError = await requireAccess(request, payload.clientSlug); if (authError) return authError;
  try {
    const client = await clientFor(payload.clientSlug);
    if (payload.action === "create_pdf_upload") {
      const fileName = String(payload.fileName || "documento.pdf");
      const fileSize = Number(payload.fileSize || 0);
      if (!fileName.toLowerCase().endsWith(".pdf")) return Response.json({ error: "Sono ammessi solo PDF." }, { status: 400 });
      if (fileSize > 10 * 1024 * 1024) return Response.json({ error: "PDF troppo grande. Limite: 10 MB." }, { status: 400 });
      return Response.json({ ok: true, ...(await createAvatarKnowledgeSignedUpload({ fileName, clientSlug: client.slug })) });
    }
    if (payload.action === "process_pdf_upload") {
      const storagePath = String(payload.storagePath || "");
      if (!storagePath.startsWith(`avatar-clients/${client.slug}/`)) return Response.json({ error: "Percorso non valido." }, { status: 400 });
      const buffer = await downloadKnowledgeFile(storagePath);
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const parsed = await pdfParse(buffer);
      const text = String(parsed.text || "").replace(/\s+/g, " ").trim().slice(0, 45000);
      if (!text) return Response.json({ error: "Il PDF non contiene testo leggibile." }, { status: 422 });
      const title = String(payload.fileName || "documento.pdf").slice(0, 180);
      await insertAvatarKnowledgeSource({ clientId: client.id, sourceType: "pdf", title, content: text, status: "active", metadata: { storagePath } });
      const document = await insertAvatarDocument({ clientId: client.id, title, fileName: title, fileType: "application/pdf", storagePath, extractedText: text, status: "ready", metadata: { characters: text.length } });
      return Response.json({ ok: true, document });
    }
    if (payload.action === "website") {
      const url = await safeWebsiteUrl(payload.url);
      const website = await crawlWebsite(url);
      const text = website.content;
      if (text.length < 120) throw new Error("Il sito contiene troppo poco testo leggibile.");
      const title = url.hostname;
      await insertAvatarKnowledgeSource({ clientId: client.id, sourceType: "website", title, sourceUrl: url.toString(), content: text, status: "active", metadata: { importedBy: "knowledge-center", pages: website.pages } });
      const document = await insertAvatarDocument({ clientId: client.id, title, fileName: url.toString(), fileType: "website", fileUrl: url.toString(), extractedText: text, status: "ready", metadata: { characters: text.length, pages: website.pages } });
      return Response.json({ ok: true, document, pages: website.pages });
    }
    return Response.json({ error: "Azione non valida." }, { status: 400 });
  } catch (error) { return Response.json({ error: error.message || "Operazione non riuscita." }, { status: 500 }); }
}

export async function DELETE(request) {
  let payload; try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const authError = await requireAccess(request, payload.clientSlug); if (authError) return authError;
  try {
    const client = await clientFor(payload.clientSlug);
    const deleted = await deleteAvatarDocument(String(payload.documentId || ""), client.id);
    return Response.json({ ok: deleted });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
