export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin-login",
          "/platform",
          "/dashboard",
          "/client-login",
          "/client-area"
        ]
      }
    ],
    sitemap: "https://www.avatarone.it/sitemap.xml",
    host: "https://www.avatarone.it"
  };
}
