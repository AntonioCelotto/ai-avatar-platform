import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request, { params }) {
  const { size } = await params;
  const dimension = size === "192" ? 192 : size === "512" ? 512 : null;
  if (!dimension) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#06112f,#02081a)", borderRadius: dimension * .2, position: "relative" }}>
      <svg width="82%" height="82%" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f0ffff"/><stop offset=".36" stopColor="#77dfff"/><stop offset=".72" stopColor="#1682ff"/><stop offset="1" stopColor="#03e2f1"/></linearGradient>
        </defs>
        <path d="M112 362 232 139Q256 93 280 139L400 362" fill="none" stroke="url(#a)" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="256" cy="331" r="39" fill="#00cfff"/>
      </svg>
    </div>,
    { width: dimension, height: dimension, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
