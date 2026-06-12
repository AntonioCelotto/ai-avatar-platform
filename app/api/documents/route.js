import {
  chunkText,
  deleteKnowledgeSource,
  ensureDefaultVenue,
  insertKnowledgeChunks,
  insertKnowledgeSource,
  isSupabaseConfigured,
  listKnowledgeSources,
  uploadKnowledgeFile
} from "../../lib/supabase-server";

async function extractPdfText(buffer) {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const parsed = await pdfParse(buffer);
  return String(parsed.text || "").replace(/\s+/g, " ").trim();
}

function cleanHtmlText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function assertValidPin(pin) {
  if (!process.env.DASHBOARD_UPLOAD_PIN) {
    return Response.json(
      {
        error:
          "PIN dashboard non configurato. Aggiungi DASHBOARD_UPLOAD_PIN nelle variabili Vercel."
      },
      { status: 503 }
    );
  }

  if (pin !== process.env.DASHBOARD_UPLOAD_PIN) {
    return Response.json({ error: "PIN dashboard non valido." }, { status: 401 });
  }

  return null;
}

async function importWebsiteSource(url) {
  const websiteUrl = new URL(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(websiteUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "NewDigitalApp-MiaBot/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Il sito ha risposto con errore ${response.status}.`);
    }

    const html = await response.text();
    return cleanHtmlText(html);
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({
      configured: false,
      documents: []
    });
  }

  try {
    const documents = await listKnowledgeSources();
    return Response.json({ configured: true, documents });
  } catch (error) {
    return Response.json(
      { configured: true, error: error.message, documents: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return Response.json(
      {
        error:
          "Supabase non e' configurato. Aggiungi SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY su Vercel."
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const action = String(formData.get("action") || "pdf");
  const file = formData.get("file");
  const pin = String(formData.get("pin") || "");
  const pinError = assertValidPin(pin);

  if (pinError) return pinError;

  if (action === "website") {
    const rawUrl = String(formData.get("url") || "").trim();
    if (!rawUrl) {
      return Response.json({ error: "Inserisci l'URL del sito." }, { status: 400 });
    }

    let websiteUrl;
    try {
      websiteUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    } catch {
      return Response.json({ error: "URL sito non valido." }, { status: 400 });
    }

    try {
      const venueId = await ensureDefaultVenue();
      const extractedText = await importWebsiteSource(websiteUrl.toString());

      if (extractedText.length < 120) {
        return Response.json(
          { error: "Ho trovato troppo poco testo leggibile in questa pagina." },
          { status: 422 }
        );
      }

      const source = await insertKnowledgeSource({
        venueId,
        title: websiteUrl.hostname,
        sourceType: "website",
        sourceUrl: websiteUrl.toString(),
        extractedText
      });
      const chunks = chunkText(extractedText);
      await insertKnowledgeChunks({ sourceId: source.id, chunks });

      return Response.json({
        ok: true,
        document: {
          id: source.id,
          title: source.title,
          chunks: chunks.length,
          characters: extractedText.length
        }
      });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  if (!file || typeof file === "string") {
    return Response.json({ error: "Carica un PDF valido." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "Per ora accettiamo solo PDF." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > 10 * 1024 * 1024) {
    return Response.json({ error: "PDF troppo grande. Limite MVP: 10 MB." }, { status: 400 });
  }

  try {
    const [venueId, extractedText, storagePath] = await Promise.all([
      ensureDefaultVenue(),
      extractPdfText(buffer),
      uploadKnowledgeFile({
        fileName: file.name,
        mimeType: file.type,
        buffer
      })
    ]);

    if (!extractedText) {
      return Response.json(
        { error: "Non sono riuscito a leggere testo nel PDF." },
        { status: 422 }
      );
    }

    const source = await insertKnowledgeSource({
      venueId,
      title: file.name,
      sourceType: "document",
      storagePath,
      extractedText
    });
    const chunks = chunkText(extractedText);
    await insertKnowledgeChunks({ sourceId: source.id, chunks });

    return Response.json({
      ok: true,
      document: {
        id: source.id,
        title: source.title,
        chunks: chunks.length,
        characters: extractedText.length
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase non e' configurato." }, { status: 503 });
  }

  const payload = await request.json();
  const pinError = assertValidPin(String(payload.pin || ""));
  if (pinError) return pinError;

  if (!payload.id) {
    return Response.json({ error: "Fonte non valida." }, { status: 400 });
  }

  try {
    await deleteKnowledgeSource(payload.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
