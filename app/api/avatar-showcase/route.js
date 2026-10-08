import { listAvatarClients } from "../../lib/supabase-server";

export const dynamic = "force-dynamic";

function cleanText(value, fallback, max = 180) {
  return String(value || fallback).replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET() {
  try {
    const clients = await listAvatarClients();
    const eligibleClients = (clients || [])
      .filter((client) => client.status === "active" && (client.avatar_video_url || client.avatar_poster_url))
      .filter((client) => !["sofia", "giulia", "marco", "ilaria", "francesca", "mia", "mia.ai"].includes(String(client.avatar_name || "").trim().toLowerCase()));

    const matches = (client, words) => {
      const searchable = [client.avatar_name, client.spoken_avatar_name, client.company_name, client.category, client.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return words.some((word) => searchable.includes(word));
    };

    const preferred = [
      eligibleClients.find((client) => matches(client, ["aurora", "aurosa", "hospitality", "hotel"])),
      eligibleClients.find((client) => matches(client, ["capitano", "nautica", "nautico", "barca", "yacht", "bordo"]))
    ].filter(Boolean);

    const avatars = [...preferred, ...eligibleClients.slice().reverse()]
      .filter((client, index, list) => list.findIndex((item) => item.id === client.id) === index)
      .slice(0, 2)
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
