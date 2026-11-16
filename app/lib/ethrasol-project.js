const URL = "https://ambsotujefpcpxtmmqon.supabase.co";
const KEY = "sb_publishable_woNFroTOqw3ROH90gwqdpA_gYgtyHXQ";
export const MAX_PROJECT_BYTES = 2 * 1024 * 1024;

export async function authenticateEthrasol(request, fetchImpl = fetch) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer [A-Za-z0-9_.-]{40,8000}$/.test(authorization)) throw Object.assign(new Error("Accedi al gestionale per analizzare il progetto."), {status:401});
  const headers = {apikey:KEY,Authorization:authorization};
  const userResponse = await fetchImpl(`${URL}/auth/v1/user`,{headers,cache:"no-store",signal:AbortSignal.timeout(8000)});
  if (!userResponse.ok) throw Object.assign(new Error("Sessione scaduta. Accedi nuovamente al gestionale."),{status:401});
  const user = await userResponse.json();
  if (!/^[a-f0-9-]{36}$/i.test(user.id || "")) throw Object.assign(new Error("Sessione non valida."),{status:401});
  const profileResponse = await fetchImpl(`${URL}/rest/v1/profiles?id=eq.${user.id}&select=id,active&limit=1`,{headers,cache:"no-store",signal:AbortSignal.timeout(8000)});
  if (!profileResponse.ok) throw Object.assign(new Error("Profilo non disponibile."),{status:403});
  const rows = await profileResponse.json();
  if (!rows?.[0]?.active) throw Object.assign(new Error("Profilo non attivo."),{status:403});
  return user.id;
}

export function projectContent(payload) {
  if (payload?.text && typeof payload.text === "string" && payload.text.length <= 60000) return [{type:"input_text",text:payload.text}];
  const f=payload?.file;
  if (!f || !["application/pdf","image/png","image/jpeg"].includes(f.type) || typeof f.data !== "string" || f.data.length > Math.ceil(MAX_PROJECT_BYTES/3)*4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(f.data)) throw Object.assign(new Error("Allega un PDF, JPG o PNG fino a 2 MB, oppure un foglio Excel."),{status:400});
  const bytes=Buffer.from(f.data,"base64");
  if (!bytes.length || bytes.length>MAX_PROJECT_BYTES) throw Object.assign(new Error("File vuoto o superiore a 2 MB."),{status:400});
  const magic=f.type==="application/pdf" ? bytes.subarray(0,5).toString()==="%PDF-" : f.type==="image/png" ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes[0]===255&&bytes[1]===216;
  if(!magic)throw Object.assign(new Error("Il contenuto del file non corrisponde al formato indicato."),{status:400});
  const dataUrl=`data:${f.type};base64,${f.data}`;
  return f.type==="application/pdf" ? [{type:"input_file",filename:String(f.name||"progetto.pdf").slice(0,150),file_data:dataUrl}] : [{type:"input_image",image_url:dataUrl,detail:"auto"}];
}

export const PROJECT_SCHEMA = {type:"object",additionalProperties:false,required:["title","summary","items","questions"],properties:{title:{type:"string"},summary:{type:"string"},items:{type:"array",items:{type:"object",additionalProperties:false,required:["description","quantity","unit","notes"],properties:{description:{type:"string"},quantity:{type:["number","null"]},unit:{type:"string"},notes:{type:"string"}}}},questions:{type:"array",items:{type:"string"}}}};

export function normalizeProject(data) {
  if (!data || !Array.isArray(data.items)) throw Error("Analisi non valida. Riprova con un documento più leggibile.");
  return {title:String(data.title||"Richiesta da progetto").slice(0,200),summary:String(data.summary||"").slice(0,6000),items:data.items.slice(0,40).map(r=>({description:String(r.description||"").slice(0,1000),quantity:typeof r.quantity==="number"&&Number.isFinite(r.quantity)&&r.quantity>0&&r.quantity<=1000000?r.quantity:null,unit:String(r.unit||"pz").slice(0,30),notes:String(r.notes||"").slice(0,1000)})).filter(r=>r.description),questions:Array.isArray(data.questions)?data.questions.slice(0,12).map(q=>String(q).slice(0,600)):[]};
}
