import { getAvatarClientBySlug, getAvatarKnowledgeText, insertUsageEvent, listUsageSummary } from "../../lib/supabase-server";
import { enforceRateLimit, requestIp } from "../../lib/rate-limit";
import { demoCupQuery, DEMO_SLUG } from "../../lib/cup-demo";

export async function POST(request) {
  const limited = enforceRateLimit(request, "custom-chat", { limit: 18, windowMs: 60_000 });
  if (limited) return limited;
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }
  const slug = String(payload?.slug || "").trim().slice(0, 80);
  if (!slug) return Response.json({ error: "Avatar non valido." }, { status: 400 });
  const avatar = await getAvatarClientBySlug(slug).catch(() => null);
  if (!avatar?.id || avatar.status !== "active") return Response.json({ error: "Avatar non disponibile." }, { status: 404 });
  if (avatar.commercial_status === "suspended") return Response.json({ error: "Servizio temporaneamente sospeso." }, { status: 402 });
  const usage = await listUsageSummary(avatar.id).catch(() => ({}));
  if (Number(usage.chat || 0) >= Number(avatar.monthly_chat_limit || 1000)) return Response.json({ error: "Limite mensile conversazioni raggiunto." }, { status: 429 });
  const messages = Array.isArray(payload.messages)
    ? payload.messages.filter((item) => item && ["user", "assistant"].includes(item.role)).slice(-10).map((item) => ({ role: item.role, content: String(item.content || "").slice(0, 1800) }))
    : [];
  if (!messages.some((item) => item.role === "user" && item.content.trim())) return Response.json({ error: "Messaggio mancante." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "Motore AI non configurato." }, { status: 503 });
  const knowledge = await getAvatarKnowledgeText(avatar.id).catch(() => "");
  const latestQuestion = [...messages].reverse().find((item) => item.role === "user")?.content || "";
  // CUP demo actions are explicit, confirmed, and isolated to Giulia.
  if (slug === DEMO_SLUG) {
    const q = latestQuestion.toLocaleLowerCase("it").trim();
    const prior = [...messages].reverse().find(m => m.role === "assistant")?.content || "";
    const api = async (body) => {
      const response = await fetch(new URL("/api/cup-demo", request.url), { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({slug:DEMO_SLUG,...body}),cache:"no-store" });
      return {ok:response.ok,data:await response.json()};
    };
    const result = (reply) => Response.json({reply},{headers:{"Cache-Control":"no-store"}});
    const pending = prior.match(/CONFERMA DEMO: (.+?) \\| (.+?) \\| (.+?)\\./);
    if (/^(confermo|sì confermo|si confermo|conferma)$/i.test(q) && pending) {
      const [,service,slot] = pending;
      const res = await api({action:"book",service,slot,confirm:true}).catch(()=>null);
      if (!res?.ok) return result("Non sono riuscita a registrare la prenotazione dimostrativa. Riprova tra poco.");
      return result("Prenotazione dimostrativa confermata. Il codice è "+res.data.booking.booking_code+". Conservalo per consultare o pagare il ticket demo.");
    }
    const service = demoCupQuery({action:"availability"}).results.find(s => q.includes(s.service.toLowerCase()) || q.includes(s.doctor.toLowerCase()));
    const isBook = /prenot|fissa.*visita|voglio.*visita|vorrei.*visita/.test(q);
    if (isBook && service) {
      const slots = service.slots.filter(t=>new Date(t)>new Date());
      if(!slots.length)return result("Per questa prestazione non ci sono date future disponibili nella demo.");
      const requested=slots.find(t=>{const d=new Date(t);return q.includes(String(d.getDate())) && q.includes(String(d.getHours()).padStart(2,"0"));});
      const slot=requested||slots[0];
      const label=new Intl.DateTimeFormat("it-IT",{timeZone:"Europe/Rome",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}).format(new Date(slot));
      return result("Per "+service.service+" con "+service.doctor+" propongo il "+label+". CONFERMA DEMO: "+service.service+" | "+slot+" | "+service.doctor+". Se vuoi registrare questa prenotazione fittizia, rispondi: confermo.");
    }
    const code=latestQuestion.toUpperCase().match(/DEMO-[A-F0-9]{24}/)?.[0];
    if(code){
      const u=new URL("/api/cup-demo",request.url);u.searchParams.set("slug",DEMO_SLUG);u.searchParams.set("action","booking");u.searchParams.set("code",code);
      const check=await fetch(u,{cache:"no-store"}).then(async r=>({ok:r.ok,data:await r.json()})).catch(()=>null);
      if(!check?.ok)return result("Non trovo questa prenotazione dimostrativa. Verifica il codice.");
      const booking=check.data.booking;
      if(/pag|ticket/.test(q)){
        if(/confermo|procedi/.test(q)){
          const pay=await api({action:"pay",code,confirm:true}).catch(()=>null);
          return result(pay?.ok?"Pagamento del ticket simulato completato, senza alcun addebito reale.":"Non riesco a completare il pagamento dimostrativo.");
        }
        return result("Il ticket dimostrativo è di "+Number(booking.ticket_amount).toFixed(2).replace(".",",")+" euro. Per simulare il pagamento senza addebiti, scrivi: confermo pagamento "+code+".");
      }
      if(/annull|cancell/.test(q)){
        if(/confermo/.test(q)){
          const cancelled=await api({action:"cancel",code,confirm:true}).catch(()=>null);
          return result(cancelled?.ok?"Prenotazione dimostrativa annullata.":"Non riesco ad annullare la prenotazione demo.");
        }
        return result("Per annullare la prenotazione fittizia, scrivi: confermo annullamento "+code+".");
      }
      return result("Ho trovato la prenotazione demo per "+booking.service_id+". Stato: "+(booking.booking_status==="confirmed"?"confermata":"annullata")+". Ticket: "+(booking.ticket_status==="paid_demo"?"pagato nella simulazione":"da pagare nella simulazione")+".");
    }
  }
  const cupContext = slug === DEMO_SLUG ? JSON.stringify({ services: demoCupQuery({action:"services"}), availability: demoCupQuery({action:"availability"}), directions: demoCupQuery({action:"directions"}), tickets: demoCupQuery({action:"ticket"}) }) : "";
  const instructions = [
    `Sei ${String(avatar.spoken_avatar_name || avatar.avatar_name).slice(0, 50)}, assistente digitale di ${String(avatar.company_name).slice(0, 120)}.`,
    `Ruolo: ${String(avatar.personality?.role || "assistente digitale").slice(0, 500)}.`,
    `Tono: ${String(avatar.personality?.tone || "naturale e professionale").slice(0, 500)}.`,
    `Conoscenza aziendale verificata:\n${knowledge || String(avatar.notes || "").slice(0, 1200)}`,
    "Rispondi in italiano in 2 o 3 frasi complete, chiare e naturali, senza Markdown. Mantieni ogni risposta entro 350 caratteri, così l’avatar può pronunciarla interamente. Non interrompere mai una frase.",
    "Usa solo i fatti della conoscenza di questo avatar. Non utilizzare dati di altri clienti.",
    "Non inventare prezzi, orari, indirizzi, disponibilità o servizi. Se il dato manca, proponi il contatto con l’azienda.",
    ...(cupContext ? [`CUP DIMOSTRATIVO (DATI TOTALMENTE FITTIZI, API INTERNA): ${cupContext}`, "Per domande su CUP, visite, dottori, ambulatori e ticket usa soltanto i dati demo sopra. Specifica chiaramente che si tratta di una dimostrazione. Puoi guidare le prenotazioni demo; la conferma e il pagamento simulato richiedono comandi espliciti e un codice. Non dichiarare mai operazioni eseguite senza la risposta del sistema. Puoi mostrare l’importo del ticket ma non richiedere carte, dati sanitari o codici fiscali. Per prevenzione offri informazioni generali, non diagnosi né indicazioni cliniche personalizzate."] : [])
  ].join("\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.2", instructions, input: messages }) });
    if (!response.ok) return Response.json({ error: "Risposta AI non disponibile." }, { status: 502 });
    const data = await response.json();
    const rawReply = String(data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("") || "").replace(/\*\*|__|`/g, "").trim();
    const speechLimit = 380;
    let reply = rawReply;
    if (reply.length > speechLimit) {
      const within = reply.slice(0, speechLimit);
      const sentences = [...within.matchAll(/[.!?](?=\s|$)/g)];
      const last = sentences.at(-1);
      reply = last && last.index > 80 ? within.slice(0, last.index + 1).trim() : within.slice(0, within.lastIndexOf(" ")).trim().replace(/[,;:\s]+$/, "") + ".";
    }
    if (!reply) return Response.json({ error: "Risposta AI vuota." }, { status: 502 });
    insertUsageEvent({ clientId: avatar.id, eventType: "chat", units: 1, metadata: { ip: requestIp(request), inputCharacters: messages.at(-1)?.content?.length || 0, outputCharacters: reply.length } }).catch(() => {});
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Connessione AI non disponibile." }, { status: 502 }); }
}
