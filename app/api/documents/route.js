import {
  chunkText,
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
  const file = formData.get("file");
  const pin = String(formData.get("pin") || "");

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
