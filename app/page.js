import { Assistant } from "./assistant";
import { avatarSrc } from "./avatar-data";

const avatarOptions = [
  { label: "Donna", active: true },
  { label: "Uomo", active: false }
];

const characterOptions = ["Educata", "Professionale", "Diretta", "Empatica"];

export default function Home() {
  return (
    <main className="mobile-shell">
      <section className="avatar-studio" aria-label="Configurazione avatar">
        <header className="topbar">
          <div>
            <span className="eyebrow">New Digital App</span>
            <h1>Crea il tuo avatar AI</h1>
          </div>
          <span className="live-pill">Online</span>
        </header>

        <div className="hero-avatar">
          <img alt="Avatar AI Mia" src={avatarSrc} />
          <div className="hero-avatar__caption">
            <strong>Mia</strong>
            <span>Assistente AI per clienti e siti web</span>
          </div>
        </div>

        <div className="config-panel" aria-label="Impostazioni avatar">
          <div className="field-group">
            <label>Tipo avatar</label>
            <div className="segmented">
              {avatarOptions.map((option) => (
                <button
                  className={option.active ? "is-active" : ""}
                  key={option.label}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="avatar-name">Nome avatar</label>
            <input id="avatar-name" readOnly value="Mia" />
          </div>

          <div className="field-group">
            <label>Carattere</label>
            <div className="chip-grid">
              {characterOptions.map((option) => (
                <button
                  className={option === "Professionale" ? "is-active" : ""}
                  key={option}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="source-list" aria-label="Fonti di apprendimento">
            <div>
              <strong>Sito collegato</strong>
              <span>newdigitalapp.it</span>
            </div>
            <div>
              <strong>API cliente</strong>
              <span>Pronta per gestionale o CRM</span>
            </div>
            <div>
              <strong>PDF e documenti</strong>
              <span>Prossimo step: caricamento file</span>
            </div>
          </div>
        </div>
      </section>

      <section className="assistant-workspace" aria-label="Chat con avatar AI">
        <Assistant />
      </section>
    </main>
  );
}
