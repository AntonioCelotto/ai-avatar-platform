import { Assistant } from "./assistant";
import { avatarSrc } from "./avatar-data";

export default function Home() {
  return (
    <main className="mobile-chat-shell">
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label="Avatar AI Mia">
        <header className="topbar">
          <div>
            <span className="eyebrow">New Digital App</span>
            <h1>Mia</h1>
            <p>Intelligenza artificiale semantica</p>
          </div>
          <span className="live-pill">Live</span>
        </header>

        <div className="hero-avatar">
          <img alt="Avatar AI Mia" src={avatarSrc} />
          <div className="voice-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-avatar__caption">
            <strong>Ti ascolto.</strong>
            <span>Scrivi o parla: trasformo le idee in esperienze vive.</span>
          </div>
        </div>
      </section>

      <section className="assistant-workspace" aria-label="Chat con avatar AI">
        <Assistant />
      </section>
    </main>
  );
}
