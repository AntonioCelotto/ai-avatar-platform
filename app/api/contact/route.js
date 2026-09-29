import { insertCommercialLead } from "../../lib/supabase-server";
import { enforceRateLimit, requestIp } from "../../lib/rate-limit";

const PHONE = String(process.env.WHATSAPP_ORDER_PHONE || "393457980259").replace(/\D/g, "");

export async function POST(request) {
  const limited = enforceRateLimit(request, "contact", { limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const name = String(payload.name || "").trim().slice(0, 100);
  const company = String(payload.company || "").trim().slice(0, 140);
  const email = String(payload.email || "").trim().toLowerCase().slice(0, 180);
  const phone = String(payload.phone || "").replace(/[^\d+]/g, "").slice(0, 24);
  const category = String(payload.category || "").trim().slice(0, 100);
  const plan = String(payload.plan || "Da definire").trim().slice(0, 80);
  const message = String(payload.message || "").trim().slice(0, 1500);
  const consent = payload.consent === true;
  if (!name || !company || !email || !phone || !consent) return Response.json({ error: "Compila i campi obbligatori e accetta la privacy." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Inserisci un indirizzo email valido." }, { status: 400 });
  try {
    await insertCommercialLead({ name, company, email, phone, category, plan, message, source: "website", ip: requestIp(request) });
  } catch {}
  const text = [
    "Ciao Antonio, vorrei un preventivo per un Avatar AI.",
    `Nome: ${name}`,
    `Azienda: ${company}`,
    `Email: ${email}`,
    `Telefono: ${phone}`,
    category ? `Settore: ${category}` : "",
    `Pacchetto: ${plan}`,
    message ? `Richiesta: ${message}` : ""
  ].filter(Boolean).join("\n");
  return Response.json({ ok: true, whatsappUrl: `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}` });
}
