import CustomAvatar from "./custom-avatar";
import { getAvatarClientBySlug, getAvatarKnowledgeText } from "../../lib/supabase-server";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (slug === "custom-elisa-gmwug") return { title: "Ilaria · AvatarOne" };
  try {
    const avatar = await getAvatarClientBySlug(slug);
    const name = avatar?.spoken_avatar_name || avatar?.avatar_name || "Persona digitale";
    return {
      title: `${name} · AvatarOne`,
      description: `${name}, persona digitale AI di ${avatar?.company_name || "AvatarOne"}.`
    };
  } catch {
    return { title: "Persona digitale · AvatarOne" };
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
