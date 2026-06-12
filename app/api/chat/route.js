const tenants = [
  {
    slug: "trattoria-demo",
    name: "Trattoria Demo",
    assistantName: "Mia",
    menu: [
      {
        name: "Paccheri al pomodoro giallo",
        description: "Pasta di Gragnano con pomodoro giallo, basilico e ricotta salata.",
        price: 14,
        allergens: ["glutine", "latte"],
        tags: ["vegetariano", "primo"]
      },
      {
        name: "Tagliata di manzo",
        description: "Manzo alla griglia con rucola, grana e patate al forno.",
        price: 22,
        allergens: ["latte"],
        tags: ["secondo", "carne"]
      },
      {
        name: "Insalata mediterranea",
        description: "Misticanza, tonno, olive, pomodorini, cetrioli e mais.",
        price: 11,
        allergens: ["pesce"],
        tags: ["leggero", "senza glutine"]
      },
      {
        name: "Tiramisu della casa",
        description: "Mascarpone, caffe', savoiardi e cacao.",
        price: 6,
        allergens: ["glutine", "uova", "latte"],
        tags: ["dolce"]
      }
    ]
  }
];

function buildContext(tenant) {
  const menu = tenant.menu
    .map(
      (item) =>
        `- ${item.name}: ${item.description} Prezzo: ${item.price} euro. Allergeni: ${item.allergens.join(", ")}. Tag: ${item.tags.join(", ")}.`
    )
    .join("\n");

  return [
    `Ristorante: ${tenant.name}`,
    `Assistente: ${tenant.assistantName}`,
    "Menu:",
    menu,
    "Regole: rispondi solo con informazioni presenti, segnala allergeni, prepara riepiloghi ordine chiari per WhatsApp."
  ].join("\n");
}

function fallbackReply(messages, tenant, extra = {}) {
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const orderDraft = `Nuovo ordine demo per ${tenant.name}:\n${lastUserMessage}`;

  return {
    reply:
      "Per la demo posso aiutarti con menu, allergeni e riepilogo ordine. Ho preparato una bozza che puoi inviare su WhatsApp. Quando colleghiamo OpenAI, questa risposta diventera' conversazionale e contestuale.",
    orderDraft,
    ...extra
  };
}

export async function POST(request) {
  const payload = await request.json();
  const tenant = tenants.find((item) => item.slug === (payload.tenantSlug || "trattoria-demo"));

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
          "Sei un assistente AI per un ristorante.",
          "Rispondi in italiano, in modo naturale, breve e utile.",
          "Usa prima il contesto del ristorante. Se una informazione non e' presente, dillo chiaramente.",
          "Quando il cliente vuole ordinare, proponi un riepilogo ordinato e chiedi conferma.",
          "Segnala sempre allergeni rilevanti quando parli di piatti.",
          "Non inventare disponibilita', prezzi o ingredienti non presenti nel contesto."
        ].join("\n"),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${buildContext(tenant)}\n\nConversazione recente:\n${transcript}\n\nRispondi al cliente. Se dalla conversazione emerge un ordine, alla fine aggiungi una sezione chiamata RIEPILOGO_ORDINE con testo pronto per WhatsApp.`
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
