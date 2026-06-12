import { Assistant } from "./assistant";
import { avatarSrc } from "./avatar-data";

export default function Home() {
  return (
    <main className="mobile-chat-shell">
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label="Avatar AI Mia">
        <header className="topbar">
          <span className="brand-mark">N</span>
          <span className="eyebrow">New Digital App</span>
          <span className="profile-dot" aria-hidden="true" />
        </header>

        <div className="title-block">
          <h1>Mia</h1>
          <p>Intelligenza artificiale semantica</p>
        </div>

        <div className="hero-avatar">
          <img alt="Avatar AI Mia" src={avatarSrc} />
          <div className="avatar-motion-layer" aria-hidden="true">
            <span className="avatar-eye avatar-eye--left" />
            <span className="avatar-eye avatar-eye--right" />
            <span className="avatar-mouth" />
            <span className="avatar-breath" />
          </div>
          <div className="neon-ring" aria-hidden="true" />
          <div className="voice-badge">
            <span className="voice-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Voce attiva
          </div>
          <div className="hero-avatar__caption">
            <strong>Ti ascolto</strong>
          </div>
        </div>
      </section>

      <section className="assistant-workspace" aria-label="Chat con avatar AI">
        <Assistant />
      </section>
    </main>
  );
}
