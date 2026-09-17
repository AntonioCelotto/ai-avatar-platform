import CustomAvatar from "./custom-avatar";
import { getAvatarClientBySlug } from "../../lib/supabase-server";

export default async function CustomAvatarPage({ params }) {
  const { slug } = await params;
  let cloudAvatar = null;
  try { cloudAvatar = await getAvatarClientBySlug(slug); } catch {}
  return <CustomAvatar slug={slug} initialAvatar={cloudAvatar} />;
}
