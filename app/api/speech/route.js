function cleanSpeechInput(input) {
  return String(input || "")
    .replace(/RIEPILOGO_ORDINE[\s\S]*/g, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/[>#_~]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

async function generateSpeechResponse(input) {
  if (!input) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OpenAI key not configured" }, { status: 503 });
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "marin",
      input,
      instructions:
        "Voce femminile italiana naturale, calda e professionale. Parla come un'assistente digitale elegante, con ritmo fluido e senza leggere simboli o formattazioni.",
      response_format: "mp3"
    })
  });

  if (!response.ok) {
    return Response.json(
      { error: "Speech generation failed", status: response.status },
      { status: 502 }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store"
    }
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return generateSpeechResponse(cleanSpeechInput(searchParams.get("text")));
}

export async function POST(request) {
  const payload = await request.json();
  return generateSpeechResponse(cleanSpeechInput(payload.text));
}
