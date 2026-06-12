"use client";

import { useEffect, useRef, useState } from "react";
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
  const audioRef = useRef(null);
  const lastAutoSentRef = useRef("");
  const sendingRef = useRef(false);
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
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const whatsappText =
    orderDraft ||
    `Ciao, vorrei informazioni sull'avatar AI di ${tenant.name}.`;
  const whatsappUrl = `https://wa.me/${tenant.whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;

  useEffect(() => {
    setCanUseSpeech(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const cleanInput = input.trim();
    if (cleanInput.length < 2 || loading || listening || sendingRef.current) return;

    const timer = window.setTimeout(() => {
      if (lastAutoSentRef.current === cleanInput) return;
      lastAutoSentRef.current = cleanInput;
      sendMessage(cleanInput);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [input, loading, listening]);

  function cleanSpeechText(text) {
    return String(text || "")
      .replace(/RIEPILOGO_ORDINE[\s\S]*/g, "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/[>#_~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function speakWithBrowser(text, forceSpeak = false) {
    if ((!voiceEnabled && !forceSpeak) || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = cleanSpeechText(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "it-IT";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function speakReply(text, forceSpeak = false) {
    if (!forceSpeak && !voiceEnabled) return;

    const cleanText = cleanSpeechText(text);
    if (!cleanText) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText })
      });

      if (!response.ok) throw new Error("Speech generation failed");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch {
      speakWithBrowser(cleanText, true);
    }
  }

  async function sendMessage(content) {
    const cleanContent = content.trim();
    if (!cleanContent || loading || sendingRef.current) return;

    sendingRef.current = true;
    setVoiceEnabled(true);
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
      const reply =
        data.reply ||
        "Ho ricevuto il messaggio, ma non ho generato una risposta completa.";
      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply }
      ]);
      speakReply(reply, true);
      if (data.orderDraft) setOrderDraft(data.orderDraft);
    } catch {
      const fallbackText =
        "Non riesco a rispondere in questo momento. Puoi comunque inviare una richiesta su WhatsApp.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: fallbackText
        }
      ]);
      speakReply(fallbackText, true);
    } finally {
      sendingRef.current = false;
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
      const cleanText = text.trim();
      if (!cleanText) return;
      lastAutoSentRef.current = cleanText;
      setInput(cleanText);
      sendMessage(cleanText);
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
          placeholder="Scrivi: Mia risponde da sola..."
          value={input}
        />
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
