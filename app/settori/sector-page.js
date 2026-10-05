import Link from "next/link";
import ContactForm from "../contact-form";
import { sectors } from "./sector-data";
import "../landing.css";
import "./sector-pages.css";

export default function SectorPage({ sector }) {
  const item = sectors[sector];

  return <main className={`landing sector-landing sector-${sector}`}>
    <nav className="landing-nav">
      <Link className="brand" href="/"><img className="landing-brand-mark" src="/icon-512.png" alt="Icona M di AvatarOne"/><div>AvatarOne <small>by New Digital App</small></div></Link>
      <div className="nav-links"><Link href="/#settori">Settori</Link><a href="#vantaggi">Vantaggi</a><a href="#contatti">Contatti</a><Link href="/mia">Prova MIA</Link><a className="nav-cta" href="#contatti">Richiedi una demo</a></div>
    </nav>

    <section className="sector-hero">
      <div className="sector-copy">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1>{item.title}</h1>
        <p className="hero-copy">{item.description}</p>
        <div className="hero-actions"><a className="primary-cta" href="#contatti">Richiedi una demo personalizzata</a><Link className="secondary-cta" href="/mia">Prova un AvatarOne</Link></div>
        <div className="trust-row"><span>Voce e chat</span><span>Conoscenza da sito e PDF</span><span>Contatto WhatsApp</span></div>
      </div>

      <div className="phone-card sector-phone" aria-label={`Anteprima AvatarOne ${sector}`}>
        <div className="phone-screen">
          <div className="phone-topline"><div><span className="live-pill">● ONLINE</span><h3>{item.assistant}</h3></div><span className="voice-status">◉ In ascolto</span></div>
          <div className="avatar-orb"><video autoPlay muted loop playsInline preload="metadata" poster={item.poster} aria-label={`Video dimostrativo ${item.assistant}`}><source src={item.video} type="video/mp4" /></video><span className="avatar-video-glow"/><span className="speaking-pill"><i/><i/><i/><i/> sta parlando</span></div>
          <div className="demo-chat"><p className="chat-user">{item.question}</p><p className="chat-mia"><strong>{item.assistant}</strong> {item.answer}</p></div>
          <div className="demo-input"><span>Scrivi un messaggio…</span><b>↑</b></div>
        </div>
      </div>
    </section>

    <section className="section" id="vantaggi"><div className="section-head"><p className="eyebrow">Pensato per il tuo settore</p><h2>Più servizio, più contatti, meno attese.</h2></div><div className="sector-benefits">{item.benefits.map(([icon,title,text])=><article className="feature-card" key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="dark-section sector-usecases"><div className="inner"><div><p className="eyebrow">Una conoscenza su misura</p><h2>Il tuo AvatarOne impara dalla tua azienda.</h2><p>Carichiamo sito, PDF, cataloghi e informazioni operative in un ambiente separato e aggiornabile.</p></div><ul>{item.useCases.map(useCase=><li key={useCase}>{useCase}</li>)}</ul></div></section>

    <section className="section contact-wrap" id="contatti"><div><p className="eyebrow">La tua demo di settore</p><h2>Facci vedere la tua azienda.</h2><p className="hero-copy">Inviaci il sito e il materiale principale: prepareremo una proposta AvatarOne personalizzata per il tuo settore.</p><p><strong>New Digital App</strong><br/>Via Antonio Bertola 59, Torino<br/>P. IVA 12254210011</p></div><ContactForm /></section>
    <footer className="footer">© 2026 New Digital App · AvatarOne <Link href="/">Home</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Condizioni</Link></footer>
  </main>;
}
