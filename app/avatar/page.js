import Link from "next/link";
import ResponsiveNav from "../responsive-nav";
import { sectorCards } from "../settori/sector-data";
import "../landing.css";
import "../settori/sector-pages.css";

export const metadata = {
  title: "Avatar AI per aziende e settori | AvatarOne",
  description: "Scopri gli avatar AI AvatarOne per hotel, benessere, ristorazione e agenzie immobiliari.",
  alternates: { canonical: "https://www.avatarone.it/avatar" }
};

export default function AvatarSolutionsPage(){return <main className="landing avatar-hub">
  <ResponsiveNav />
  <section className="avatar-hub-hero"><p className="eyebrow">AvatarOne · Soluzioni verticali</p><h1>Una persona digitale per <span className="gradient-text">ogni settore.</span></h1><p className="hero-copy">Scopri come un avatar AI può parlare, scrivere, conoscere la tua azienda e trasformare ogni conversazione in un contatto concreto.</p><div className="hero-actions"><a className="primary-cta" href="#settori">Scegli il tuo settore</a><Link className="secondary-cta" href="/mia">Prova MIA</Link></div></section>
  <section className="section avatar-hub-sectors" id="settori"><div className="section-head"><p className="eyebrow">Le prime quattro soluzioni</p><h2>Guarda l’avatar già nel suo ambiente.</h2><p>Ogni pagina contiene un video dimostrativo, una conversazione reale e gli utilizzi più importanti per quella categoria.</p></div><div className="sector-grid">{sectorCards.map(([slug,title,text],index)=><Link className="sector-card" href={`/${slug}`} key={slug}><small>0{index+1} · Avatar AI</small><h3>{title}</h3><p>{text}</p><b>Apri la landing page →</b></Link>)}</div></section>
  <section className="dark-section avatar-hub-cta"><div className="inner"><div><p className="eyebrow">Non trovi il tuo settore?</p><h2>Creiamo insieme una nuova categoria.</h2><p>AvatarOne può essere configurato anche per fiere, formazione, sanità, retail, turismo, servizi e assistenza clienti.</p></div><a className="primary-cta" href="/#contatti">Richiedi una demo personalizzata</a></div></section>
  <footer className="footer">© 2026 New Digital App · AvatarOne <Link href="/">Home</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Condizioni</Link></footer>
</main>}
