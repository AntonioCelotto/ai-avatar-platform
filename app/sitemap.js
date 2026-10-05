export default function sitemap() {
  const baseUrl = "https://www.avatarone.it";
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/hotel`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/benessere`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/ristorazione`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/immobiliare`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/mia`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 }
  ];
}
