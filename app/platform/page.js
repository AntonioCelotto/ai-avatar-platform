import { tenants } from "../tenant-config";
import "./platform.css";

const stats = [
  { label: "Clienti attivi", value: tenants.length.toString(), trend: "Base stabile" },
  { label: "Avatar creati", value: tenants.length.toString(), trend: "MIA + Francesca" },
  { label: "Conversazioni", value: "Live", trend: "Chat operative" },
  { label: "Documenti", value: "PDF", trend: "Knowledge attiva" }
];

const modules = [
  "Dashboard",
  "Clienti",
  "Avatar",
  "Libreria AI",
  "Documenti",
  "Voci",
  "Video Avatar",
  "Statistiche",
  "Impostazioni"
];

const categoryMap = {
  "new-digital-app": "Business",
  "demo-cliente-01": "Centro Anziani"
};

const voiceMap = {
  "new-digital-app": "OpenAI",
  "demo-cliente-01": "ElevenLabs"
};

const statusMap = {
  "new-digital-app": "Stabile",
  "demo-cliente-01": "Stabile"
};

const productModules = [
  ["Multi tenant", "Ogni cliente ha nome, avatar, voce, colori e prompt separati."],
  ["Video avatar", "Supporto per video dedicati caricati nella cartella pubblica."],
  ["Voce AI", "OpenAI per voci standard, ElevenLabs per voci clonate."],
  ["Memoria locale", "Ricordo nome, hobby, preferenze e memoria emotiva."],
  ["Documenti", "Base pronta per PDF, FAQ, cataloghi e documentazione cliente."],
  ["Dashboard", "Prima interfaccia per controllare clienti e stato piattaforma."]
];

const nextActions = [
  "Collegare clienti al database Supabase",
  "Creare form Nuovo Cliente",
  "Salvare configurazione avatar senza modificare codice",
  "Gestire upload video e documenti dalla dashboard",
  "Aggiungere statistiche conversazioni"
];

export default function PlatformDashboard() {
  return (
    <main className="platform-shell">
      <aside className="platform-sidebar">
        <div className="platform-logo">
          <span>NDA</span>
          <div>
            <strong>Avatar Platform</strong>
            <small>New Digital App</small>
          </div>
        </div>

        <nav className="platform-nav" aria-label="Menu piattaforma">
          {modules.map((module, index) => (
            <a className={index === 0 ? "is-active" : ""} href={`#${module.toLowerCase().replaceAll(" ", "-")}`} key={module}>
              {module}
            </a>
          ))}
        </nav>
      </aside>

      <section className="platform-main">
        <header className="platform-hero">
          <div>
            <p className="platform-kicker">Versione 2.0 in costruzione</p>
            <h1>NDA Avatar Platform</h1>
            <p>
              La base SaaS per creare, configurare e vendere avatar AI personalizzati per ogni settore,
              senza toccare ogni volta il codice.
            </p>
          </div>
          <a className="platform-primary" href="#nuovo-cliente">+ Nuovo Cliente</a>
        </header>

        <section className="platform-stats" aria-label="Statistiche principali">
          {stats.map((stat) => (
            <article className="platform-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.trend}</small>
            </article>
          ))}
        </section>

        <section className="platform-grid-two">
          <article className="platform-section" id="dashboard">
            <div className="platform-section-head">
              <div>
                <p className="platform-kicker">Stato prodotto</p>
                <h2>Base stabile</h2>
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

          <article className="platform-section">
            <div className="platform-section-head">
              <div>
                <p className="platform-kicker">Prossime azioni</p>
                <h2>Roadmap operativa</h2>
              </div>
            </div>
            <ol className="platform-action-list">
              {nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </article>
        </section>

        <section className="platform-section" id="clienti">
          <div className="platform-section-head">
            <div>
              <p className="platform-kicker">Clienti</p>
              <h2>Avatar attivi</h2>
            </div>
            <button type="button">Esporta lista</button>
          </div>

          <div className="platform-table">
            <div className="platform-row platform-row--head">
              <span>Cliente</span>
              <span>Categoria</span>
              <span>Avatar</span>
              <span>Voce</span>
              <span>Stato</span>
              <span>Link</span>
            </div>
            {tenants.map((tenant) => (
              <div className="platform-row" key={tenant.slug}>
                <span>
                  <strong>{tenant.name}</strong>
                  <small>{tenant.slug}</small>
                </span>
                <span>{categoryMap[tenant.slug] || "Generico"}</span>
                <span>{tenant.spokenAssistantName}</span>
                <span>{voiceMap[tenant.slug] || "OpenAI"}</span>
                <span><mark>{statusMap[tenant.slug] || "Bozza"}</mark></span>
                <a href={tenant.slug === "new-digital-app" ? "/" : `/${tenant.slug}`}>Apri</a>
              </div>
            ))}
          </div>
        </section>

        <section className="platform-section" id="nuovo-cliente">
          <div className="platform-section-head">
            <div>
              <p className="platform-kicker">Wizard</p>
              <h2>Nuovo Cliente</h2>
            </div>
            <span className="platform-soft-label">Prossimo sviluppo</span>
          </div>

          <div className="platform-wizard">
            {[
              ["1", "Dati azienda", "Nome cliente, categoria, logo, dominio."],
              ["2", "Avatar", "Nome assistente, video, poster, colori."],
              ["3", "Voce", "OpenAI, ElevenLabs o voce clonata."],
              ["4", "Conoscenza", "PDF, FAQ, sito web e documenti."],
              ["5", "Pubblica", "Genera link e attiva il cliente."]
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
