// Synthetic hospital data for AvatarOne Connect demonstrations. No real patient data.
export const DEMO_SLUG = "giulia-new-digital-app";
const services = [
  { id:"cardiologia", name:"Visita cardiologica", doctor:"Dott. Rossi", building:"Edificio A", floor:"Piano 2", room:"Ambulatorio 12", ticket:36.15, slots:["2026-11-12T10:30:00+01:00","2026-11-13T09:15:00+01:00"] },
  { id:"dermatologia", name:"Visita dermatologica", doctor:"Dott.ssa Bianchi", building:"Edificio B", floor:"Piano 1", room:"Ambulatorio 5", ticket:28.50, slots:["2026-11-12T15:00:00+01:00","2026-11-16T11:00:00+01:00"] },
  { id:"ortopedia", name:"Visita ortopedica", doctor:"Dott. Verdi", building:"Edificio C", floor:"Piano terra", room:"Ambulatorio 3", ticket:36.15, slots:["2026-11-17T08:45:00+01:00"] }
];
export function demoCupQuery({ action="services", service="" }={}) {
  const query=String(service).toLocaleLowerCase("it").trim();
  const matches=services.filter(s=>!query || [s.id,s.name,s.doctor].some(v=>v.toLocaleLowerCase("it").includes(query)));
  if(action==="services") return { demo:true, services:services.map(({slots,...s})=>s) };
  if(action==="availability") return { demo:true, results:matches.map(s=>({service:s.name,doctor:s.doctor,slots:s.slots,location:[s.building,s.floor,s.room].join(", "),ticketEUR:s.ticket})) };
  if(action==="directions") return { demo:true, results:matches.map(s=>({doctor:s.doctor,service:s.name,building:s.building,floor:s.floor,room:s.room})), note:"Agenda fittizia: nessun appuntamento personale verificato." };
  if(action==="ticket") return { demo:true, results:matches.map(s=>({service:s.name,amountEUR:s.ticket,paymentStatus:"NON PAGATO",paymentMode:"SIMULAZIONE",phone:"Pagamento demo senza addebito",box:"POS dimostrativo senza transazione"})) };
  return { error:"Azione non disponibile", demo:true };
}
