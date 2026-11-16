/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), usb=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
      ]
    }, {
      source: "/((?!experience/ethrasol/?$).*)",
      headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }]
    }, {
      source: "/experience/ethrasol",
      headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self' https://ethrasol.it https://www.ethrasol.it" }]
    }];
  }
};

export default nextConfig;
