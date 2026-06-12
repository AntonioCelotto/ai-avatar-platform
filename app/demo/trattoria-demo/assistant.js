"use client";

import { useState } from "react";

const tenant = {
  slug: "trattoria-demo",
  name: "Trattoria Demo",
  whatsappPhone: "393457980259"
};

const suggestions = [
  "Cosa mi consigli se voglio qualcosa di leggero?",
  "Avete piatti senza glutine?",
  "Preparami un ordine per due persone"
];

export function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ciao, sono Mia. Posso aiutarti a scegliere dal menu di Trattoria Demo, controllare allergeni e preparare l'ordine per WhatsApp."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderDraft, setOrderDraft] = useState("");

  const whatsappText =
    orderDraft || `Ciao, vorrei informazioni o ordinare da ${tenant.name}.`;
  const whatsappUrl = `https://wa.me/${tenant.whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;

  async function sendMessage(content) {
    const cleanContent = content.trim();
    if (!cleanContent || loading) return;

    const nextMessages = [...messages, { role: "user", content: cleanContent }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          messages: nextMessages
        })
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply }
      ]);
      if (data.orderDraft) setOrderDraft(data.orderDraft);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Non riesco a rispondere in questo momento. Puoi comunque inviare una richiesta al ristorante su WhatsApp."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <div className="avatar" aria-hidden="true">
          <span className="avatar__mouth" />
        </div>
        <div className="assistant-title">
          <strong>Mia</strong>
          <span>Assistente menu e ordini</span>
        </div>
        <span className="assistant-status">Online</span>
      </header>

      <div className="messages" aria-live="polite">
        <div className="message-list">
          {messages.map((message, index) => (
            <div className={`message message--${message.role}`} key={index}>
              {message.content}
            </div>
          ))}
          {loading ? (
            <div className="message message--assistant">Sto controllando il menu...</div>
          ) : null}
        </div>

        <div className="suggestions">
          {suggestions.map((suggestion) => (
            <button
              disabled={loading}
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
      >
        <button
          aria-label="Voce in arrivo nel prossimo step"
          className="icon-button"
          title="Voce in arrivo nel prossimo step"
          type="button"
        >
          Mic
        </button>
        <input
          aria-label="Messaggio"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Scrivi cosa vuoi ordinare..."
          value={input}
        />
        <button aria-label="Invia" className="send-button" type="submit">
          Invia
        </button>
      </form>

      <div className="order-bar">
        <span>
          {orderDraft
            ? "Ordine pronto da inviare"
            : "Il riepilogo ordine apparira' qui quando lo chiedi."}
        </span>
        <a className="whatsapp-link" href={whatsappUrl} rel="noreferrer" target="_blank">
          WhatsApp
        </a>
      </div>
    </div>
  );
}
