import { avatarVideoSrc } from "../../avatar-video-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base64 = avatarVideoSrc.split(",")[1] || "";
const video = Buffer.from(base64, "base64");

export function GET(request) {
  const range = request.headers.get("range");
  const headers = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": "video/mp4"
  };

  if (!range) {
    return new Response(video, {
      headers: {
        ...headers,
        "Content-Length": String(video.length)
      }
    });
  }

  const match = range.match(/bytes=(\d*)-(\d*)/);
  if (!match) {
    return new Response(video, {
      headers: {
        ...headers,
        "Content-Length": String(video.length)
      }
    });
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : video.length - 1;
  const safeEnd = Math.min(end, video.length - 1);
  const chunk = video.subarray(start, safeEnd + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      ...headers,
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${start}-${safeEnd}/${video.length}`
    }
  });
}
