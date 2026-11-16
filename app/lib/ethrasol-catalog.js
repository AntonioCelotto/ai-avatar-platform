// Public Ethrasol catalogue only: the publishable key preserves database RLS.
export const ETHRASOL_SLUG = "twenty-seven-ethra-sol";
export const ETHRASOL_URL = "https://ethrasol.it/?rete=mc";
const DATABASE = "https://ambsotujefpcpxtmmqon.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_woNFroTOqw3ROH90gwqdpA_gYgtyHXQ";
const FIELDS = "id,code,name,category,subcategory,brand,description,unit,reference_price,quote_only,image_url,manufacturer_code";
export const CATEGORIES = ["Fotovoltaico ed energia", "Termico e riscaldamento", "Serramenti e schermature", "Isolanti", "Conglomerati e ceramici", "Lapidei e leganti", "Carpenteria metallica", "Materiali legnosi", "Impermeabilizzanti", "Materiali compositi", "Finiture"];

export function safeImage(value) {
  try {
    const url = new URL(String(value || ""), "https://ethrasol.it");
    return value && url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}

export function publicProduct(row) {
  // Explicit allowlist: never forward arbitrary database columns to the model or client.
  return {
    id: row.id, code: row.code, name: row.name, category: row.category,
    subcategory: row.subcategory || "", brand: row.brand || "",
    description: String(row.description || "").slice(0, 4000), unit: row.unit || "",
    manufacturerCode: row.manufacturer_code || "", image: safeImage(row.image_url),
    price: !row.quote_only && Number(row.reference_price) > 0 ? Number(row.reference_price) : null,
    quoteOnly: Boolean(row.quote_only) || !(Number(row.reference_price) > 0)
  };
}

function searchTerms(query) {
  const stop = new Set("fammi mi fai vedere mostra mostrami vorrei cerco cerca prodotto prodotti articolo articoli dei delle della del gli le con per una uno un che avete catalogo pannelli pannello moduli modulo".split(" "));
  let terms = String(query || "").toLowerCase().match(/[a-z0-9àèéìòù][a-z0-9àèéìòù-]{1,44}/g) || [];
  terms = terms.filter(term => !stop.has(term)).slice(0, 5);
  const synonyms = {fotovoltaici:"fotovolta",fotovoltaico:"fotovolta",solari:"solar",inverter:"inverter",batterie:"batter",batteria:"batter",accumulo:"accumul",serramenti:"serrament",isolanti:"isolant"};
  terms = terms.map(term => synonyms[term] || term);
  if (!terms.length && /pannell|modul/i.test(query)) terms = ["modul", "pannell"];
  return [...new Set(terms)];
}

async function read(params, fetchImpl) {
  const url = new URL(`${DATABASE}/rest/v1/products`);
  url.search = new URLSearchParams({ select: FIELDS, active: "eq.true", ...params });
  const response = await fetchImpl(url, { headers: { apikey: PUBLISHABLE_KEY }, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Catalogo Ethrasol temporaneamente non disponibile");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Risposta catalogo non valida");
  return rows.map(publicProduct);
}

export async function searchProducts(query = "", category = "", fetchImpl = fetch) {
  const terms = searchTerms(query);
  const filters = terms.flatMap(term => ["name", "code", "manufacturer_code", "brand", "category", "subcategory", "description"].map(field => `${field}.ilike.*${term}*`));
  const params = { limit: "48", order: "brand.asc,name.asc" };
  if (filters.length) params.or = `(${filters.join(",")})`;
  if (CATEGORIES.includes(category)) params.category = `eq.${category}`;
  const products = await read(params, fetchImpl);
  const score = p => terms.reduce((n,term) => n + (String(p.name).toLowerCase().includes(term) ? 8 : 0) + (String(p.manufacturerCode).toLowerCase().includes(term) ? 7 : 0) + (String(p.brand).toLowerCase().includes(term) ? 5 : 0) + (`${p.description} ${p.category} ${p.subcategory}`.toLowerCase().includes(term) ? 1 : 0), 0);
  return products.sort((a,b) => score(b) - score(a) || Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, 12);
}

export async function getProduct(id, fetchImpl = fetch) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(id))) return null;
  return (await read({ id: `eq.${id}`, limit: "1" }, fetchImpl))[0] || null;
}
