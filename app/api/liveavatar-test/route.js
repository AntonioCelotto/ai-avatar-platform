import { isAdminRequest } from "../../lib/admin-auth";

const SANDBOX_AVATAR_ID = "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a";

export async function POST(request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Accesso amministratore richiesto." }, { status: 401 });
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) return Response.json({ error: "Chiave LiveAvatar non configurata." }, { status: 503 });
  let payload = {};
  try { payload = await request.json(); } catch { return Response.json({ error: "JSON non valido." }, { status: 400 }); }
  // Sandbox is the only permitted mode until an admin explicitly configures a custom avatar.
  const sandbox = payload.sandbox !== false;
  const avatarId = sandbox ? SANDBOX_AVATAR_ID : String(payload.avatarId || "").trim();
  if (!sandbox && (!process.env.LIVEAVATAR_ENABLE_PAID_SESSIONS || process.env.LIVEAVATAR_ENABLE_PAID_SESSIONS !== "true")) {
    return Response.json({ error: "Sessioni a pagamento disabilitate: prova prima la sandbox." }, { status: 403 });
  }
  if (!avatarId) return Response.json({ error: "ID LiveAvatar mancante." }, { status: 400 });
  try {
    const response = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "LITE", avatar_id: avatarId, is_sandbox: sandbox }),
      cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || !result?.data?.session_token) {
      return Response.json({ error: result?.message || result?.error || "Impossibile creare la sessione LiveAvatar.", status: response.status }, { status: 502 });
    }
    return Response.json({ sessionToken: result.data.session_token, sessionId: result.data.session_id, sandbox }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "LiveAvatar non raggiungibile." }, { status: 502 });
  }
}
