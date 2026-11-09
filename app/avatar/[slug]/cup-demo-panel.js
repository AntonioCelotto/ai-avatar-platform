"use client";
import { useEffect, useState } from "react";
const SLUG="giulia-new-digital-app";
export default function CupDemoPanel({tenant,messages}) {
 const [services,setServices]=useState([]);
 const [booking,setBooking]=useState(null);
 const [status,setStatus]=useState("");
 const [open,setOpen]=useState(true);
 const last=messages[messages.length-1]?.content||"";
 const code=[...messages].reverse().map(m=>m.content.match(/DEMO-[A-F0-9]{24}/)?.[0]).find(Boolean);
 useEffect(()=>{
  if(tenant.slug!==SLUG)return;
  let active=true;
  fetch("/api/cup-demo?slug="+SLUG+"&action=availability",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active)setServices(d.results||[])}).catch(()=>{});
  return()=>{active=false};
 },[tenant.slug]);
 useEffect(()=>{
  if(!code)return;
  let active=true;
  const params=new URLSearchParams({slug:SLUG,action:"booking",code});
  fetch("/api/cup-demo?"+params,{cache:"no-store"}).then(r=>r.json()).then(d=>{if(active){setBooking(d.booking||null);setStatus(d.booking?"":"Codice demo non ancora registrato")}}).catch(()=>{if(active)setStatus("Verifica prenotazione non disponibile")});
  return()=>{active=false};
 },[code,last]);
 if(tenant.slug!==SLUG)return null;
 const date=(v)=>new Intl.DateTimeFormat("it-IT",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(v));
 return <section className="cup-demo-panel" aria-label="CUP dimostrativo">
 <style>{`
 .cup-demo-panel{margin:8px 0 12px;padding:12px;border:1px solid #9ccfc8;border-radius:16px;background:#f4fcfa;color:#123e39;font:inherit}
 .cup-demo-panel *{box-sizing:border-box}.cup-demo-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.cup-demo-heading strong{font-size:14px}.cup-demo-tag{font-size:10px;background:#d3eee8;padding:4px 7px;border-radius:12px;font-weight:700}
 .cup-demo-toggle{border:1px solid #b7d9d2;background:white;color:#14564c;border-radius:9px;padding:5px 9px;cursor:pointer}
 .cup-demo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:10px}
 .cup-demo-card{background:white;border:1px solid #d5e8e3;border-radius:11px;padding:10px;display:grid;gap:5px;font-size:12px}
 .cup-demo-card strong{font-size:13px}.cup-demo-card small{color:#52736d}.cup-demo-code{font-weight:700;overflow-wrap:anywhere;font-size:13px}
 .cup-demo-panel p{font-size:11px;line-height:1.45;margin:8px 0 0;color:#4d6d68}
 .avatar-immersive .cup-demo-panel{display:none!important}
 `}</style>
 <div className="cup-demo-heading"><strong>🏥 CUP · Prenotazioni e ticket</strong><span className="cup-demo-tag">SIMULAZIONE</span><button className="cup-demo-toggle" onClick={()=>setOpen(v=>!v)} type="button" aria-expanded={open}>{open?"Riduci":"Apri"}</button></div>
 {open&&<>
 {booking&&<div className="cup-demo-grid"><div className="cup-demo-card"><strong>La tua prenotazione demo</strong><span className="cup-demo-code">{booking.booking_code}</span><span>{booking.service_id}</span><span>{date(booking.appointment_at)}</span><span>Stato: {booking.booking_status==="confirmed"?"Confermata":"Annullata"}</span><span>Ticket: {Number(booking.ticket_amount).toLocaleString("it-IT",{style:"currency",currency:"EUR"})} · {booking.ticket_status==="paid_demo"?"Pagato (demo)":"Da pagare (demo)"}</span></div></div>}
 {!booking&&<div className="cup-demo-grid">{services.map(s=><div className="cup-demo-card" key={s.service}><strong>{s.service}</strong><small>{s.doctor}</small>{s.slots?.map(t=><span key={t}>📅 {date(t)}</span>)}<span>Ticket {Number(s.ticketEUR).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}</span><small>{s.location}</small></div>)}</div>}
 {status&&<p>{status}</p>}
 <p>Questi appuntamenti, importi e pagamenti sono fittizi. Per prenotare o pagare parla con Giulia e conferma l'operazione.</p>
 </>}
 </section>;
}
