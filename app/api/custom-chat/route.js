export async function POST(request) {
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const avatar = payload?.avatar && typeof payload.avatar === "object" ? payload.avatar : null;
  if (!avatar || !String(avatar.name || "").trim()) return Response.json({ error: "Avatar non valido." }, { status: 400 });
  const messages = Array.isArray(payload.messages)
    ? payload.messages.filter((item) => item && ["user", "assistant"].includes(item.role)).slice(-10).map((item) => ({ role: item.role, content: String(item.content || "").slice(0, 2000) }))
    : [];
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Motore AI non configurato." }, { status: 503 });
  const instructions = [
    `Sei ${String(avatar.name).slice(0, 32)}, assistente digitale di ${String(avatar.companyName || "Nuovo progetto").slice(0, 80)}.`,
    `Ruolo: ${String(avatar.role || "assistente digitale").slice(0, 240)}.`,
    `Tono: ${String(avatar.tone || "naturale e professionale").slice(0, 240)}.`,
    `Conoscenza iniziale: ${String(avatar.knowledgeSummary || "").slice(0, 1200)}.`,
    "Rispondi in italiano, in modo breve, chiaro e coerente, senza Markdown o simboli di formattazione.",
    "Usa esclusivamente i fatti presenti nella conoscenza iniziale. Non dedurre né inventare orari, prezzi, indirizzi, disponibilità, servizi o regole operative. Se il dato richiesto non è presente, di' chiaramente che non è ancora disponibile e proponi di contattare la struttura."
  ].join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.2", instructions, input: messages })
    });
    if (!response.ok) return Response.json({ error: "Risposta AI non disponibile." }, { status: 502 });
    const data = await response.json();
    const reply = String(data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || "").replace(/\*\*|__|`/g, "").trim();
    if (!reply) return Response.json({ error: "Risposta AI vuota." }, { status: 502 });
    return Response.json({ reply: reply.slice(0, 4000) });
  } catch {
    return Response.json({ error: "Connessione AI non disponibile." }, { status: 502 });
  }
}
