import CustomAssistant from "../avatar/[slug]/custom-assistant";

const tenant = {
  slug: "hotel-quark",
  name: "Quark Hotel Milano",
  assistantName: "Quark Concierge",
  spokenAssistantName: "Quark Concierge",
  welcomeMessage: "Benvenuto al Quark Hotel Milano. Sono la concierge digitale e posso aiutarti con camere, ristorazione, eventi e servizi dell’hotel.",
  inputPlaceholder: "Chiedi al Quark Hotel",
  avatarPoster: "/generated/quark-concierge.jpg",
  brandMark: "QUARK",
  suggestions: ["Quali camere avete?", "Organizzate meeting ed eventi?", "Dove si trova l’hotel?"],
  role: "Concierge digitale del Quark Hotel Milano",
  tone: "accogliente, elegante, professionale e sintetico",
  knowledgeUrl: "https://www.quarkhotelmilano.com/",
  knowledgeSummary: "Il Quark Hotel Milano è un hotel quattro stelle full service in Via Lampedusa 11/A a Milano, a circa quattro chilometri dal Duomo e vicino all’Università Bocconi. Dispone di 283 camere, ristorazione, lounge bar, parcheggio e spazi per congressi ed eventi.",
  websiteKnowledge: "Quark Hotel Milano. Indirizzo: Via Lampedusa 11/A, Milano. Hotel quattro stelle full service, a circa 4 km dal Duomo e vicino all’Università Bocconi. Dispone di 283 camere. Il centro congressi offre circa 6.200 metri quadrati, 35 sale meeting, una plenaria fino a 1.400 posti e un anfiteatro da 600 posti. Sono presenti ristorante, ristorante per eventi, lounge bar, servizio grab-and-go, parcheggio e garage. La proposta gastronomica è italiana ed è guidata dallo chef Andrea Ribaldone. Contatti pubblicati: telefono +39 02 847391, email info@quarkhotelmilano.com. Per prezzi, disponibilità, orari e condizioni aggiornate occorre contattare direttamente l’hotel o consultare il sito ufficiale.",
  voice: "browser-female",
  theme: {
    "--accent": "#9b7a3d",
    "--accent-strong": "#735725",
    "--signal": "#d9c28d"
  }
};

export const metadata = {
  title: "Quark Concierge | Quark Hotel Milano",
  description: "Concierge digitale del Quark Hotel Milano"
};

export default function HotelQuarkPage() {
  return (
    <main className="mobile-chat-shell hotel-quark-shell" style={tenant.theme}>
      <section className="avatar-stage" aria-label={tenant.assistantName}>
        <div className="avatar-frame" aria-label="Avatar Quark Concierge">
          <img
            className="custom-avatar-image"
            src={tenant.avatarPoster}
            alt="Concierge digitale del Quark Hotel Milano"
          />
          <div className="mia-name-mark" aria-hidden="true"><span>{tenant.brandMark}</span></div>
        </div>
      </section>
      <section className="assistant-workspace" aria-label={`Chat con ${tenant.assistantName}`}>
        <CustomAssistant tenant={tenant} />
      </section>
    </main>
  );
}
