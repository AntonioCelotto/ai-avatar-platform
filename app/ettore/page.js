import CustomAssistant from "../avatar/[slug]/custom-assistant";

const tenant = {
  slug: "ettore",
  name: "New Digital App",
  assistantName: "Ettore",
  spokenAssistantName: "Ettore",
  welcomeMessage: "Ciao, sono Ettore di New Digital App. Posso aiutarti a scoprire i nostri prodotti e servizi digitali e capire quali sono più adatti alla tua azienda.",
  inputPlaceholder: "Scrivi a Ettore",
  avatarPoster: "/generated/ettore-avatar.svg",
  brandMark: "ETTORE",
  suggestions: ["Presentati", "Come puoi aiutare un’azienda?", "Parliamo del mio progetto"],
  role: "Presentare prodotti e servizi digitali alle aziende",
  tone: "professionale, chiaro e convincente",
  knowledgeSummary: "Ettore è l'assistente commerciale di New Digital App e presenta prodotti e servizi digitali alle aziende. Non deve inventare dettagli, prezzi o caratteristiche non presenti nelle informazioni disponibili.",
  voice: "openai",
  theme: { "--accent": "#1f6feb", "--accent-strong": "#174ea6", "--signal": "#64e9f7" }
};

export default function EttorePage() {
  return <main className="mobile-chat-shell" style={tenant.theme}>
    <section className="avatar-stage" aria-label="Ettore">
      <div className="avatar-frame" aria-label="Avatar Ettore">
        <img className="custom-avatar-image" alt="Avatar Ettore" src={tenant.avatarPoster} />
        <div className="mia-name-mark" aria-hidden="true"><span>{tenant.brandMark}</span></div>
      </div>
    </section>
    <section className="assistant-workspace" aria-label="Chat con Ettore"><CustomAssistant tenant={tenant} /></section>
  </main>;
}
