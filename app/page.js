import Link from "next/link";
import ContactForm from "./contact-form";
import "./landing.css";
import "./landing-scroll.css";
import "./contract-download.css";
import { sectorCards } from "./settori/sector-data";
import "./settori/sector-pages.css";
import ResponsiveNav from "./responsive-nav";
import HomeAvatarShowcase from "./home-avatar-showcase";

const features = [
  ["◉", "Parla e risponde", "Conversazioni vocali e testuali con una voce naturale, disponibili da smartphone, sito e app."],
  ["▤", "Impara dai tuoi contenuti", "PDF, pagine web, cataloghi, listini e domande frequenti separati per ogni cliente."],
  ["↗", "Genera contatti", "Porta la conversazione su WhatsApp con un messaggio già pronto e collegato alla tua azienda."],
  ["◎", "Avatar personalizzato", "Immagine, video, identità, tono e messaggio di benvenuto coerenti con il tuo brand."],
  ["⌁", "Sempre aggiornabile", "Il cliente aggiorna in autonomia conoscenza e documenti dalla propria area protetta."],
  ["▥", "Misurabile", "Conversazioni, minuti vocali, contatti e utilizzo sotto controllo nella dashboard." ]
];

const plans = [
  { name: "Start", price: "da €1.490", monthly: "Licenza da €99/mese", items: ["Avatar personalizzato", "Chat e voce AI", "PDF e sito web", "WhatsApp", "Installazione web/PWA"] },
  { name: "Business", price: "da €2.900", monthly: "Licenza da €199/mese", featured: true, items: ["Tutto di Start", "Più contenuti e utilizzo", "Analytics e contatti", "Personalizzazione avanzata", "Assistenza prioritaria"] },
  { name: "AvatarOne Experience", price: "da €4.900", monthly: "Licenza da €299/mese", items: ["Tutto di Business", "Esperienza per spazi fisici", "API e integrazioni", "Più lingue", "Hardware escluso: Box, Totem o Monitor touch su preventivo"] }
];

export const metadata = {
  title: "AvatarOne · Persone digitali AI per aziende",
  description: "Avatar AI personalizzati che parlano, rispondono, apprendono da siti e PDF e trasformano le conversazioni in contatti.",
  alternates: { canonical: "https://www.avatarone.it/" }
};

export default function LandingPage(){return <main className="landing">
  <ResponsiveNav />
  <section className="hero"><div><p className="eyebrow">New Digital App · AI Studio</p><h1>La tua azienda diventa una <span className="gradient-text">persona digitale.</span></h1><p className="hero-copy">Un avatar AI personalizzato che parla, scrive, conosce i tuoi servizi e accompagna ogni cliente verso il contatto con la tua azienda.</p><div className="hero-actions"><a className="primary-cta" href="#contatti">Crea il tuo Avatar AI</a><Link className="secondary-cta" href="/mia">Parla con MIA</Link></div><div className="trust-row"><span>Configurazione gestita da NDA</span><span>Conoscenza separata</span><span>Pronto per smartphone</span></div></div><HomeAvatarShowcase /></section>
  <section className="section" id="funzioni"><div className="section-head"><p className="eyebrow">Un prodotto, molti settori</p><h2>Non è un semplice chatbot.</h2><p>AvatarOne unisce identità visiva, conversazione, conoscenza aziendale e acquisizione contatti.</p></div><div className="feature-grid">{features.map(([icon,title,text])=><article className="feature-card" key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section className="section" id="settori"><div className="section-head"><p className="eyebrow">Soluzioni verticali</p><h2>Scopri AvatarOne nel tuo settore.</h2><p>Ogni pagina mostra un esempio concreto di avatar, conversazione e percorso di contatto pensato per quella categoria.</p></div><div className="sector-grid home-sector-grid">{sectorCards.map(([slug,title,text,poster,assistant],index)=><Link className={"sector-card sector-card-"+slug} href={"/"+slug} key={slug}><div className="sector-card-visual"><img src={poster} alt={assistant+", avatar AI per "+title}/><span>{assistant}</span></div><div className="sector-card-copy"><small>0{index+1} · Soluzione</small><h3>{title}</h3><p>{text}</p><b>Scopri la soluzione →</b></div></Link>)}</div></section>
  <section className="dark-section" id="come-funziona"><div className="inner"><div className="section-head"><p className="eyebrow">Percorso gestito</p><h2>Tu ci racconti l’idea. Noi costruiamo la persona.</h2></div><div className="steps-grid">{[["1","Briefing","Definiamo obiettivi, pubblico e stile."],["2","Creazione","Produciamo identità, video, voce e interfaccia."],["3","Conoscenza","Colleghiamo sito, PDF e informazioni aziendali."],["4","Pubblicazione","Consegniamo link, QR, PWA o integrazione nel sito."]].map(([n,t,d])=><article className="step-card" key={n}><span>{n}</span><h3 style={{color:"#07131a"}}>{t}</h3><p style={{color:"#66737c"}}>{d}</p></article>)}</div></div></section>
  <section className="section" id="pacchetti"><div className="section-head"><p className="eyebrow">Soluzioni commerciali</p><h2>Un progetto adatto alla tua azienda.</h2><p>I prezzi finali dipendono da avatar, contenuti, minuti vocali e integrazioni. Prepariamo sempre un preventivo chiaro.</p></div><div className="pricing-grid">{plans.map(plan=><article className={"price-card"+(plan.featured?" featured":"")} key={plan.name}><p className="eyebrow">{plan.name}</p><h3>{plan.price}</h3><span className="price"><small>{plan.monthly}</small></span><ul>{plan.items.map(item=><li key={item}>{item}</li>)}</ul><a href="#contatti">Richiedi preventivo</a></article>)}</div><div className="contract-card"><div><p className="eyebrow">Trasparenza commerciale</p><h3>Consulta il contratto AvatarOne</h3><p>Scarica il documento con costo di attivazione, canone di abbonamento, servizi inclusi, durata, rinnovo e condizioni di utilizzo.</p></div><a href="/contratto-avatarone.pdf" target="_blank" rel="noreferrer" download>Scarica il contratto PDF</a></div></section>
  <section className="section contact-wrap" id="contatti"><div><p className="eyebrow">Parliamone</p><h2>Raccontaci il tuo avatar.</h2><p className="hero-copy">Compila il modulo: la richiesta viene registrata e preparata direttamente per WhatsApp sul numero di Antonio Celotto.</p><p><strong>New Digital App</strong><br/>Via Antonio Bertola 59, Torino<br/>P. IVA 12254210011</p></div><ContactForm /></section>
  <footer className="footer">© 2026 New Digital App · AvatarOne <Link href="/privacy">Privacy</Link><Link href="/terms">Condizioni</Link><a href="/contratto-avatarone.pdf" target="_blank" rel="noreferrer">Contratto PDF</a><Link href="/admin-login">Accesso amministratore</Link></footer>
</main>}
