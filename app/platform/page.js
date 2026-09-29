import Link from "next/link";
import { tenants } from "../tenant-config";
import { isSupabaseConfigured, listAvatarClients } from "../lib/supabase-server";
import { AvatarCreator } from "./avatar-creator";
import AvatarManager from "./avatar-manager";
import LogoutButton from "./logout-button";
import "./platform.css";

const modules = [
  ["Dashboard", "🏠", "#dashboard"],
  ["Persone Digitali", "👤", "#persone-digitali"],
  ["Knowledge", "📄", "/platform/knowledge"],
  ["Launch Center", "🚀", "#launch-center"]
];

function fallbackClients() {
  return tenants.map((tenant) => ({ id: tenant.slug, slug: tenant.slug, company_name: tenant.name, category: tenant.slug === "demo-cliente-01" ? "Centro Anziani" : "Business", status: "active", avatar_name: tenant.assistantName, spoken_avatar_name: tenant.spokenAssistantName, avatar_video_url: tenant.avatarVideo, media_mode: "video", voice_provider: tenant.slug === "demo-cliente-01" ? "elevenlabs" : "openai", voice_label: tenant.slug === "demo-cliente-01" ? "Francesca RSA" : "OpenAI Marin", brand_mark: tenant.brandMark, website: tenant.website, whatsapp_phone: tenant.whatsappPhone }));
}

async function getPlatformClients() {
  if (!isSupabaseConfigured()) return { clients: fallbackClients(), source: "locale" };
  try { const clients = await listAvatarClients(); return { clients: clients?.length ? clients : fallbackClients(), source: clients?.length ? "Supabase" : "locale" }; }
  catch { return { clients: fallbackClients(), source: "locale" }; }
}

function getClientUrl(client) {
  if (client.slug === "new-digital-app") return "/mia";
  if (client.slug === "demo-cliente-01") return "/demo-cliente-01";
  return `/avatar/${client.slug}`;
}

function statusLabel(status) { return status === "active" ? "Online" : status === "paused" ? "In pausa" : "Bozza"; }
function icon(client) { const category = String(client.category || "").toLowerCase(); return category.includes("anziani") ? "❤️" : category.includes("hotel") ? "🏨" : category.includes("business") ? "💼" : "👤"; }
function mediaLabel(client) { if (client.media_mode === "liveavatar") return client.liveavatar_avatar_id ? "LiveAvatar pronto" : "LiveAvatar da collegare"; if (client.media_mode === "video" || client.avatar_video_url) return "Video parlante"; if (client.media_mode === "image" || client.avatar_poster_url) return "Immagine statica"; return "Media da configurare"; }
function hasWhatsapp(client) { return Boolean(client.whatsapp_phone && client.whatsapp_phone !== "390000000000"); }
function launchProgress(client) { const checks = [Boolean(client.avatar_video_url || client.avatar_poster_url), Boolean(client.voice_provider), Boolean(client.website), hasWhatsapp(client), client.status === "active"]; return Math.round((checks.filter(Boolean).length / checks.length) * 100); }

