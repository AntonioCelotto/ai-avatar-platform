import { Assistant } from "./assistant";

export default function DemoPage() {
  return (
    <main className="demo-page">
      <section className="restaurant-stage" aria-label="Anteprima ristorante">
        <div className="restaurant-stage__content">
          <span className="eyebrow">Demo ristorante</span>
          <h1>Trattoria Demo</h1>
          <p>
            Chiedi consigli sul menu, allergeni o abbinamenti. L&apos;assistente
            prepara un riepilogo ordine pronto da inviare su WhatsApp.
          </p>
          <div className="restaurant-badges" aria-label="Funzioni disponibili">
            <span>Menu intelligente</span>
            <span>Allergeni</span>
            <span>Multilingua</span>
            <span>WhatsApp ordine</span>
          </div>
        </div>
      </section>
      <section className="assistant-workspace" aria-label="Assistente AI">
        <Assistant />
      </section>
    </main>
  );
}
