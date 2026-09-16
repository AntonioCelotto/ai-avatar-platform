const SANDBOX_AVATAR_ID = "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0";
const SANDBOX_CONTEXT_ID = "158f5d55-2d4f-11f1-8d28-066a7fa2e369";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function requestLiveAvatar(path, apiKey, options = {}) {
  const response = await fetch(`https://api.liveavatar.com${path}`, {
    ...options,
    headers: {
      "X-API-KEY": apiKey,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || `LiveAvatar non disponibile (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function POST() {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) return Response.json({ error: "Il collegamento vocale LiveAvatar non è ancora attivo su questa pubblicazione." }, { status: 503 });

  try {
    const customAvatarId = process.env.LIVEAVATAR_AVATAR_ID?.trim();
    const customContextId = process.env.LIVEAVATAR_CONTEXT_ID?.trim();
    const sandbox = !customAvatarId || !customContextId;
    const contextId = sandbox ? SANDBOX_CONTEXT_ID : customContextId;
    const avatarId = customAvatarId || SANDBOX_AVATAR_ID;
    const data = await requestLiveAvatar("/v2/embeddings", apiKey, {
      method: "POST",
      body: JSON.stringify({ avatar_id: avatarId, context_id: contextId, is_sandbox: sandbox })
    });
    if (!data?.data?.url) throw new Error("LiveAvatar non ha restituito il collegamento alla sessione.");
    return Response.json({
      url: data.data.url,
      sandbox,
      mode: sandbox ? "sandbox" : "ettore",
      message: sandbox ? "Demo LiveAvatar attiva con avatar e contesto di prova." : "Ettore Live è attivo con il contesto New Digital App."
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Impossibile collegarsi a LiveAvatar." }, { status: error?.status || 502 });
  }
}
