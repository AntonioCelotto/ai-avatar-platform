"use client";

import { useEffect, useRef, useState } from "react";
import { avatarSrc } from "./avatar-data";

const tenant = {
  slug: "new-digital-app",
  name: "New Digital App",
  assistantName: "Mia.Ai",
  whatsappPhone: "393457980259"
};

const welcomeMessage =
  "Ciao, sono Mia.Ai cosa desideri?";

const suggestions = [
  "Immagina Mia.Ai sul mio sito",
  "Come emozioni un cliente?",
  "Vorrei vedere cosa sai fare"
];

export function Assistant() {
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const continuousVoiceRef = useRef(false);
  const lastAutoSentRef = useRef("");
  const sendingRef = useRef(false);
  const lipSyncFrameRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: welcomeMessage
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderDraft, setOrderDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);
  const [continuousVoice, setContinuousVoice] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const whatsappText =
    orderDraft ||
    `Ciao, vorrei informazioni sull'avatar AI di ${tenant.name}.`;
  const whatsappUrl = `https://wa.me/${tenant.whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;

  useEffect(() => {
    setCanUseSpeech(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );

    return () => {
      continuousVoiceRef.current = false;
      stopLipSync();
      delete document.documentElement.dataset.miaAvatarState;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try {
          recognitionRef.current.stop();
        } catch {
          recognitionRef.current = null;
        }
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const avatarState = speaking
      ? "speaking"
      : listening
        ? "listening"
        : loading
          ? "thinking"
          : continuousVoice
            ? "ready"
            : "idle";

    document.documentElement.dataset.miaAvatarState = avatarState;
  }, [continuousVoice, listening, loading, speaking]);

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

  function getFastSpeechText(text) {
    const cleanText = cleanSpeechText(text);
    if (cleanText.length <= 360) return cleanText;

    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];
    const preview = sentences.slice(0, 2).join(" ").trim();
    return (preview || cleanText).slice(0, 360).trim();
  }

  function stopLipSync() {
    if (lipSyncFrameRef.current) {
      window.cancelAnimationFrame(lipSyncFrameRef.current);
      lipSyncFrameRef.current = null;
    }
    document.documentElement.style.setProperty("--mia-mouth-open", "0");
  }

  function startLipSync() {
    stopLipSync();
    const startedAt = performance.now();

    const animate = (now) => {
      const elapsed = (now - startedAt) / 1000;
      const phrasePulse = Math.sin(elapsed * 18) * 0.5 + 0.5;
      const syllablePulse = Math.sin(elapsed * 31 + 0.8) * 0.5 + 0.5;
      const pausePulse = Math.sin(elapsed * 5.2) * 0.5 + 0.5;
      const open = Math.max(0.06, Math.min(1, phrasePulse * 0.58 + syllablePulse * 0.34 + pausePulse * 0.08));

      document.documentElement.style.setProperty("--mia-mouth-open", open.toFixed(3));
      lipSyncFrameRef.current = window.requestAnimationFrame(animate);
    };

    lipSyncFrameRef.current = window.requestAnimationFrame(animate);
  }

  function finishSpeaking() {
    stopLipSync();
    setSpeaking(false);
    restartVoiceIfNeeded();
  }

  function speakWithBrowser(text, forceSpeak = false) {
    if ((!voiceEnabled && !forceSpeak) || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = getFastSpeechText(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "it-IT";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;
    setSpeaking(true);
    startLipSync();
    window.speechSynthesis.speak(utterance);
  }

  async function speakReply(text, forceSpeak = false) {
    if (!forceSpeak && !voiceEnabled) return;

    const cleanText = getFastSpeechText(text);
    if (!cleanText) return;

    try {
      stopVoiceInput(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audioUrl = `/api/speech?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = finishSpeaking;
      audio.onerror = finishSpeaking;
      setSpeaking(true);
      startLipSync();
      await audio.play();
    } catch {
      stopLipSync();
      setSpeaking(false);
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

  function restartVoiceIfNeeded() {
    if (!continuousVoiceRef.current || sendingRef.current) return;
    window.setTimeout(() => startVoiceInput(), 650);
  }

  function stopVoiceInput(disableContinuous = true) {
    if (disableContinuous) {
      continuousVoiceRef.current = false;
      setContinuousVoice(false);
    }

    if (!recognitionRef.current) return;

    recognitionRef.current.onend = null;
    recognitionRef.current.onerror = null;
    try {
      recognitionRef.current.stop();
    } catch {
      // The browser can throw if recognition has already stopped.
    }
    recognitionRef.current = null;
    setListening(false);
  }

  function startVoiceInput({ continuous = continuousVoiceRef.current } = {}) {
    if (!canUseSpeech || listening || sendingRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    continuousVoiceRef.current = continuous;
    setContinuousVoice(continuous);
    setVoiceEnabled(true);
    setListening(true);

    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      const cleanText = text.trim();
      if (!cleanText) return;
      lastAutoSentRef.current = cleanText;
      setInput(cleanText);
      sendMessage(cleanText);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      restartVoiceIfNeeded();
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setListening(false);
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        continuousVoiceRef.current = false;
        setContinuousVoice(false);
        return;
      }
      restartVoiceIfNeeded();
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  function toggleContinuousVoice() {
    if (continuousVoiceRef.current) {
      stopVoiceInput(true);
      return;
    }

    startVoiceInput({ continuous: true });
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <img alt="" className="avatar-photo" src={avatarSrc} />
        <div className="assistant-title">
          <strong>{tenant.assistantName}</strong>
          {continuousVoice ? <span>Voce attiva</span> : null}
        </div>
        <span className="assistant-status">{speaking ? "Parlo" : listening ? "Ascolto" : "Online"}</span>
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

      <div className="action-dock">
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <button
            aria-label="Attiva voce continua"
            className={`icon-button ${listening ? "is-listening" : ""}`}
            disabled={!canUseSpeech || (loading && !continuousVoice)}
            onClick={toggleContinuousVoice}
            title={canUseSpeech ? "Attiva o ferma la voce continua" : "Microfono non disponibile"}
            type="button"
          >
            <span className="mic-symbol" aria-hidden="true" />
            <span className="voice-label">{continuousVoice ? "Stop" : "Parla"}</span>
          </button>
          <input
            aria-label="Messaggio"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Scrivi qui o parla con Mia.Ai..."
            value={input}
          />
        </form>
        <a aria-label="Apri WhatsApp" className="whatsapp-link" href={whatsappUrl} rel="noreferrer" target="_blank">
          <span className="whatsapp-icon" aria-hidden="true">W</span>
          WhatsApp
        </a>
      </div>

      <div className="order-bar">
        <span>
          {orderDraft
            ? "Riepilogo pronto per WhatsApp"
            : continuousVoice
              ? listening
                ? "Ti ascolto."
                : "Voce attiva, riparto appena ho finito di parlare."
              : "Sono qui. Scrivi o attiva la voce quando vuoi iniziare."}
        </span>
      </div>
    </div>
  );
}
