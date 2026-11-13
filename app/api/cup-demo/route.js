import { getAvatarClientBySlug } from "../../lib/supabase-server";
import { demoCupQuery, DEMO_SLUG } from "../../lib/cup-demo";
import { enforceRateLimit } from "../../lib/rate-limit";
import { randomBytes } from "node:crypto";
const URL=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const table="avatar_cup_demo_bookings";
async function db(path,method="GET",body) {
 if(!URL||!KEY)throw Error("Database not configured");
 const response=await fetch((URL.endsWith("/")?URL.slice(0,-1):URL)+"/rest/v1/"+table+path,{method,headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json",Prefer:"return=representation"},body:body?JSON.stringify(body):undefined,cache:"no-store"});
 if(!response.ok)throw Error("Database operation failed "+response.status);
 return response.json();
}
async function authorize(slug) {
 if(slug!==DEMO_SLUG)return false;
 const a=await getAvatarClientBySlug(slug).catch(()=>null);
 return !!(a?.status==="active"&&a?.commercial_status!=="suspended");
}
const fail=(message,status=400)=>Response.json({error:message,demo:true},{status});
const codeValid=(code)=>/^DEMO-[A-F0-9]{24}$/.test(code);
export async function GET(request) {
 const limited=enforceRateLimit(request,"cup-demo",{limit:30,windowMs:60000});if(limited)return limited;
 const u=new URL(request.url),slug=u.searchParams.get("slug");
 const action=u.searchParams.get("action")||"services";
 if(slug===DEMO_SLUG&&["services","availability","directions","ticket"].includes(action))return Response.json(demoCupQuery({action,service:u.searchParams.get("service")||""}),{headers:{"Cache-Control":"no-store"}});
 if(!await authorize(slug))return fail("Demo non disponibile",404);
 if(action==="booking"){
  const code=String(u.searchParams.get("code")||"").toUpperCase();
  if(!codeValid(code))return fail("Codice prenotazione non valido");
  try {const rows=await db("?booking_code=eq."+encodeURIComponent(code)+"&select=booking_code,service_id,appointment_at,ticket_amount,ticket_status,booking_status&limit=1");return rows.length?Response.json({demo:true,booking:rows[0]}):fail("Prenotazione non trovata",404)}catch{return fail("Servizio temporaneamente non disponibile",503)}
 }
 if(!["services","availability","directions","ticket"].includes(action))return fail("Azione non valida");
 return Response.json(demoCupQuery({action,service:u.searchParams.get("service")||""}),{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request) {
 const limited=enforceRateLimit(request,"cup-demo-write",{limit:10,windowMs:60000});if(limited)return limited;
 let p;try{p=await request.json()}catch{return fail("Richiesta non valida")}
 if(!await authorize(p?.slug))return fail("Demo non disponibile",404);
 const action=String(p.action||"");
 try{
  if(action==="book"){
   if(p.confirm!==true)return fail("Conferma esplicita richiesta");
   const service=demoCupQuery({action:"availability",service:String(p.service||"")}).results.find(x=>x.service.toLowerCase()===String(p.service||"").toLowerCase());
   const slot=String(p.slot||"");
   if(!service||!service.slots.includes(slot))return fail("Prestazione o orario non disponibile");
   const code="DEMO-"+randomBytes(12).toString("hex").toUpperCase();
   const rows=await db("", "POST",{booking_code:code,avatar_slug:DEMO_SLUG,service_id:service.service,appointment_at:slot,ticket_amount:service.ticketEUR});
   return Response.json({demo:true,booking:rows[0],message:"Prenotazione dimostrativa confermata. Conserva il codice."});
  }
  if(["pay","cancel"].includes(action)){
   const code=String(p.code||"").toUpperCase();
   if(!codeValid(code)||p.confirm!==true)return fail("Codice valido e conferma esplicita richiesti");
   const existing=await db("?booking_code=eq."+encodeURIComponent(code)+"&select=booking_status,ticket_status&limit=1");
   if(!existing.length)return fail("Prenotazione non trovata",404);
   if(existing[0].booking_status!=="confirmed")return fail("Prenotazione annullata");
   if(action==="pay"&&existing[0].ticket_status==="paid_demo")return fail("Ticket demo già pagato");
   const changes=action==="pay"?{ticket_status:"paid_demo",updated_at:new Date().toISOString()}:{booking_status:"cancelled",updated_at:new Date().toISOString()};
   const rows=await db("?booking_code=eq."+encodeURIComponent(code),"PATCH",changes);
   return Response.json({demo:true,booking:rows[0],message:action==="pay"?"Pagamento simulato completato: nessun addebito reale.":"Prenotazione dimostrativa annullata."});
  }
  return fail("Azione non valida");
 }catch{return fail("Operazione demo temporaneamente non disponibile",503)}
}
