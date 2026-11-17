import Link from "next/link";
import ContactForm from "./contact-form";
import "./landing.css";
import "./landing-scroll.css";
import "./contract-download.css";
import { sectorCards } from "./settori/sector-data";
import "./settori/sector-pages.css";
import ResponsiveNav from "./responsive-nav";
import HomeAvatarShowcase from "./home-avatar-showcase";
import SkillExplorer from "./skills/skill-explorer";
import "./skills/skills.css";
import "./experience-showcase.css";

const features = [
  ["◉", "Parla e risponde", "Conversazioni vocali e testuali con una voce naturale, disponibili da smartphone, sito e app."],
  ["▤", "Impara dai tuoi contenuti", "PDF, pagine web, cataloghi, listini e domande frequenti separati per ogni cliente."],
  ["↗", "Genera contatti", "Porta la conversazione su WhatsApp con un messaggio già pronto e collegato alla tua azienda."],
  ["◎", "Avatar personalizzato", "Immagine, video, identità, tono e messaggio di benvenuto coerenti con il tuo brand."],
  ["⌁", "Sempre aggiornabile", "Il cliente aggiorna in autonomia conoscenza e documenti dalla propria area protetta."],
  ["▥", "Misurabile", "Conversazioni, minuti vocali, contatti e utilizzo sotto controllo nella dashboard." ]
];

const plans = [
  { name: "AvatarOne Smart", price: "Attivazione da €1.490", monthly: "€39/mese", items: ["Avatar AI personalizzato con chat e voce", "Risposte basate sulle informazioni dell'azienda", "Conoscenza da siti web, PDF, cataloghi e FAQ", "Voce personalizzabile", "Link pubblico, QR code e WhatsApp", "Dashboard per aggiornare la conoscenza"] },
  { name: "AvatarOne Connect", price: "Attivazione da €2.900", monthly: "€99/mese", featured: true, items: ["Tutte le funzionalità Smart", "Integrazioni API con CRM, gestionali, software e database", "Collegamento a e-commerce e sistemi di prenotazione", "Informazioni dinamiche dai sistemi autorizzati", "Integrazioni da progettare e quotare separatamente", "Link pubblico e QR code"] },
  { name: "AvatarOne Experience", price: "Su preventivo", monthly: "Progetto e canone personalizzati", items: ["Tutte le funzionalità Connect", "Video respirazione e video durante il parlato", "Ascolto continuo e modalità immersiva", "Esperienza su tablet, totem e monitor touch", "Possibilità di creare API e integrazioni avanzate con gestionali e software", "Hardware, integrazioni e lip-sync Live Premium su preventivo"] }
];

export const metadata = {
  title: "AvatarOne · Persone digitali AI per aziende",
  description: "AvatarOne Smart, Connect ed Experience: avatar AI da siti e PDF, integrazioni API e progetti su misura per web, box e totem. Link condivisibile per ogni soluzione.",
  alternates: { canonical: "https://www.avatarone.it/" }
};

