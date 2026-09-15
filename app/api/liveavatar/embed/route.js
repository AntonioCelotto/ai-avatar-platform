const SANDBOX_AVATAR_ID = "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0";
const SANDBOX_CONTEXT_ID = "158f5d55-2d4f-11f1-8d28-066a7fa2e369";

export async function POST() {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) return Response.json({ error: "LIVEAVATAR_API_KEY non configurata su questo ambiente." }, { status: 503 });

  try {
    const response = await fetch("https://api.liveavatar.com/v2/embeddings", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_id: SANDBOX_AVATAR_ID, context_id: SANDBOX_CONTEXT_ID, is_sandbox: true }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.data?.url) {
      return Response.json({ error: data?.message || `LiveAvatar non disponibile (${response.status}).` }, { status: response.status || 502 });
    }
    return Response.json({ url: data.data.url, sandbox: true });
  } catch {
    return Response.json({ error: "Impossibile collegarsi a LiveAvatar." }, { status: 502 });
  }
}
