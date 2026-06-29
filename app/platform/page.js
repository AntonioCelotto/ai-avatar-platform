import { tenants } from "../tenant-config";
import { isSupabaseConfigured, listAvatarClients } from "../lib/supabase-server";
import "./platform.css";

const modules = [
  ["Dashboard", "🏠"],
  ["Clienti", "👥"],
  ["Persone Digitali", "👤"],
  ["DNA Studio", "🧬"],
  ["Brain Studio", "🧠"],
  ["Emotion Engine", "❤️"],
  ["Knowledge", "📄"],
  ["Launch Center", "🚀"],
  ["Analytics", "📊"],
  ["Billing", "💳"],
  ["Marketplace", "🛒"],
  ["Settings", "⚙️"]
];

const quickActions = [
  ["Crea Persona Digitale", "Configura un nuovo avatar con AI Builder", "✨"],
  ["Launch Center", "Controlla pubblicazione, dominio, QR e WhatsApp", "🚀"],
  ["DNA Studio", "Modella empatia, tecnica, calore e vendita", "🧬"],
  ["Marketplace", "Scegli Brain, voci, avatar e integrazioni", "🛒"]
];

const productModules = [
  ["Digital Identity", "Ogni cliente ha una persona digitale con identità, voce, DNA e cervello."],
  ["Brain Engine", "Business Brain, RSA Brain e futuri cervelli verticali per ogni settore."],
  ["Emotion Engine", "Memoria emotiva, supporto proattivo e riconoscimento degli stati emotivi."],
  ["Launch Center", "Checklist di pubblicazione per dominio, SSL, WhatsApp, QR, API e analytics."],
  ["Mobile First", "Interfaccia pensata prima per smartphone e poi per desktop."],
  ["SaaS Core", "Clienti, profili, voci, documenti, analytics e abbonamenti su Supabase."]
];

const nextActions = [
  "Creare form Nuovo Cliente mobile-first",
  "Costruire scheda Persona Digitale",
  "Rendere operativo il Launch Center",
  "Aggiungere DNA Studio con slider grandi",
  "Collegare upload video, documenti e QR Code"
];

function fallbackClients() {
  return tenants.map((tenant) => ({
    id: tenant.slug,
    slug: tenant.slug,
    company_name: tenant.name,
    category: tenant.slug === "demo-cliente-01" ? "Centro Anziani" : "Business",
    status: "active",
    avatar_name: tenant.assistantName,
    spoken_avatar_name: tenant.spokenAssistantName,
    avatar_video_url: tenant.avatarVideo,
    voice_provider: tenant.slug === "demo-cliente-01" ? "elevenlabs" : "openai",
    voice_label: tenant.slug === "demo-cliente-01" ? "Francesca RSA" : "OpenAI Marin",
    brand_mark: tenant.brandMark,
    features: tenant.slug === "demo-cliente-01"
      ? { memory: true, emotionalMemory: true, elevenlabs: true, animatorMode: true }
      : { memory: true, documents: true, whatsapp: true }
  }));
}

async function getPlatformClients() {
  if (!isSupabaseConfigured()) {
    return { clients: fallbackClients(), source: "tenant-config" };
  }

  try {
    const clients = await listAvatarClients();
    return {
      clients: clients?.length ? clients : fallbackClients(),
      source: clients?.length ? "supabase" : "tenant-config"
    };
  } catch {
    return { clients: fallbackClients(), source: "tenant-config" };
  }
}

function getClientUrl(client) {
  return client.slug === "new-digital-app" ? "/" : `/${client.slug}`;
}

function getStatusLabel(status) {
  if (status === "active") return "Online";
  if (status === "draft") return "Bozza";
  if (status === "paused") return "Pausa";
  return "Archivio";
}

function getClientIcon(client) {
  if (client.category?.toLowerCase().includes("anziani")) return "❤️";
  if (client.category?.toLowerCase().includes("hotel")) return "🏨";
  if (client.category?.toLowerCase().includes("business")) return "💼";
  return "👤";
}

