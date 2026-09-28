import { isAdminRequest } from "../../lib/admin-auth";
import { deleteAvatarClient, getAvatarClientBySlug, updateAvatarClient } from "../../lib/supabase-server";

function unauthorized(request) {
  return isAdminRequest(request) ? null : Response.json({ error: "Accesso amministratore richiesto." }, { status: 401 });
}

export async function PATCH(request) {
  const authError = unauthorized(request); if (authError) return authError;
  let payload; try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const slug = String(payload.slug || "").trim();
  const current = await getAvatarClientBySlug(slug);
  if (!current?.id) return Response.json({ error: "Persona digitale non trovata." }, { status: 404 });

  const allowedStatus = ["active", "paused", "draft"];
  const changes = {
    company_name: String(payload.companyName || current.company_name).trim().slice(0, 120),
    category: String(payload.category || current.category || "Assistente digitale").trim().slice(0, 80),
    spoken_avatar_name: String(payload.name || current.spoken_avatar_name || current.avatar_name).trim().slice(0, 50),
    avatar_name: String(payload.name || current.avatar_name).trim().slice(0, 50),
    website: String(payload.website || "").trim() || null,
    whatsapp_phone: String(payload.whatsappPhone || "").replace(/\D/g, "").slice(0, 20) || null,
    liveavatar_avatar_id: String(payload.liveAvatarId || "").trim().slice(0, 160) || null,
    media_mode: ["image", "video", "liveavatar", "placeholder"].includes(payload.mediaMode) ? payload.mediaMode : current.media_mode,
    status: allowedStatus.includes(payload.status) ? payload.status : current.status,
    updated_at: new Date().toISOString()
  };
  const saved = await updateAvatarClient(slug, changes);
  return Response.json({ ok: true, avatar: saved });
}

export async function DELETE(request) {
  const authError = unauthorized(request); if (authError) return authError;
  let payload; try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const slug = String(payload.slug || "").trim();
  if (["new-digital-app", "demo-cliente-01"].includes(slug)) return Response.json({ error: "MIA e Francesca non possono essere eliminate." }, { status: 400 });
  const deleted = await deleteAvatarClient(slug);
  return Response.json({ ok: deleted });
}
