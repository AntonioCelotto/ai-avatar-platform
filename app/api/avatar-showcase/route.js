import { listAvatarClients } from "../../lib/supabase-server";

export const dynamic = "force-dynamic";

function cleanText(value, fallback, max = 180) {
  return String(value || fallback).replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET() {
  try {
    const clients = await listAvatarClients();
    const avatars = (clients || [])
      .filter((client) => client.status === "active" && (client.avatar_video_url || client.avatar_poster_url))
      .filter((client) => !["sofia", "giulia", "marco", "ilaria", "francesca"].includes(String(client.avatar_name || "").trim().toLowerCase()))
      .slice(-2)
      .reverse()
      .map((client) => ({
        name: cleanText(client.avatar_name, "AVATAR", 32).toUpperCase(),
        sector: cleanText(client.category, "Assistente AI", 38),
        video: client.avatar_video_url || "",
        poster: client.avatar_poster_url || "",
        question: "Come puoi aiutarmi?",
        answer: cleanText(client.welcome_message, `Sono ${client.avatar_name || "il tuo assistente digitale"} e sono qui per aiutarti.`, 190)
      }));
    return Response.json({ avatars }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return Response.json({ avatars: [] });
  }
}