export default async function PlatformDashboard() {
  const { clients, source } = await getPlatformClients();
  const activeClients = clients.filter((client) => client.status === "active").length;
  const stats = [
    { label: "Clienti", value: activeClients.toString(), trend: source === "supabase" ? "Supabase" : "Fallback" },
    { label: "Persone Digitali", value: clients.length.toString(), trend: "Online" },
    { label: "Launch", value: "Beta", trend: "Checklist" },
    { label: "Ricavi", value: "€ 0", trend: "Billing ready" }
  ];

  return (
    <main className="platform-shell platform-shell--mobile-first">
      <aside className="platform-sidebar">
        <div className="platform-logo">
          <span>A1</span>
          <div>
            <strong>AvatarOne</strong>
            <small>by New Digital App</small>
          </div>
        </div>

        <nav className="platform-nav" aria-label="Menu piattaforma">
          {modules.map(([module, icon], index) => (
            <a className={index === 0 ? "is-active" : ""} href={`#${module.toLowerCase().replaceAll(" ", "-")}`} key={module}>
              <span>{icon}</span>
              {module}
            </a>
          ))}
        </nav>
      </aside>

      <section className="platform-main">
        <header className="platform-mobile-topbar">
          <div>
            <span>AvatarOne</span>
            <strong>Studio</strong>
          </div>
          <a href="#nuovo-cliente">＋</a>
        </header>

        <section className="platform-hero platform-hero--app">
          <div>
            <p className="platform-kicker">Mobile First SaaS</p>
            <h1>AvatarOne</h1>
            <p>
              Crea, gestisci e pubblica Persone Digitali da smartphone, tablet o desktop.
            </p>
            <span className="platform-source">Sorgente dati: {source === "supabase" ? "Supabase" : "tenant-config fallback"}</span>
          </div>
          <a className="platform-primary platform-primary--large" href="#nuovo-cliente">✨ Crea Persona Digitale</a>
        </section>

        <section className="platform-stats platform-stats--mobile" aria-label="Statistiche principali">
          {stats.map((stat) => (
            <article className="platform-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </article>
          ))}
        </section>

        <section className="platform-quick-actions" aria-label="Azioni rapide">
          {quickActions.map(([title, text, icon]) => (
            <a className="platform-action-card" href="#nuovo-cliente" key={title}>
              <span>{icon}</span>
              <strong>{title}</strong>
              <small>{text}</small>
            </a>
          ))}
        </section>

        <section className="platform-section" id="clienti">
          <div className="platform-section-head">
            <div>
              <p className="platform-kicker">CRM Clienti</p>
              <h2>Persone Digitali attive</h2>
            </div>
            <button type="button">Filtri</button>
          </div>

          <div className="platform-client-grid">
            {clients.map((client) => (
              <article className="platform-client-card" key={client.slug}>
                <div className="platform-client-head">
                  <div className="platform-client-avatar">{getClientIcon(client)}</div>
                  <mark>{getStatusLabel(client.status)}</mark>
                </div>
                <h3>{client.company_name}</h3>
                <p>{client.spoken_avatar_name || client.avatar_name}</p>
                <div className="platform-client-meta">
                  <span>{client.category || "Generico"}</span>
                  <span>{client.voice_label || client.voice_provider || "OpenAI"}</span>
                </div>
                <div className="platform-client-launch">
                  <span>Launch</span>
                  <strong>{client.status === "active" ? "75%" : "25%"}</strong>
                </div>
                <a href={getClientUrl(client)}>Apri Persona</a>
              </article>
            ))}
          </div>
        </section>

        <section className="platform-grid-two">
          <article className="platform-section" id="dashboard">
            <div className="platform-section-head">
              <div>
                <p className="platform-kicker">Core</p>
                <h2>Digital Human OS</h2>
              </div>
              <mark className="platform-status">Live</mark>
            </div>
            <div className="platform-module-grid">
              {productModules.map(([title, text]) => (
                <div className="platform-mini-card" key={title}>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="platform-section" id="launch-center">
            <div className="platform-section-head">
              <div>
                <p className="platform-kicker">Deploy</p>
                <h2>Launch Center</h2>
              </div>
            </div>
            <div className="platform-launch-list">
              {["Avatar", "Voce", "Brain", "Knowledge", "Memoria", "Dominio", "WhatsApp", "QR Code"].map((item, index) => (
                <div className="platform-launch-item" key={item}>
                  <span className={index < 5 ? "is-green" : index < 7 ? "is-yellow" : "is-red"} />
                  <strong>{item}</strong>
                  <small>{index < 5 ? "Pronto" : index < 7 ? "Da collegare" : "Da generare"}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="platform-section" id="nuovo-cliente">
          <div className="platform-section-head">
            <div>
              <p className="platform-kicker">AvatarOne Creator</p>
              <h2>Nuova Persona Digitale</h2>
            </div>
            <span className="platform-soft-label">Prossimo sviluppo</span>
          </div>

          <div className="platform-creator-card">
            <label htmlFor="creatorPrompt">Descrivi cosa vuoi creare</label>
            <textarea id="creatorPrompt" placeholder="Esempio: voglio un assistente per una RSA con voce femminile, memoria emotiva e giochi cognitivi." />
            <button type="button">✨ Crea con AI</button>
          </div>

          <div className="platform-wizard">
            {[
              ["1", "Azienda", "Nome, categoria, referente e sito."],
              ["2", "Identità", "Nome, ruolo, DNA, tono e stile."],
              ["3", "Voce", "OpenAI, ElevenLabs o voce clonata."],
              ["4", "Knowledge", "PDF, FAQ, sito web e documenti."],
              ["5", "Launch", "Dominio, QR, WhatsApp, SSL e pubblicazione."]
            ].map(([number, title, text]) => (
              <article className="platform-step" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
