import { getAvatarClientBySlug } from "../../../lib/supabase-server";

export async function GET(request, { params }) {
  const { slug } = await params;
  const avatar = await getAvatarClientBySlug(slug).catch(() => null);
  if (!avatar || avatar.status !== "active") return Response.json({ error: "Avatar non disponibile" }, { status: 404 });
  const name = String(avatar.spoken_avatar_name || avatar.avatar_name || "AvatarOne").slice(0, 45);
  return Response.json({
    id: "/avatar/" + encodeURIComponent(slug),
    name: name + " · AvatarOne",
    short_name: name.slice(0, 24),
    description: "Parla con " + name + " su AvatarOne",
    start_url: "/avatar/" + encodeURIComponent(slug) + "?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06121e",
    theme_color: "#06121e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" } });
}
