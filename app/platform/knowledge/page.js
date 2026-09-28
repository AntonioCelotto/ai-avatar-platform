import { isSupabaseConfigured, listAvatarClients } from "../../lib/supabase-server";
import KnowledgeManager from "./knowledge-manager";
import "../platform.css";

export default async function KnowledgeCenterPage({ searchParams }) {
  const params = await searchParams;
  const clients = isSupabaseConfigured() ? await listAvatarClients() : [];
  const selectedSlug = params?.client || clients?.[0]?.slug || "new-digital-app";
  return <KnowledgeManager clients={clients} initialSlug={selectedSlug} />;
}
