import { avatarSrc } from "./avatar-data";

const mediaStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 8%",
  filter: "saturate(1.03) contrast(1.02)",
  background: "#050505"
};

export function AvatarVideo() {
  return <img alt="" src={avatarSrc} style={mediaStyle} />;
}
