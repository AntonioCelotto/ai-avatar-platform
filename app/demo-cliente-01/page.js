import { Assistant } from "../assistant";
import { AvatarVideo } from "../avatar-video";
import { getTenantPublicConfig } from "../tenant-config";

export const metadata = {
  title: "EPM - Demo Cliente 01",
  description: "Simulazione cliente per avatar AI configurabile.",
  icons: {
    icon: [{ url: "/epm-icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/epm-icon.svg", type: "image/svg+xml" }]
  }
};

export default function DemoClientPage() {
  const tenant = getTenantPublicConfig("demo-cliente-01");

  return (
    <main className="mobile-chat-shell" style={tenant.theme}>
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label={tenant.assistantName}>
        <div className="avatar-frame" aria-label={`Avatar ${tenant.spokenAssistantName}`}>
          <AvatarVideo
            label={`Avatar video ${tenant.spokenAssistantName}`}
            poster={tenant.avatarPoster}
            src={tenant.avatarVideo}
          />
          <div className="mia-name-mark" aria-hidden="true">
            <span>{tenant.brandMark}</span>
          </div>
        </div>
      </section>

      <section className="assistant-workspace" aria-label={`Chat con ${tenant.assistantName}`}>
        <Assistant tenant={tenant} />
      </section>
    </main>
  );
}
