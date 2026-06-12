const tenants = [
  {
    slug: "new-digital-app",
    name: "New Digital App",
    assistantName: "Mia",
    website: "https://www.newdigitalapp.com",
    knowledge: [
      {
        title: "Prodotto",
        text:
          "New Digital App crea avatar AI parlanti per aziende. L'assistente puo' essere installato su siti, app o interfacce dedicate."
      },
      {
        title: "Apprendimento",
        text:
          "L'avatar deve poter imparare da sito web, documenti PDF e integrazioni API con gestionali, CRM, cataloghi o database del cliente."
      },
      {
        title: "Configurazione avatar",
        text:
          "Ogni cliente potra' configurare nome, genere visivo, carattere e tono dell'assistente. Esempi di tono: educato, professionale, diretto, empatico."
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
    `Sito ufficiale collegato: ${tenant.website}`,
    "Informazioni confermate:",
    knowledge,
    "Regole: rispondi in modo breve, concreto e utile. Quando mancano dati specifici, dillo chiaramente e proponi il prossimo passo."
  ].join("\n");
}

function fallbackReply(messages, tenant, extra = {}) {
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const orderDraft = `Nuova richiesta per ${tenant.name}:\n${lastUserMessage}`;

  return {
    reply:
      "Posso aiutarti a capire come configurare l'avatar AI, collegarlo a sito, documenti o API e preparare una richiesta da inviare su WhatsApp.",
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
          "Rispondi in italiano, in modo naturale, professionale e facile da capire da smartphone.",
          "Usa prima il contesto confermato. Puoi usare conoscenza generale per spiegare concetti AI, siti web, API e documenti.",
          "Non promettere integrazioni gia' completate se sono ancora future.",
          "Quando l'utente vuole essere ricontattato o preparare una richiesta, proponi un riepilogo chiaro per WhatsApp."
        ].join("\n"),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${buildContext(tenant)}\n\nConversazione recente:\n${transcript}\n\nRispondi al cliente. Se dalla conversazione emerge una richiesta commerciale o operativa, alla fine aggiungi una sezione chiamata RIEPILOGO_ORDINE con testo pronto per WhatsApp.`
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
