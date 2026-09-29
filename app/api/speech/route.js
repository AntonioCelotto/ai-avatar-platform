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

function getElevenLabsVoiceId(tenantSlug) {
  if (tenantSlug === "demo-cliente-01") {
    return process.env.ELEVENLABS_FRANCESCA_VOICE_ID || "EnMjgV8GaKfSk1f0AlV9";
  }

  return process.env.ELEVENLABS_VOICE_ID || "";
}

async function callElevenLabs(input, tenantSlug) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = getElevenLabsVoiceId(tenantSlug);

  if (!apiKey || !voiceId) {
    return {
      ok: false,
      reason: !apiKey ? "missing_elevenlabs_api_key" : "missing_voice_id",
      hasApiKey: Boolean(apiKey),
      voiceId
    };
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text: input,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch {
      body = "";
    }

    return {
      ok: false,
      reason: "elevenlabs_http_error",
      status: response.status,
      body: body.slice(0, 500),
      hasApiKey: true,
      voiceId
    };
  }

  return {
    ok: true,
    response,
    voiceId,
    hasApiKey: true
  };
}

async function generateElevenLabsSpeech(input, tenantSlug) {
  const result = await callElevenLabs(input, tenantSlug);
  if (!result.ok) return null;

  return new Response(result.response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Speech-Provider": "elevenlabs"
    }
  });
}

async function generateOpenAISpeech(input, requestedVoice = "") {
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
      voice: ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"].includes(requestedVoice) ? requestedVoice : (process.env.OPENAI_TTS_VOICE || "marin"),
      input,
      instructions:
        "Voce femminile italiana naturale, calda, sicura e professionale. Parla come una direttrice marketing elegante: ritmo fluido e leggermente dinamico, pause brevi, dizione spontanea, mai lenta o robotica. Non leggere simboli o formattazioni.",
      speed: 1.08,
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
      "Cache-Control": "no-store",
      "X-Speech-Provider": "openai"
    }
  });
}

async function generateSpeechDebug(input, tenantSlug = "") {
  const elevenLabsResult = await callElevenLabs(input || "Ciao sono Francesca", tenantSlug);

  return Response.json({
    tenantSlug,
    inputPresent: Boolean(input),
    elevenLabs: elevenLabsResult.ok
      ? {
          ok: true,
          provider: "elevenlabs",
          voiceId: elevenLabsResult.voiceId,
          hasApiKey: elevenLabsResult.hasApiKey
        }
      : {
          ok: false,
          reason: elevenLabsResult.reason,
          status: elevenLabsResult.status,
          body: elevenLabsResult.body,
          voiceId: elevenLabsResult.voiceId,
          hasApiKey: elevenLabsResult.hasApiKey
        }
  });
}

async function generateSpeechResponse(input, tenantSlug = "", provider = "", voiceId = "") {
  if (!input) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  if (tenantSlug === "demo-cliente-01") {
    const elevenLabsResponse = await generateElevenLabsSpeech(input, tenantSlug);
    if (elevenLabsResponse) return elevenLabsResponse;
  }

  return generateOpenAISpeech(input, voiceId);
}

export async function GET(request) {
  const limited = enforceRateLimit(request, "speech", { limit: 12, windowMs: 60_000 });
  if (limited) return limited;
  const { searchParams } = new URL(request.url);
  const input = cleanSpeechInput(searchParams.get("text"));
  const tenantSlug = searchParams.get("tenantSlug") || "";

  if (searchParams.get("debug") === "1") {
    if (!isAdminRequest(request)) return Response.json({ error: "Accesso amministratore richiesto." }, { status: 401 });
    return generateSpeechDebug(input, tenantSlug);
  }
  const avatar = await getAvatarClientBySlug(tenantSlug).catch(() => null);
  if (!avatar?.id || avatar.status !== "active") return Response.json({ error: "Avatar non disponibile." }, { status: 404 });
  const usage = await listUsageSummary(avatar.id).catch(() => ({}));
  if (Number(usage.speech || 0) + input.length > Number(avatar.monthly_speech_character_limit || 120000)) return Response.json({ error: "Limite mensile voce raggiunto." }, { status: 429 });
  insertUsageEvent({ clientId: avatar.id, eventType: "speech", units: input.length, metadata: { ip: requestIp(request) } }).catch(() => {});
  return generateSpeechResponse(input, tenantSlug, avatar.voice_provider || "", avatar.voice_id || "");
}

export async function POST(request) {
  const limited = enforceRateLimit(request, "speech", { limit: 12, windowMs: 60_000 });
  if (limited) return limited;
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const input = cleanSpeechInput(payload.text);
  const tenantSlug = String(payload.tenantSlug || "").slice(0, 80);
  const avatar = await getAvatarClientBySlug(tenantSlug).catch(() => null);
  if (!avatar?.id || avatar.status !== "active") return Response.json({ error: "Avatar non disponibile." }, { status: 404 });
  const usage = await listUsageSummary(avatar.id).catch(() => ({}));
  if (Number(usage.speech || 0) + input.length > Number(avatar.monthly_speech_character_limit || 120000)) return Response.json({ error: "Limite mensile voce raggiunto." }, { status: 429 });
  insertUsageEvent({ clientId: avatar.id, eventType: "speech", units: input.length, metadata: { ip: requestIp(request) } }).catch(() => {});
  return generateSpeechResponse(input, tenantSlug, avatar.voice_provider || "", avatar.voice_id || "");
}
import { getAvatarClientBySlug, insertUsageEvent, listUsageSummary } from "../../lib/supabase-server";
import { enforceRateLimit, requestIp } from "../../lib/rate-limit";
import { isAdminRequest } from "../../lib/admin-auth";
