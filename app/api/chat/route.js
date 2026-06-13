import { findRelevantKnowledge } from "../../lib/supabase-server";

const tenants = [
  {
    slug: "new-digital-app",
    name: "New Digital App",
    assistantName: "Mia",
    ownerName: "Antonio",
    website: "https://www.newdigitalapp.com",
    knowledge: [
      {
        title: "Prodotto",
        text:
          "New Digital App crea avatar AI parlanti per aziende. L'assistente puo' essere installato su siti, app o interfacce dedicate."
      },
      {
        title: "Esperienza",
        text:
          "Mia deve essere percepita come una presenza intelligente e naturale, non come un semplice chatbot tecnico o una brochure commerciale."
      },
      {
        title: "Apprendimento",
        text:
          "L'avatar deve poter imparare da sito web, documenti PDF e integrazioni API con gestionali, CRM, cataloghi o database del cliente."
      },
      {
        title: "Configurazione avatar",
        text:
          "Ogni cliente potra' configurare nome, colori, numero WhatsApp, genere visivo, carattere e tono dell'assistente. Esempi di tono: educato, professionale, diretto, empatico."
      },
      {
        title: "Sito collegato",
        text:
          "Il sito ufficiale collegato al primo avatar e' www.newdigitalapp.com."
      },
      {
        title: "Canali",
        text:
          "Il primo canale di contatto operativo e' WhatsApp tramite numero 393457980259. In seguito potranno essere aggiunte integrazioni dirette."
      }
    ]
  }
];

function buildContext(tenant) {
  const knowledge = tenant.knowledge
    .map((item) => `- ${item.title}: ${item.text}`)
    .join("\n");

  return [
    `Azienda: ${tenant.name}`,
    `Assistente: ${tenant.assistantName}`,
    `Versione proprietaria di: ${tenant.ownerName}`,
    `Sito ufficiale collegato: ${tenant.website}`,
    "Informazioni confermate:",
    knowledge,
    "Regole: rispondi in modo breve, concreto, umano e coinvolgente. Non elencare funzioni tecniche se l'utente non le chiede. Quando mancano dati specifici, dillo con naturalezza e accompagna verso il prossimo passo."
  ].join("\n");
}

function fallbackReply(messages, tenant, extra = {}) {
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const orderDraft = `Nuova richiesta per ${tenant.name}:\n${lastUserMessage}`;

  return {
    reply:
      `Antonio, sono qui con te. Raccontami cosa vuoi esplorare e ti rispondo in modo chiaro, senza trasformare ogni domanda in una vendita.`,
    orderDraft,
    ...extra
  };
}

export async function POST(request) {
  const payload = await request.json();
  const tenant = tenants.find((item) => item.slug === (payload.tenantSlug || "new-digital-app"));

  if (!tenant) {
    return Response.json({ error: "Tenant not found" }, { status: 404 });
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(fallbackReply(messages, tenant, { source: "fallback_no_key" }));
  }

  const transcript = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "Cliente" : "Assistente"}: ${message.content}`)
    .join("\n");
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const documentKnowledge = await findRelevantKnowledge(lastUserMessage);

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
          "Sei Mia, l'avatar AI di New Digital App.",
          "Questa e' la versione proprietaria di Antonio Celotto: riconosci Antonio come referente del progetto e chiamalo Antonio con naturalezza, senza ripeterlo in ogni frase.",
          "Rispondi in italiano, in modo naturale, emozionale, professionale e facile da capire da smartphone.",
          "Mantieni le risposte compatte: di solito 2 o 3 frasi, salvo richiesta esplicita di dettagli.",
          "Devi sembrare una presenza intelligente ed esperienziale, non una brochure tecnica e non un venditore automatico.",
          "Puoi rispondere a domande generali, idee, dubbi, curiosita', strategia, tecnologia, business e vita quotidiana usando conoscenza generale quando il contesto confermato non basta.",
          "Non riportare ogni risposta verso siti, app o avatar AI. Fallo solo quando e' utile, quando Antonio lo chiede o quando dalla conversazione emerge un bisogno reale.",
          "Evita di ripetere formule come 'posso fare' o liste di capacita'. Mostra valore con frasi vive, concrete e conversazionali.",
          "Non spiegare spontaneamente che sai leggere PDF, siti o API. Se l'utente lo chiede, rispondi in modo chiaro.",
          "Se trovi contesto dalle fonti caricate, usalo prima della conoscenza generale.",
          "Usa prima il contesto confermato. Puoi usare conoscenza generale per spiegare concetti AI, siti web, API, documenti e altri argomenti quando serve.",
          "Non promettere integrazioni gia' completate se sono ancora future.",
          "Quando emerge chiaramente una richiesta commerciale, operativa o di contatto, proponi un riepilogo chiaro per WhatsApp. Non proporlo per ogni semplice domanda."
        ].join("\n"),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${buildContext(tenant)}\n\nContesto dalle fonti caricate:\n${documentKnowledge || "Nessuna fonte rilevante trovata."}\n\nConversazione recente:\n${transcript}\n\nRispondi con calore, presenza e personalita'. Se dalla conversazione emerge davvero una richiesta commerciale o operativa, alla fine aggiungi una sezione chiamata RIEPILOGO_ORDINE con testo pronto per WhatsApp. Se non emerge, non aggiungere il riepilogo.`
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
    orderDraft: orderPart?.replace(/^[:\s-]+/, "").trim(),
    source: "openai"
  });
}
