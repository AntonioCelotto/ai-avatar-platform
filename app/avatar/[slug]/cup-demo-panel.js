"use client";
import { useEffect, useState } from "react";
import { demoCupQuery } from "../../lib/cup-demo";
const SLUG="giulia-new-digital-app";
const FALLBACK=demoCupQuery({action:"availability"}).results;
export default function CupDemoPanel({tenant,messages}) {
 const [services,setServices]=useState(FALLBACK);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState("");
 const [retry,setRetry]=useState(0);
 const [booking,setBooking]=useState(null);
 const [status,setStatus]=useState("");
 const [open,setOpen]=useState(false);
 const [selected,setSelected]=useState("");
 const [slot,setSlot]=useState("");
 const [localCode,setLocalCode]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [receipt,setReceipt]=useState(false);
 const last=messages[messages.length-1]?.content||"";
 useEffect(()=>{const m=[...messages].reverse().find(x=>x.role==="assistant"&&/CONFERMA DEMO:/.test(x.content));if(!m)return;const p=m.content.match(/CONFERMA DEMO: (.+?) \| (.+?) \|/);if(p){setSelected(p[1]);setSlot(p[2]);setOpen(true)}},[messages]);
 useEffect(()=>{
  if(!services.length||!messages.length)return;
  const recent=messages.slice(-3);
  const user=[...recent].reverse().find(m=>m.role==="user")?.content||"";
  const reply=[...recent].reverse().find(m=>m.role==="assistant")?.content||"";
  const inquiry=/prenot|disponibil|appuntament|visita|cardiolog|dermatolog|ortoped/i.test(user);
  if(!inquiry)return;
  const matching=services.find(s=>[user,reply].some(t=>t.toLocaleLowerCase("it").includes(s.service.toLocaleLowerCase("it").replace("visita ",""))));
  if(matching){setSelected(matching.service);setSlot(current=>matching.slots.includes(current)?current:"");}
  setOpen(true);
 },[messages,services]);
 const code=localCode||[...messages].reverse().map(m=>m.content.match(/DEMO-[A-F0-9]{24}/)?.[0]).find(Boolean);
 useEffect(()=>{
  if(tenant.slug!==SLUG)return;
  let active=true;
  setLoading(true);setLoadError("");
  fetch("/api/cup-demo?slug="+SLUG+"&action=availability",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok||!Array.isArray(d.results))throw Error(d.error||"Disponibilità non disponibili");return d;}).then(d=>{if(active){setServices(d.results.length?d.results:FALLBACK);setLoading(false);if(!d.results.length)setLoadError("Nessuna visita dimostrativa disponibile");}}).catch(e=>{if(active){setLoading(false);setServices(FALLBACK);setLoadError("Agenda demo locale attiva: "+(e.message||"servizio non raggiungibile"));}});
  return()=>{active=false};
 },[tenant.slug,retry]);
 useEffect(()=>{
  if(!code)return;
  let active=true;
  const params=new URLSearchParams({slug:SLUG,action:"booking",code});
  fetch("/api/cup-demo?"+params,{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active){setBooking(d.booking||null);setStatus(d.booking?"":"Codice demo non ancora registrato")}}).catch(()=>{if(active)setStatus("Verifica prenotazione non disponibile")});
  return()=>{active=false};
 },[code,last]);
 async function bookDemo(){if(!selected||!slot)return;setBusy(true);setNotice("");try{const r=await fetch("/api/cup-demo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:SLUG,action:"book",service:selected,slot,confirm:true})});const d=await r.json();if(!r.ok)throw Error(d.error||"Operazione non disponibile");setLocalCode(d.booking.booking_code);setBooking(d.booking);setNotice("Prenotazione dimostrativa confermata. Nessuna prenotazione reale.");}catch(e){setNotice(e.message)}finally{setBusy(false)}}
 async function payDemo(){if(!code)return;setBusy(true);try{const r=await fetch("/api/cup-demo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:SLUG,action:"pay",code,confirm:true})});const d=await r.json();if(!r.ok)throw Error(d.error||"Errore");setBooking(d.booking);setReceipt(true);setNotice("Ticket pagato nella simulazione. Nessun addebito.");}catch(e){setNotice(e.message)}finally{setBusy(false)}}
 if(tenant.slug!==SLUG)return null;
 const date=(v)=>new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(v));
 return <section className="cup-demo-panel" aria-label="CUP dimostrativo">
 <style>{`
 .cup-demo-panel{margin:8px 0 12px;padding:12px;border:1px solid #9ccfc8;border-radius:16px;background:#f4fcfa;color:#123e39;font:inherit}
 .cup-demo-panel *{box-sizing:border-box}.cup-demo-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.cup-demo-heading strong{font-size:14px}.cup-demo-tag{font-size:10px;background:#d3eee8;padding:4px 7px;border-radius:12px;font-weight:700}
 .avatar-immersive .assistant-workspace:has(.cup-demo-panel),.avatar-immersive .assistant-panel:has(.cup-demo-panel){pointer-events:auto!important}.avatar-immersive .cup-demo-panel button,.avatar-immersive .cup-demo-panel input,.avatar-immersive .cup-demo-panel select{pointer-events:auto!important;position:relative;z-index:2}.cup-demo-toggle{border:1px solid #b7d9d2;background:white;color:#14564c;border-radius:9px;padding:5px 9px;cursor:pointer}
 .cup-demo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:10px}
 .cup-demo-card{background:white;border:1px solid #d5e8e3;border-radius:11px;padding:10px;display:grid;gap:5px;font-size:12px}
 .cup-demo-slot{display:block;width:100%;text-align:left;padding:10px;border:1px solid #a8d5ca;border-radius:9px;background:#effaf6;color:#15594e;cursor:pointer;font-weight:650}.cup-demo-slot--selected{background:#087d70;color:white;border-color:#087d70}.cup-demo-card strong{font-size:13px}.cup-demo-card small{color:#52736d}.cup-demo-code{font-weight:700;overflow-wrap:anywhere;font-size:13px}
 .cup-demo-panel p{font-size:11px;line-height:1.45;margin:8px 0 0;color:#4d6d68}
 .avatar-immersive .cup-demo-panel{display:block!important;position:fixed!important;z-index:40!important;pointer-events:auto!important;top:auto!important;bottom:185px!important;right:12px!important;left:auto!important;width:min(390px,calc(100vw - 100px))!important;max-height:45dvh!important;overflow-y:auto!important;box-shadow:0 12px 38px #0009!important;margin:0!important;padding:12px!important}.cup-demo-form{display:grid;gap:7px;margin-top:10px}.cup-demo-form select,.cup-demo-form input{width:100%;min-width:0;padding:10px;border:1px solid #b7d9d2;border-radius:8px;background:white;color:#123e39;font-size:14px}.cup-demo-form button{background:#087d70;color:white;border:0;border-radius:9px;padding:10px;font-weight:700;cursor:pointer}.cup-demo-form button:disabled{opacity:.5}.cup-demo-form label{font-size:12px;font-weight:650}@media(max-width:600px){.avatar-immersive .cup-demo-panel{top:auto!important;bottom:185px!important;right:8px!important;left:auto!important;width:calc(100vw - 90px)!important;max-height:45dvh!important}}

 .avatar-immersive .cup-demo-panel{left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:min(92vw,880px)!important;bottom:clamp(110px,13dvh,180px)!important;max-height:65dvh!important;border-radius:20px!important}
 .cup-demo-toggle{background:#008c86!important;color:#fff!important;border:1px solid #008c86!important;border-radius:12px!important;padding:9px 17px!important;font-weight:800!important}
 @media(max-width:600px){.avatar-immersive .cup-demo-panel{width:calc(100vw - 28px)!important;bottom:110px!important}}
 `}</style>
 <div className="cup-demo-heading"><strong>🏥 CUP · Prenotazioni e ticket</strong><span className="cup-demo-tag">SIMULAZIONE</span><button className="cup-demo-toggle" onClick={()=>setOpen(v=>!v)} type="button" aria-expanded={open}>{open?"Riduci":"Apri"}</button></div>
 {open&&<>
 {loading&&<p role="status">Caricamento delle visite disponibili…</p>}
 {loadError&&<p role="alert">{loadError} <button type="button" onClick={()=>setRetry(v=>v+1)}>Riprova</button></p>}
 {booking&&<div className="cup-demo-grid"><div className="cup-demo-card"><strong>La tua prenotazione demo</strong><span className="cup-demo-code">{booking.booking_code}</span><span>{booking.service_id}</span><span>{date(booking.appointment_at)}</span><span>Stato: {booking.booking_status==="confirmed"?"Confermata":"Annullata"}</span><span>Ticket: {Number(booking.ticket_amount).toLocaleString("it-IT",{style:"currency",currency:"EUR"})} · {booking.ticket_status==="paid_demo"?"Pagato (demo)":"Da pagare (demo)"}</span></div></div>}
 {!booking&&<div className="cup-demo-grid">{services.filter(s=>!selected||s.service===selected).map(s=><div className="cup-demo-card" key={s.service}><strong>{s.service}</strong><small>{s.doctor}</small>{s.slots?.map(t=><button className={`cup-demo-slot ${slot===t?"cup-demo-slot--selected":""}`} type="button" key={t} onClick={()=>{setSelected(s.service);setSlot(t);setNotice("");}} aria-pressed={slot===t}>📅 {date(t)} {slot===t?"✓":""}</button>)}<span>Ticket {Number(s.ticketEUR).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}</span><small>{s.location}</small></div>)}</div>}
 <div className="cup-demo-form"><label htmlFor="cup-service">Prestazione</label><select id="cup-service" value={selected} onChange={e=>{setSelected(e.target.value);setSlot("");}}><option value="">{loading?"Caricamento visite…":services.length?"Scegli una visita":"Nessuna visita caricata"}</option>{services.map(s=><option key={s.service} value={s.service}>{s.service}</option>)}</select><label htmlFor="cup-slot">Data e ora · puoi anche toccare una data qui sopra</label><select id="cup-slot" value={slot} onChange={e=>setSlot(e.target.value)}><option value="">Scegli disponibilità</option>{services.find(s=>s.service===selected)?.slots?.map(t=><option key={t} value={t}>{date(t)}</option>)}</select><button type="button" disabled={!selected||!slot||busy} onClick={bookDemo}>Conferma prenotazione demo</button><label htmlFor="cup-code">Codice prenotazione</label><input id="cup-code" value={localCode} onChange={e=>setLocalCode(e.target.value.toUpperCase())} placeholder="DEMO-..." autoComplete="off"/><button type="button" disabled={!code||busy} onClick={payDemo}>Simula pagamento ticket</button></div>
 {notice&&<p role="status">{notice}</p>}{status&&<p>{status}</p>}
 {receipt&&booking&&<div className="cup-demo-card" role="status"><strong>Ricevuta ticket · DEMO</strong><span>{booking.booking_code}</span><span>Importo: {Number(booking.ticket_amount).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}</span><span>ESITO: PAGATO NELLA SIMULAZIONE</span><small>Nessun pagamento reale effettuato.</small></div>}
 <p>Questi appuntamenti, importi e pagamenti sono fittizi. Per prenotare o pagare parla con Giulia e conferma l'operazione.</p>
 </>}
 </section>;
}
