import CustomAvatar from "./custom-avatar";

export default async function CustomAvatarPage({ params }) {
  const { slug } = await params;
  return <CustomAvatar slug={slug} />;
}
