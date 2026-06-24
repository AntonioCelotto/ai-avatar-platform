import { defaultTenantSlug, getTenant } from "../../tenant-config";
import { getFrancescaLibraryContext } from "../../data/francesca-library";
import { findRelevantKnowledge } from "../../lib/supabase-server";

function getExtraTenantContext(tenant) {
  if (tenant.slug === "demo-cliente-01") {
    return getFrancescaLibraryContext(90);
  }

  return "";
}

function buildMemoryContext(clientMemory = {}) {
  const entries = [
    ["Nome", clientMemory.nome],
    ["Citta'", clientMemory.citta],
    ["Hobby", clientMemory.hobby],
    ["Canzone preferita", clientMemory.canzonePreferita],
    ["Animale preferito", clientMemory.animalePreferito]
  ].filter(([, value]) => value);

  const emotional = Array.isArray(clientMemory.emotionalMemories)
    ? clientMemory.emotionalMemories.slice(-4).map((item) => `- Ricordo emotivo: ${item.note}`)
    : [];

  if (!entries.length && !emotional.length) return "Nessuna memoria personale salvata.";

  return [
    ...entries.map(([label, value]) => `- ${label}: ${value}`),
    ...emotional
  ].join("\n");
}

function buildContext(tenant, clientMemory = {}) {
  const knowledge = tenant.knowledge
    .map((item) => `- ${item.title}: ${item.text}`)
    .join("\n");
  const extraContext = getExtraTenantContext(tenant);
  const memoryContext = tenant.slug === "demo-cliente-01" ? buildMemoryContext(clientMemory) : "";

  return [
    `Azienda collegata: ${tenant.name}`,
    `Assistente: ${tenant.spokenAssistantName}`,
    `Proprietario/referente del progetto: ${tenant.ownerName}`,
    `Sito ufficiale collegato: ${tenant.website}`,
    `Ruolo assistente: ${tenant.personality.role}`,
    `Tono richiesto: ${tenant.personality.tone}`,
    `Obiettivo esperienza: ${tenant.personality.experienceGoal}`,
    "Informazioni confermate:",
    knowledge,
    memoryContext ? `\nMemoria personale dell'utente:\n${memoryContext}` : "",
    extraContext ? `\nMateriale conversazionale dedicato:\n${extraContext}` : "",
    "Regole: rispondi in modo breve, concreto, umano e coinvolgente. Non elencare funzioni tecniche se l'utente non le chiede. Quando mancano dati specifici, dillo con naturalezza e accompagna verso il prossimo passo."
  ].filter(Boolean).join("\n");
}

function fallbackReply(messages, tenant, extra = {}) {
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const orderDraft = `Nuova richiesta per ${tenant.name}:\n${lastUserMessage}`;

  const reply = tenant.slug === "demo-cliente-01"
    ? "Sono qui con te. Raccontami come stai oggi, oppure possiamo fare insieme un piccolo gioco o ricordare qualcosa di bello."
    : "Sono qui. Raccontami cosa vuoi esplorare e ti rispondo in modo chiaro, senza trasformare ogni domanda in una vendita.";

  return {
    reply,
    orderDraft,
    ...extra
  };
}

