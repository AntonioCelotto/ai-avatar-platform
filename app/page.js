import { Assistant } from "./assistant";
import { avatarSrc } from "./avatar-data";

export default function Home() {
  return (
    <main className="mobile-chat-shell">
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label="Mia.Ai">
        <header className="topbar">
          <span className="brand-mark">M</span>
          <span className="eyebrow">Mia.Ai</span>
          <span className="profile-dot" aria-hidden="true" />
        </header>

        <div className="hero-avatar">
          <img alt="" src={avatarSrc} />
          <div className="avatar-motion-layer" aria-hidden="true">
            <span className="avatar-eye avatar-eye--left" />
            <span className="avatar-eye avatar-eye--right" />
            <span className="avatar-mouth" />
            <span className="avatar-breath" />
          </div>
          <div className="neon-ring" aria-hidden="true" />
        </div>

        <div className="voice-badge voice-badge--outside">
          <span className="voice-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Voce attiva
        </div>
      </section>

      <section className="assistant-workspace" aria-label="Chat con Mia.Ai">
        <Assistant />
      </section>
    </main>
  );
}
