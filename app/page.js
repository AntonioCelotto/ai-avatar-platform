import { Assistant } from "./assistant";
import { AvatarVideo } from "./avatar-video";

export default function Home() {
  return (
    <main className="mobile-chat-shell">
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label="Mia.Ai">
        <div
          aria-label="Avatar Mia"
          style={{
            position: "relative",
            zIndex: 1,
            gridRow: "1 / 3",
            minHeight: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: 8,
            background: "transparent",
            boxShadow: "none"
          }}
        >
          <AvatarVideo />
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
