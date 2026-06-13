import { avatarVideoSrc } from "../../avatar-video-data";

export const dynamic = "force-static";

export function GET() {
  const base64 = avatarVideoSrc.split(",")[1] || "";
  const video = Buffer.from(base64, "base64");

  return new Response(video, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(video.length),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
