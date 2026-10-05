"use client";

import { useState } from "react";

const avatars = [
  { name: "SOFIA", sector: "Hotel", video: "/sofia-hotel-avatar.mp4", poster: "/sofia-hotel-poster.jpg", question: "A che ora viene servita la colazione?", answer: "Ti aiuto con camere, servizi e richieste alla reception." },
  { name: "GIULIA", sector: "Benessere", video: "/giulia-benessere-avatar.mp4", poster: "/giulia-benessere-poster.jpg", question: "Quale trattamento è più adatto a me?", answer: "Ti presento percorsi, prodotti e disponibilità del centro." },
  { name: "MARCO", sector: "Ristorazione", video: "/marco-ristorazione-avatar.mp4", poster: "/marco-ristorazione-poster.jpg", question: "Mi consigli un piatto tipico?", answer: "Ti racconto menu, ingredienti e abbinamenti del ristorante." },
  { name: "ILARIA", sector: "Immobiliare", video: "/epm-avatar.mp4", poster: "/ilaria-immobiliare-poster.jpg", question: "Cerco un trilocale con terrazzo.", answer: "Raccolgo zona, budget e preferenze per l’agente più adatto." },
];

export default function HomeAvatarShowcase() {
  const [active, setActive] = useState(0);
  const avatar = avatars[active];

  return <div className="home-avatar-showcase">
    <div className={`phone-card phone-sector-${active}`} aria-label={`Anteprima AvatarOne ${avatar.sector}`}>
      <div className="phone-screen">
        <div className="phone-topline"><div><span className="live-pill">● ONLINE</span><h3>{avatar.name}</h3><small>{avatar.sector}</small></div><span className="voice-status">◉ In ascolto</span></div>
        <div className="avatar-orb"><video key={avatar.video} autoPlay muted loop playsInline preload="metadata" poster={avatar.poster} aria-label={`Video dimostrativo di ${avatar.name}`}><source src={avatar.video} type="video/mp4" /></video><span className="avatar-video-glow"/><span className="speaking-pill"><i/><i/><i/><i/> {avatar.name} sta parlando</span></div>
        <div className="demo-chat" aria-label={`Esempio di conversazione con ${avatar.name}`}><p className="chat-user">{avatar.question}</p><p className="chat-mia"><strong>{avatar.name}</strong>{avatar.answer}</p></div>
        <div className="demo-input"><span>Scrivi a {avatar.name}…</span><b>↑</b></div>
      </div>
    </div>
    <div className="avatar-switcher" aria-label="Scegli un avatar dimostrativo">
      {avatars.map((item,index)=><button className={index===active?"is-active":""} type="button" onClick={()=>setActive(index)} aria-pressed={index===active} key={item.name}><img src={item.poster} alt=""/><span>{item.name}<small>{item.sector}</small></span></button>)}
    </div>
  </div>;
}
