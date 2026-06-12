import { Assistant } from "./assistant";
import { avatarSrc } from "./avatar-data";

export default function Home() {
  return (
    <main className="mobile-chat-shell">
      <section className="avatar-stage" aria-label="Avatar AI Mia">
        <header className="topbar">
          <div>
            <span className="eyebrow">New Digital App</span>
            <h1>Parla con Mia</h1>
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
      </section>

      <section className="assistant-workspace" aria-label="Chat con avatar AI">
        <Assistant />
      </section>
    </main>
  );
}
