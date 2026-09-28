import {
  ADMIN_COOKIE,
  adminCookieHeader,
  createAdminToken,
  isAdminRequest,
  validateAdminCredentials
} from "../../lib/admin-auth";

export async function GET(request) {
  return Response.json({ authenticated: isAdminRequest(request) });
}

export async function POST(request) {
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  if (!validateAdminCredentials(payload.email, payload.password)) {
    return Response.json({ error: "Email o password non corretti." }, { status: 401 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": adminCookieHeader(createAdminToken()) }
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
  });
}
