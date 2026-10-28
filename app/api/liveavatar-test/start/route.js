import { isAdminRequest } from "../../../lib/admin-auth";

export async function POST(request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Accesso amministratore richiesto." }, { status: 401 });
  const key = process.env.LIVEAVATAR_API_KEY;
  if (!key) return Response.json({ error: "LiveAvatar non configurato." }, { status: 503 });
  try {
    const body = await request.json();
    if (!body.sessionToken || !body.sessionId) return Response.json({ error: "Sessione mancante." }, { status: 400 });
    const response = await fetch("https://api.liveavatar.com/v1/sessions/start", {
      method: "POST",
      headers: { Authorization: "Bearer " + body.sessionToken, "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: body.sessionId }),
      cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || !result?.data?.livekit_url || !result?.data?.livekit_client_token) return Response.json({ error: result?.message || "Avvio streaming non riuscito.", upstreamStatus: response.status }, { status: 502 });
    return Response.json({ livekitUrl: result.data.livekit_url, livekitToken: result.data.livekit_client_token, sessionId: result.data.session_id, wsUrl: result.data.ws_url, sandbox: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Errore di collegamento a LiveAvatar." }, { status: 502 }); }
}
