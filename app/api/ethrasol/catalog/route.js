import { searchProducts, getProduct } from "../../../lib/ethrasol-catalog.js";
import { enforceRateLimit } from "../../../lib/rate-limit.js";

export async function GET(request) {
  const limited = enforceRateLimit(request,"ethrasol-catalog",{limit:60,windowMs:60_000});
  if (limited) return limited;
  const url = new URL(request.url);
  try {
    const id = url.searchParams.get("id");
    if (id) {
      const product = await getProduct(id);
      return Response.json(product ? {product} : {error:"Articolo non trovato"},{status:product?200:404,headers:{"Cache-Control":"no-store"}});
    }
    const query = String(url.searchParams.get("q") || "").slice(0,160);
    const category = String(url.searchParams.get("category") || "").slice(0,80);
    return Response.json({products:await searchProducts(query,category),query},{headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"Il catalogo non è disponibile. Riprova tra poco."},{status:502,headers:{"Cache-Control":"no-store"}}); }
}
