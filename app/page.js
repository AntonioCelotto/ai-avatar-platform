import { Assistant } from "./assistant";
import { AvatarVideo } from "./avatar-video";

export default function Home() {
  return (
    <main className="mobile-chat-shell">
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label="Mia.Ai">
        <div className="avatar-frame" aria-label="Avatar Mia">
          <AvatarVideo />
          <div className="mia-name-mark" aria-hidden="true">
            <span>MIA</span>
          </div>
        </div>
      </section>

      <section className="assistant-workspace" aria-label="Chat con Mia.Ai">
        <Assistant />
      </section>
    </main>
  );
}
