import CustomAvatar from "./custom-avatar";
import { getAvatarClientBySlug, getAvatarKnowledgeText } from "../../lib/supabase-server";

export default async function CustomAvatarPage({ params }) {
  const { slug } = await params;
  let cloudAvatar = null;
  try {
    cloudAvatar = await getAvatarClientBySlug(slug);
    if (cloudAvatar?.id) cloudAvatar.website_knowledge = await getAvatarKnowledgeText(cloudAvatar.id);
  } catch {}
  return <CustomAvatar slug={slug} initialAvatar={cloudAvatar} />;
}
