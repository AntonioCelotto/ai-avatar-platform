import { getAvatarClientBySlug, getAvatarKnowledgeText, insertUsageEvent, listUsageSummary } from "../../lib/supabase-server";
import { enforceRateLimit, requestIp } from "../../lib/rate-limit";

export async function POST(request) {
  const limited = enforceRateLimit(request, "custom-chat", { limit: 18, windowMs: 60_000 });
  if (limited) return limited;
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const slug = String(payload?.slug || "").trim().slice(0, 80);
  if (!slug) return Response.json({ error: "Avatar non valido." }, { status: 400 });
  const avatar = await getAvatarClientBySlug(slug).catch(() => null);
  if (!avatar?.id || avatar.status !== "active") return Response.json({ error: "Avatar non disponibile." }, { status: 404 });
  if (avatar.commercial_status === "suspended") return Response.json({ error: "Servizio temporaneamente sospeso." }, { status: 402 });
  const usage = await listUsageSummary(avatar.id).catch(() => ({}));
  if (Number(usage.chat || 0) >= Number(avatar.monthly_chat_limit || 1000)) return Response.json({ error: "Limite mensile conversazioni raggiunto." }, { status: 429 });
  const messages = Array.isArray(payload.messages)
    ? payload.messages.filter((item) => item && ["user", "assistant"].includes(item.role)).slice(-10).map((item) => ({ role: item.role, content: String(item.content || "").slice(0, 1800) }))
    : [];
  if (!messages.some((item) => item.role === "user" && item.content.trim())) return Response.json({ error: "Messaggio mancante." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Motore AI non configurato." }, { status: 503 });
  const knowledge = await getAvatarKnowledgeText(avatar.id).catch(() => "");
  const instructions = [
    `Sei ${String(avatar.spoken_avatar_name || avatar.avatar_name).slice(0, 50)}, assistente digitale di ${String(avatar.company_name).slice(0, 120)}.`,
    `Ruolo: ${String(avatar.personality?.role || "assistente digitale").slice(0, 500)}.`,
    `Tono: ${String(avatar.personality?.tone || "naturale e professionale").slice(0, 500)}.`,
    `Conoscenza aziendale verificata:\n${knowledge || String(avatar.notes || "").slice(0, 1200)}`,
    "Rispondi in italiano, in modo breve, chiaro e coerente, senza Markdown.",
    "Usa solo i fatti della conoscenza di questo avatar. Non utilizzare dati di altri clienti.",
    "Non inventare prezzi, orari, indirizzi, disponibilità o servizi. Se il dato manca, proponi il contatto con l’azienda."
  ].join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.2", instructions, input: messages }) });
    if (!response.ok) return Response.json({ error: "Risposta AI non disponibile." }, { status: 502 });
    const data = await response.json();
    const reply = String(data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || "").replace(/\*\*|__|`/g, "").trim().slice(0, 4000);
    if (!reply) return Response.json({ error: "Risposta AI vuota." }, { status: 502 });
    insertUsageEvent({ clientId: avatar.id, eventType: "chat", units: 1, metadata: { ip: requestIp(request), inputCharacters: messages.at(-1)?.content?.length || 0, outputCharacters: reply.length } }).catch(() => {});
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Connessione AI non disponibile." }, { status: 502 }); }
}