export default async function PlatformDashboard() {
  const { clients, source } = await getPlatformClients();
  const active = clients.filter((client) => client.status === "active").length;
  const complete = clients.filter((client) => launchProgress(client) === 100).length;

  return <main className="platform-shell platform-shell--mobile-first">
    <aside className="platform-sidebar"><div className="platform-logo"><span>A1</span><div><strong>AvatarOne</strong><small>by New Digital App</small></div></div><nav className="platform-nav" aria-label="Menu piattaforma">{modules.map(([name, symbol, href], index) => <a className={index === 0 ? "is-active" : ""} href={href} key={name}><span>{symbol}</span>{name}</a>)}</nav><LogoutButton /></aside>
    <section className="platform-main">
      <header className="platform-mobile-topbar"><div><span>AvatarOne</span><strong>Studio</strong></div><a href="#nuovo-cliente">＋</a></header>
      <section className="platform-hero platform-hero--app" id="dashboard"><div><p className="platform-kicker">New Digital App · AI Studio</p><h1>Crea persone digitali.<br /><span>Semplicemente.</span></h1><p>Crea, istruisci, prova e pubblica ogni assistente da un unico pannello.</p><span className="platform-source">Sistema {source} · Protetto</span></div><a className="platform-primary platform-primary--large" href="#nuovo-cliente">✨ Crea Persona Digitale</a></section>
      <section className="platform-stats platform-stats--mobile" aria-label="Statistiche principali"><article className="platform-card"><span>Persone digitali</span><strong>{clients.length}</strong><small>Totali</small></article><article className="platform-card"><span>Online</span><strong>{active}</strong><small>Pubblicate</small></article><article className="platform-card"><span>Launch completo</span><strong>{complete}</strong><small>Pronte al 100%</small></article></section>
      <section className="platform-quick-actions" aria-label="Azioni rapide"><a className="platform-action-card" href="#nuovo-cliente"><span>✨</span><strong>Crea nuova AI</strong><small>Configura identità, media e voce</small></a><Link className="platform-action-card" href="/platform/knowledge"><span>📄</span><strong>Gestisci Knowledge</strong><small>PDF e siti per ogni assistente</small></Link><a className="platform-action-card" href="#launch-center"><span>🚀</span><strong>Controlla Launch</strong><small>Verifica cosa manca alla pubblicazione</small></a></section>
      <section className="platform-section" id="persone-digitali"><div className="platform-section-head"><div><p className="platform-kicker">Il tuo AI Team</p><h2>Persone digitali</h2></div><span className="platform-soft-label">{clients.length} AI</span></div><div className="platform-client-grid">{clients.map((client) => <article className="platform-client-card" key={client.slug}>
        <div className="platform-client-head"><div className="platform-client-avatar">{icon(client)}</div><mark>{statusLabel(client.status)}</mark></div>
        <div className="platform-client-title"><span>AI</span><div><h3>{client.spoken_avatar_name || client.avatar_name}</h3><p>{client.company_name}</p></div></div>
        <div className="platform-client-meta"><span>{client.category || "Generico"}</span><span>{client.voice_label || client.voice_provider || "Voce da scegliere"}</span></div>
        <div className="platform-media-state"><strong>{mediaLabel(client)}</strong><small>{client.media_mode === "image" ? "La foto non esegue il lip-sync" : client.media_mode === "liveavatar" ? "Movimento sincronizzato in tempo reale" : "Riproduzione durante la risposta"}</small></div>
        <div className="platform-client-launch"><span>Launch reale</span><strong>{launchProgress(client)}%</strong></div>
        <div className="platform-client-actions"><Link className="platform-open-button" href={getClientUrl(client)} target="_blank">Apri e prova {client.spoken_avatar_name || client.avatar_name} <span>↗</span></Link><Link className="platform-manage-link" href={`/platform/knowledge?client=${client.slug}`}>Gestisci conoscenza</Link></div>
        <AvatarManager client={client} />
      </article>)}</div></section>
      <section className="platform-section" id="launch-center"><div className="platform-section-head"><div><p className="platform-kicker">Controllo pubblicazione</p><h2>Launch Center</h2></div><span className="platform-soft-label">Dati reali</span></div><div className="launch-client-grid">{clients.map((client) => { const publicUrl = getClientUrl(client); const base = "https://www.avatarone.it"; return <article className="launch-client-card" key={client.slug}><div><strong>{client.spoken_avatar_name || client.avatar_name}</strong><small>{client.company_name}</small></div><ul><li className={client.avatar_video_url || client.avatar_poster_url ? "is-ready" : ""}>Avatar · {mediaLabel(client)}</li><li className={client.voice_provider ? "is-ready" : ""}>Voce · {client.voice_provider ? "Configurata" : "Da scegliere"}</li><li className={client.website ? "is-ready" : ""}>Sito · {client.website ? "Collegato" : "Da collegare"}</li><li className={hasWhatsapp(client) ? "is-ready" : ""}>WhatsApp · {hasWhatsapp(client) ? "Collegato" : "Da collegare"}</li><li className={client.status === "active" ? "is-ready" : ""}>Pubblicazione · {statusLabel(client.status)}</li></ul><div className="launch-actions"><Link href={publicUrl} target="_blank">Apri</Link><a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${base}${publicUrl}`)}`} target="_blank" rel="noreferrer">Genera QR</a></div></article>; })}</div></section>
      <section className="platform-section" id="nuovo-cliente"><div className="platform-section-head"><div><p className="platform-kicker">AvatarOne Creator</p><h2>Nuova persona digitale</h2></div><span className="platform-soft-label">Percorso guidato</span></div><AvatarCreator /><div className="platform-wizard">{[["1","Identità","Nome, azienda, ruolo e tono."],["2","Media","Foto statica, video o LiveAvatar."],["3","Voce","Voce OpenAI o campione autorizzato."],["4","Knowledge","Sito iniziale; PDF dopo il salvataggio."],["5","Launch","WhatsApp, test e pubblicazione."]].map(([number,title,text]) => <article className="platform-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    </section>
  </main>;
}
