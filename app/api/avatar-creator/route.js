function slugify(value) { return String(value || "avatar").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "avatar"; }
function parseJson(text) { const clean = String(text || "").replace(/^```json\s*|\s*```$/g, "").trim(); try { return JSON.parse(clean); } catch { return null; } }
function normalizeAvatar(value, prompt) { const name = String(value?.name || "Nova").trim().slice(0, 32); return { slug: `custom-${slugify(name)}-${Date.now().toString(36).slice(-5)}`, name, assistantName: name, companyName: String(value?.companyName || "Nuovo progetto").trim().slice(0, 80), category: String(value?.category || "Assistente digitale").trim().slice(0, 50), role: String(value?.role || "assistente digitale personalizzato").trim().slice(0, 240), tone: String(value?.tone || "naturale, professionale e cordiale").trim().slice(0, 240), welcomeMessage: String(value?.welcomeMessage || `Ciao, sono ${name}. Come posso aiutarti?`).trim().slice(0, 220), suggestions: Array.isArray(value?.suggestions) ? value.suggestions.map(String).slice(0, 3) : ["Come puoi aiutarmi?", "Raccontami cosa sai", "Iniziamo"], knowledgeSummary: String(value?.knowledgeSummary || prompt).trim().slice(0, 1200), accent: /^#[0-9a-f]{6}$/i.test(value?.accent || "") ? value.accent : "#0071e3", createdAt: new Date().toISOString() }; }

function cleanWebsiteText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeWebsiteUrl(value) {
  const url = new URL(String(value || "").trim().match(/^https?:\/\//i) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Sono ammessi solo siti HTTP o HTTPS.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) throw new Error("Indirizzo del sito non ammesso.");
  return url;
}

async function importWebsite(value) {
  const url = safeWebsiteUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "AvatarOne-KnowledgeBot/1.0" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Il sito ha risposto con errore ${response.status}.`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) throw new Error("Il collegamento non contiene una pagina web leggibile.");
    const text = cleanWebsiteText((await response.text()).slice(0, 400000));
    if (text.length < 160) throw new Error("Il sito contiene troppo poco testo leggibile.");
    return { url: url.toString(), hostname: url.hostname, text: text.slice(0, 14000) };
  } finally { clearTimeout(timeout); }
}

export async function POST(request) {
  let payload; try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  if (payload?.action === "publish") {
    if (!isSupabaseConfigured()) return Response.json({ error: "Archivio cloud non configurato." }, { status: 503 });
    const avatar = payload.avatar && typeof payload.avatar === "object" ? payload.avatar : null;
    if (!avatar?.slug || !avatar?.name || !avatar?.companyName) return Response.json({ error: "Configurazione avatar incompleta." }, { status: 400 });
    try {
      const [uploadedImage, uploadedVideo, uploadedVoice] = await Promise.all([
        avatar.imageDataUrl ? uploadAvatarMedia({ dataUrl: avatar.imageDataUrl, fileName: avatar.imageName, slug: avatar.slug, kind: "image" }) : "",
        avatar.videoDataUrl ? uploadAvatarMedia({ dataUrl: avatar.videoDataUrl, fileName: avatar.videoName, slug: avatar.slug, kind: "video" }) : "",
        avatar.voiceDataUrl ? uploadAvatarMedia({ dataUrl: avatar.voiceDataUrl, fileName: avatar.voiceName, slug: avatar.slug, kind: "voice" }) : ""
      ]);
      const saved = await upsertAvatarClient({
        slug: avatar.slug,
        company_name: String(avatar.companyName).slice(0, 120),
        category: String(avatar.category || "Assistente digitale").slice(0, 80),
        status: "active",
        website: avatar.knowledgeUrl || null,
        whatsapp_phone: String(avatar.whatsappPhone || "").replace(/\D/g, "").slice(0, 20) || null,
        avatar_name: String(avatar.name).slice(0, 50),
        spoken_avatar_name: String(avatar.name).slice(0, 50),
        avatar_poster_url: uploadedImage || avatar.imageUrl || null,
        avatar_video_url: uploadedVideo || avatar.videoUrl || null,
        media_mode: avatar.mediaMode || "placeholder",
        voice_provider: String(avatar.voice || "openai:marin").split(":")[0],
        voice_id: String(avatar.voice || "").includes(":") ? String(avatar.voice).split(":")[1] : null,
        voice_label: avatar.voice || "Voce italiana",
        brand_mark: String(avatar.name).toUpperCase().slice(0, 12),
        welcome_message: String(avatar.welcomeMessage || "").slice(0, 1000),
        input_placeholder: `Scrivi a ${String(avatar.name).slice(0, 50)}`,
        suggestions: Array.isArray(avatar.suggestions) ? avatar.suggestions.slice(0, 6) : [],
        personality: {
          role: String(avatar.role || "assistente digitale").slice(0, 500),
          tone: String(avatar.tone || "naturale e professionale").slice(0, 500)
        },
        theme: { accent: /^#[0-9a-f]{6}$/i.test(avatar.accent || "") ? avatar.accent : "#0071e3" },
        notes: String(avatar.knowledgeSummary || "").slice(0, 10000),
        features: { cloud: true, website: Boolean(avatar.knowledgeUrl), documents: false, voiceSampleUrl: uploadedVoice || "" }
      });
      if (!saved?.id) throw new Error("Salvataggio cloud non completato.");
      if (avatar.websiteKnowledge || avatar.knowledgeSummary) {
        await insertAvatarKnowledgeSource({
          clientId: saved.id,
          sourceType: avatar.websiteKnowledge ? "website" : "text",
          title: avatar.websiteKnowledge ? new URL(avatar.knowledgeUrl).hostname : "Conoscenza iniziale",
          sourceUrl: avatar.knowledgeUrl || null,
          content: avatar.websiteKnowledge || avatar.knowledgeSummary,
          status: "active",
          metadata: { importedBy: "avatarone-creator" }
        });
      }
      return Response.json({ ok: true, avatar: {
        ...avatar,
        imageDataUrl: "",
        videoDataUrl: "",
        voiceDataUrl: "",
        imageUrl: saved.avatar_poster_url || "",
        videoUrl: saved.avatar_video_url || "",
        cloud: true
      }});
    } catch (error) {
      return Response.json({ error: error.message || "Pubblicazione cloud non riuscita." }, { status: 500 });
    }
  }
  if (payload?.action === "website") {
    try {
      const website = await importWebsite(payload.url);
      return Response.json({ ok: true, website });
    } catch (error) {
      return Response.json({ error: error?.name === "AbortError" ? "Il sito non ha risposto in tempo." : error.message || "Non riesco a leggere il sito." }, { status: 422 });
    }
  }
  const prompt = String(payload?.prompt || "").trim().slice(0, 3000); if (prompt.length < 15) return Response.json({ error: "Descrizione troppo breve." }, { status: 400 }); if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Motore AI non configurato." }, { status: 503 });
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try { const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.2", instructions: "Sei il configuratore AvatarOne di New Digital App. Rispondi solo con JSON valido, senza markdown, usando: name, companyName, category, role, tone, welcomeMessage, suggestions (3 frasi), knowledgeSummary, accent (colore esadecimale). Scrivi in italiano. In knowledgeSummary inserisci esclusivamente fatti presenti nella richiesta dell'utente: non inventare orari, prezzi, indirizzi, servizi o regole operative.", input: prompt }) }); if (!response.ok) return Response.json({ error: "Il motore AI non ha completato la configurazione." }, { status: 502 }); const data = await response.json(); const output = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || ""; const parsed = parseJson(output); if (!parsed) return Response.json({ error: "Configurazione AI non valida. Riprova con una descrizione più semplice." }, { status: 502 }); return Response.json({ avatar: normalizeAvatar(parsed, prompt) }); }
  catch (error) { return Response.json({ error: error?.name === "AbortError" ? "Creazione scaduta. Riprova." : "Creazione non riuscita." }, { status: 502 }); } finally { clearTimeout(timeout); }
}
import {
  insertAvatarKnowledgeSource,
  isSupabaseConfigured,
  uploadAvatarMedia,
  upsertAvatarClient
} from "../../lib/supabase-server";
