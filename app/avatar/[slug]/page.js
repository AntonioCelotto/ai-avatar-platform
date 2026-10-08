import CustomAvatar from "./custom-avatar";
import { getAvatarClientBySlug, getAvatarKnowledgeText } from "../../lib/supabase-server";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (slug === "custom-elisa-gmwug") return { title: "Ilaria · AvatarOne", openGraph: { images: ["/icon.svg"] }, twitter: { images: ["/icon.svg"] } };
  try {
    const avatar = await getAvatarClientBySlug(slug);
    const name = avatar?.spoken_avatar_name || avatar?.avatar_name || "Persona digitale";
    return {
      title: `${name} · AvatarOne`,
      description: `${name}, persona digitale AI di ${avatar?.company_name || "AvatarOne"}.`,
      openGraph: { title: `${name} · AvatarOne`, images: [{ url: "/icon.svg", alt: "AvatarOne" }] },
      twitter: { card: "summary_large_image", images: ["/icon.svg"] }
    };
  } catch {
    return { title: "Persona digitale · AvatarOne", openGraph: { images: ["/icon.svg"] }, twitter: { images: ["/icon.svg"] } };
  }
}

export default async function CustomAvatarPage({ params }) {
  const { slug } = await params;
  if (slug === "custom-elisa-gmwug") redirect("/avatar/ilaria");
  let cloudAvatar = null;
  try {
    cloudAvatar = await getAvatarClientBySlug(slug);
    if (cloudAvatar?.id) cloudAvatar.website_knowledge = await getAvatarKnowledgeText(cloudAvatar.id);
  } catch {}
  return <CustomAvatar slug={slug} initialAvatar={cloudAvatar} />;
}