export default function LandingPage(){return <main className="landing">
  <ResponsiveNav />
  <section className="hero"><div><p className="eyebrow">New Digital App · AI Studio</p><h1>La tua azienda diventa una <span className="gradient-text">persona digitale.</span></h1><p className="hero-copy">Accoglie i tuoi clienti, conosce la tua azienda e li accompagna verso i tuoi servizi. Con le skill e le integrazioni su misura, AvatarOne può diventare parte del tuo lavoro quotidiano: dal sito al tablet, fino al totem.</p><div className="hero-actions"><a className="primary-cta" href="#skill">Scopri cosa può fare</a><Link className="secondary-cta" href="/avatar/mia-nda">Parla con MIA</Link></div><div className="trust-row"><span>Configurazione gestita da NDA</span><span>Conoscenza separata</span><span>Link e QR condivisibili</span></div></div><HomeAvatarShowcase /></section>
  <SkillExplorer />
  <section className="a1-experience-showcase" id="experience" aria-labelledby="experience-title">
    <div className="a1-experience-copy">
      <span className="a1-experience-eyebrow">AVATARONE EXPERIENCE / BOX E TOTEM</span>
      <h2 id="experience-title">Il tuo nuovo punto<br />di <span>accoglienza.</span></h2>
      <p>Un assistente che i tuoi clienti possono vedere, ascoltare e interpellare. Sul totem, Giulia dà un volto ai servizi e guida ogni visitatore verso il passo successivo.</p>
      <ol className="a1-experience-journey">
        <li><span>01</span><div><strong>Accoglie</strong><p>Si presenta e aiuta il visitatore a esprimere la sua richiesta.</p></div></li>
        <li><span>02</span><div><strong>Informa e orienta</strong><p>Risponde sui servizi e indica dove trovare ciò che serve.</p></div></li>
        <li><span>03</span><div><strong>Accompagna al servizio</strong><p>Con le integrazioni dedicate, guida prenotazioni e richieste.</p></div></li>
      </ol>
      <div className="a1-experience-actions"><Link href="/experience/giulia" target="_blank" rel="noreferrer">Parla con Giulia <span aria-hidden="true">↗</span></Link><a href="#contatti">Progetta il tuo Experience Box <span aria-hidden="true">→</span></a></div>
      <small>Qui puoi provare la demo sanitaria con dati e operazioni simulate. Hardware e integrazioni sono definiti e quotati per ogni progetto.</small>
    </div>
    <div className="a1-experience-product">
      <div className="a1-experience-product-label"><span>IL BOX PRENDE VITA</span><p>Tocca lo schermo per aprire la demo</p></div>
      <Link className="a1-black-totem" href="/experience/giulia" target="_blank" rel="noreferrer" aria-label="Apri la demo interattiva di Giulia Experience">
        <div className="a1-black-totem-brand"><img src="/icon.svg" alt="" /><span>AvatarOne<small>EXPERIENCE BOX</small></span><span className="a1-black-totem-camera" aria-hidden="true" /></div>
        <div className="a1-black-totem-screen"><img src="https://gwqkqbmwanbyqwhvvdup.supabase.co/storage/v1/object/public/avatar-media/giulia-new-digital-app/image-1794302805384-assistente-ai-in-studio-futuristico.png" alt="Giulia a figura intera, assistente per l’accoglienza nel box AvatarOne" loading="lazy" /><span className="a1-black-totem-badge">GIULIA / DEMO SANITARIA</span><span className="a1-black-totem-play"><span aria-hidden="true">▶</span>Avvia l’esperienza</span></div>
        <div className="a1-black-totem-footer"><span aria-hidden="true">◌</span> Una domanda. Una conversazione.</div>
      </Link>
      <p className="a1-experience-prompt"><span>PROVA A CHIEDERE</span>«Dove si trova l’ambulatorio di cardiologia?»</p>
    </div>
  </section>
  <section className="section" id="funzioni"><div className="section-head"><p className="eyebrow">Un prodotto, molti settori</p><h2>Non è un semplice chatbot.</h2><p>AvatarOne unisce identità visiva, conversazione, conoscenza aziendale e acquisizione contatti.</p></div><div className="feature-grid">{features.map(([icon,title,text])=><article className="feature-card" key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section className="section" id="settori"><div className="section-head"><p className="eyebrow">Soluzioni verticali</p><h2>Scopri AvatarOne nel tuo settore.</h2><p>Ogni pagina mostra un esempio concreto di avatar, conversazione e percorso di contatto pensato per quella categoria.</p></div><div className="sector-grid home-sector-grid">{sectorCards.map(([slug,title,text,poster,assistant],index)=><Link className={"sector-card sector-card-"+slug} href={"/"+slug} key={slug}><div className="sector-card-visual"><img src={poster} alt={assistant+", avatar AI per "+title}/><span>{assistant}</span></div><div className="sector-card-copy"><small>0{index+1} · Soluzione</small><h3>{title}</h3><p>{text}</p><b>Scopri la soluzione →</b></div></Link>)}</div></section>
  <section className="dark-section" id="come-funziona"><div className="inner"><div className="section-head"><p className="eyebrow">Percorso gestito</p><h2>Tu ci racconti l’idea. Noi costruiamo la persona.</h2></div><div className="steps-grid">{[["1","Briefing","Definiamo obiettivi, pubblico e stile."],["2","Creazione","Produciamo identità, video, voce e interfaccia."],["3","Conoscenza","Colleghiamo sito, PDF e informazioni aziendali."],["4","Pubblicazione","Consegniamo sempre un link condivisibile; per Experience anche installazioni fisiche su misura."]].map(([n,t,d])=><article className="step-card" key={n}><span>{n}</span><h3 style={{color:"#07131a"}}>{t}</h3><p style={{color:"#66737c"}}>{d}</p></article>)}</div></div></section>
  <section className="section" id="pacchetti"><div className="section-head"><p className="eyebrow">Soluzioni commerciali</p><h2>Tre pacchetti AI. Dall'avatar essenziale all'esperienza immersiva.</h2><p>Tutti i pacchetti includono l'intelligenza artificiale. Smart offre chat, voce e conoscenza aziendale; Connect aggiunge la possibilità di integrare software e gestionali tramite API; Experience include avatar animato, ascolto continuo e modalità immersiva. Le integrazioni sono progettate e quotate separatamente. Tutti includono un link pubblico condivisibile.</p></div><div className="pricing-grid">{plans.map(plan=><article className={"price-card"+(plan.featured?" featured":"")} key={plan.name}><p className="eyebrow">{plan.name}</p><h3>{plan.price}</h3><span className="price"><small>{plan.monthly}</small></span><ul>{plan.items.map(item=><li key={item}>{item}</li>)}</ul><a href="#contatti">Contatta l’azienda</a></article>)}</div><div className="contract-card"><div><p className="eyebrow">Trasparenza commerciale</p><h3>Consulta il contratto AvatarOne</h3><p>Leggi il contratto aggiornato per Smart, Connect ed Experience. Puoi stamparlo o salvarlo come PDF; nessun pagamento online automatico.</p></div><a href="/contratto">Leggi e scarica il contratto</a></div></section>
  <section className="section contact-wrap" id="contatti"><div><p className="eyebrow">Parliamone</p><h2>Raccontaci il tuo avatar.</h2><p className="hero-copy">Compila il modulo: la richiesta viene registrata e preparata direttamente per WhatsApp sul numero di Antonio Celotto.</p><p><strong>New Digital App</strong><br/>Via Antonio Bertola 59, Torino<br/>P. IVA 12254210011</p></div><ContactForm /></section>
  <footer className="footer">© 2026 New Digital App · AvatarOne <Link href="/privacy">Privacy</Link><Link href="/terms">Condizioni</Link><a href="/contratto">Contratto aggiornato</a><Link href="/admin-login">Accesso amministratore</Link></footer>
</main>}