export async function POST(request) {
  const payload = await request.json();
  const tenant = getTenant(payload.tenantSlug || defaultTenantSlug);

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const clientMemory = payload.clientMemory && typeof payload.clientMemory === "object" ? payload.clientMemory : {};

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(fallbackReply(messages, tenant, { source: "fallback_no_key" }));
  }

  const transcript = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "Cliente" : "Assistente"}: ${message.content}`)
    .join("\n");
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const documentKnowledge = await findRelevantKnowledge(lastUserMessage, tenant.slug);
  const isFrancesca = tenant.slug === "demo-cliente-01";
  const userTurns = messages.filter((message) => message.role === "user").length;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  let openAIResponse;

  try {
    openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        instructions: [
          `Sei ${tenant.spokenAssistantName}, ${tenant.personality.role}, con tono ${tenant.personality.tone}.`,
          `${tenant.ownerName} e' il proprietario/referente del progetto, ma non devi presumere che ogni visitatore sia ${tenant.ownerName}.`,
          `Chiama l'utente ${tenant.ownerName} solo se nella conversazione dice chiaramente di essere ${tenant.ownerName} o se sta parlando come proprietario del progetto. Altrimenti usa un tono neutro e non chiamarlo per nome.`,
          isFrancesca
            ? "Questa esperienza e' dedicata a persone anziane: fai compagnia, ascolta, proponi ricordi, storie, giochi semplici, curiosita' e conversazioni serene. Usa frasi brevi e una sola domanda alla volta."
            : `Non aprire le risposte parlando di ${tenant.name}, siti, app o avatar AI se l'utente non lo chiede. Queste informazioni sono contesto interno, non il centro di ogni risposta.`,
          isFrancesca
            ? "Usa la memoria personale con delicatezza. Se conosci il nome, puoi salutare per nome ogni tanto. Se conosci hobby, citta', canzone, animale preferito o un ricordo emotivo, richiamali in modo naturale per far sentire la persona ricordata, senza insistere su temi tristi."
            : "Rispondi in italiano, in modo naturale, emozionale, professionale e facile da capire da smartphone.",
          isFrancesca
            ? "Modalita Animatrice: dopo almeno due messaggi dell'utente, se la conversazione e' ferma o l'utente risponde in modo breve, prendi una piccola iniziativa. Proponi una sola attivita' tra: gioco di memoria, indovinello, racconto breve, curiosita', ricordo d'infanzia o domanda su un interesse salvato. Deve sembrare naturale, non automatico."
            : "Rispondi in italiano, in modo naturale, emozionale, professionale e facile da capire da smartphone.",
          isFrancesca
            ? `Numero messaggi utente in questa conversazione: ${userTurns}. Se sono almeno 2 puoi proporre con dolcezza una piccola attivita' se utile.`
            : "",
          "Rispondi in italiano, in modo naturale, emozionale e facile da capire da smartphone.",
          "Mantieni le risposte compatte: di solito 2 o 3 frasi, salvo richiesta esplicita di dettagli.",
          "Devi sembrare una presenza intelligente ed esperienziale, non una brochure tecnica e non un venditore automatico.",
          isFrancesca
            ? "Se l'utente chiede un gioco, scegli un gioco di memoria o un indovinello. Se chiede compagnia, resta nel dialogo. Se racconta un ricordo, chiedi un dettaglio con delicatezza."
            : "Puoi rispondere a domande generali, idee, dubbi, curiosita', strategia, tecnologia, business e vita quotidiana usando conoscenza generale quando il contesto confermato non basta.",
          "Se trovi contesto dalle fonti caricate, usalo prima della conoscenza generale.",
          "Non promettere integrazioni gia' completate se sono ancora future.",
          isFrancesca
            ? "Non aggiungere riepiloghi commerciali o messaggi WhatsApp se non richiesti dal referente."
            : "Quando emerge chiaramente una richiesta commerciale, operativa o di contatto, proponi un riepilogo chiaro per WhatsApp. Non proporlo per ogni semplice domanda."
        ].filter(Boolean).join("\n"),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${buildContext(tenant, clientMemory)}\n\nContesto dalle fonti caricate:\n${documentKnowledge || "Nessuna fonte rilevante trovata."}\n\nConversazione recente:\n${transcript}\n\nRispondi con calore, presenza e personalita'. ${isFrancesca ? "Per Francesca, usa memoria e libreria conversazionale come ispirazione. Fai una sola domanda alla volta. Se serve, attiva la modalita Animatrice con una proposta dolce e breve." : "Se dalla conversazione emerge davvero una richiesta commerciale o operativa, alla fine aggiungi una sezione chiamata RIEPILOGO_ORDINE con testo pronto per WhatsApp. Se non emerge, non aggiungere il riepilogo."}`
              }
            ]
          }
        ]
      })
    });
  } catch {
    return Response.json(fallbackReply(messages, tenant, { source: "fallback_timeout" }));
  } finally {
    clearTimeout(timeout);
  }

  if (!openAIResponse.ok) {
    return Response.json(
      fallbackReply(messages, tenant, {
        source: "fallback_openai_error",
        openaiStatus: openAIResponse.status
      })
    );
  }

  const data = await openAIResponse.json();
  const outputText =
    data.output_text ||
    data.output?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n") ||
    "";
  const [replyPart, orderPart] = outputText.split("RIEPILOGO_ORDINE");

  return Response.json({
    reply: replyPart.trim() || outputText,
    orderDraft: isFrancesca ? undefined : orderPart?.replace(/^[:\s-]+/, "").trim(),
    source: "openai"
  });
}
