"use client";

import { useEffect, useState } from "react";
import { avatarSrc } from "./avatar-data";

const tenant = {
  slug: "new-digital-app",
  name: "New Digital App",
  assistantName: "Mia",
  whatsappPhone: "393457980259"
};

const suggestions = [
  "Cosa puoi fare per la mia azienda?",
  "Come impari dal sito del cliente?",
  "Posso caricarti un PDF o collegarti a un gestionale?"
];

export function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ciao, sono Mia, l'avatar AI di New Digital App. Posso spiegarti come posso aiutare un cliente, imparare da sito, documenti e collegamenti API."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderDraft, setOrderDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);

  useEffect(() => {
    setCanUseSpeech(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );
  }, []);

  const whatsappText =
    orderDraft ||
    `Ciao, vorrei informazioni sull'avatar AI di ${tenant.name}.`;
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
            "Non riesco a rispondere in questo momento. Puoi comunque inviare una richiesta su WhatsApp."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startVoiceInput() {
    if (!canUseSpeech || listening) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);

    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setInput(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <img alt="" className="avatar-photo" src={avatarSrc} />
        <div className="assistant-title">
          <strong>{tenant.assistantName}</strong>
          <span>Avatar AI di {tenant.name}</span>
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
            <div className="message message--assistant">Sto ragionando...</div>
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
          aria-label="Usa microfono"
          className={`icon-button ${listening ? "is-listening" : ""}`}
          disabled={!canUseSpeech || loading}
          onClick={startVoiceInput}
          title={canUseSpeech ? "Parla con Mia" : "Microfono non disponibile"}
          type="button"
        >
          {listening ? "Rec" : "Mic"}
        </button>
        <input
          aria-label="Messaggio"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Scrivi o parla con Mia..."
          value={input}
        />
        <button aria-label="Invia" className="send-button" type="submit">
          Invia
        </button>
      </form>

      <div className="order-bar">
        <span>
          {orderDraft
            ? "Riepilogo pronto per WhatsApp"
            : "Puoi chiedere informazioni o preparare una richiesta cliente."}
        </span>
        <a className="whatsapp-link" href={whatsappUrl} rel="noreferrer" target="_blank">
          WhatsApp
        </a>
      </div>
    </div>
  );
}
