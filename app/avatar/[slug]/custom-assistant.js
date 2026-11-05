"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomAssistant({ tenant }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: tenant.welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechSequenceRef = useRef(0);
  const continuousRef = useRef(false);
  const busyRef = useRef(false);
  const speakingRef = useRef(false);
  const restartTimerRef = useRef(null);
  const restartListeningRef = useRef(() => {});

  const lastAssistantMessage = [...messages].reverse().find((item) => item.role === "assistant")?.content || tenant.orderFallbackText;
  const whatsappUrl = tenant.whatsappPhone
    ? `https://wa.me/${tenant.whatsappPhone}?text=${encodeURIComponent(`Ciao, vorrei ricevere informazioni da ${tenant.assistantName}. Ultima informazione: ${lastAssistantMessage}`)}`
    : "";

  useEffect(() => {
    setCanUseSpeech("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    return () => {
      continuousRef.current = false;
      clearTimeout(restartTimerRef.current);
      try { recognitionRef.current?.abort(); } catch {}
      audioRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      delete document.documentElement.dataset.miaAvatarState;
    };
  }, []);

  useEffect(() => {
    const state = speaking ? "speaking" : listening ? "listening" : loading ? "thinking" : "idle";
    document.documentElement.dataset.miaAvatarState = state;
    window.dispatchEvent(new CustomEvent("mia-avatar-state-change", { detail: { state } }));
  }, [listening, loading, speaking]);

  useEffect(() => {
    speakingRef.current = speaking;
    if (speaking) {
      try { recognitionRef.current?.abort(); } catch {}
      setListening(false);
    } else if (!loading && continuousRef.current) {
      restartListeningRef.current();
    }
  }, [speaking, loading]);

  function cleanSpeech(text) {
    return String(text || "").replace(/\*\*|__|`|[#>~]/g, "").replace(/\s+/g, " ").trim().slice(0, 420);
  }

  function speakWithBrowser(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSpeech(text));
    utterance.lang = "it-IT";
    const voices = window.speechSynthesis.getVoices();
    const selected = tenant.voice === "browser-female"
      ? voices.find((item) => /elsa|isabella|female/i.test(item.name))
      : voices.find((item) => item.lang?.startsWith("it"));
    if (selected) utterance.voice = selected;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); busyRef.current = false; restartListeningRef.current(); };
    utterance.onerror = () => { setSpeaking(false); busyRef.current = false; restartListeningRef.current(); };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function speak(text, onAudioStart = () => {}) {
    const sequence = ++speechSequenceRef.current;
    let revealed = false;
    const reveal = () => { if (!revealed && sequence === speechSequenceRef.current) { revealed = true; onAudioStart(); } };
    const clean = cleanSpeech(text);
    if (!clean) return;
    if (tenant.voice === "browser" || String(tenant.voice).startsWith("browser")) {
      reveal();
      speakWithBrowser(clean);
      return;
    }
    try {
      audioRef.current?.pause();
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: clean,
          tenantSlug: tenant.slug,
          provider: tenant.voice,
          voiceId: tenant.voiceId
        })
      });
      if (!response.ok) throw new Error("speech");
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplaying = () => { reveal(); setSpeaking(true); };
      audio.onended = () => { setSpeaking(false); busyRef.current = false; URL.revokeObjectURL(url); restartListeningRef.current(); };
      audio.onerror = () => { setSpeaking(false); busyRef.current = false; URL.revokeObjectURL(url); restartListeningRef.current(); };
      await audio.play();
    } catch {
      setSpeaking(false);
      reveal();
      speakWithBrowser(clean);
    }
  }

  async function send(content) {
    const clean = String(content || "").trim();
    if (!clean || loading) return;
    const next = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    busyRef.current = true;
    clearTimeout(restartTimerRef.current);
    try { recognitionRef.current?.abort(); } catch {}
    setListening(false);
    setLoading(true);
    try {
      const response = await fetch("/api/custom-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tenant.slug, messages: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const reply = data.reply || "Non ho trovato una risposta.";
      await speak(reply, () => setMessages((current) => [...current, { role: "assistant", content: reply }]));
      setLoading(false);
    } catch {
      const fallback = "Non riesco a rispondere in questo momento. Riprova tra poco.";
      setMessages((current) => [...current, { role: "assistant", content: fallback }]);
      speakWithBrowser(fallback);
    } finally {
      setLoading(false);
      if (!speakingRef.current && !audioRef.current?.paused) return;
      if (!speakingRef.current && !("speechSynthesis" in window && window.speechSynthesis.speaking)) {
        busyRef.current = false;
        restartListeningRef.current();
      }
    }
  }

  async function shareAvatar() {
    const url = window.location.origin + "/avatar/" + encodeURIComponent(tenant.slug);
    const data = { title: tenant.assistantName + " · AvatarOne", text: "Parla con " + tenant.assistantName, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      setShareNotice("Link copiato");
    } catch (error) {
      if (error?.name !== "AbortError") setShareNotice("Condividi questo link: " + url);
    }
  }

  function startRecognition() {
    if (!continuousRef.current || busyRef.current || speakingRef.current || recognitionRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript.trim() && continuousRef.current && !busyRef.current) {
        setInput(transcript);
        send(transcript);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        continuousRef.current = false;
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setListening(false);
      if (continuousRef.current && !busyRef.current && !speakingRef.current) restartListeningRef.current();
    };
    try { recognition.start(); } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }

  restartListeningRef.current = () => {
    clearTimeout(restartTimerRef.current);
    if (!continuousRef.current || busyRef.current || speakingRef.current) return;
    restartTimerRef.current = setTimeout(() => startRecognition(), 450);
  };

  function toggleListening() {
    if (!canUseSpeech) return;
    if (continuousRef.current) {
      continuousRef.current = false;
      clearTimeout(restartTimerRef.current);
      try { recognitionRef.current?.abort(); } catch {}
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    continuousRef.current = true;
    startRecognition();
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <div className="assistant-title">
          <strong>Parla o scrivi a {tenant.assistantName}</strong>
          <span>Scegli come iniziare</span>
        </div>
        <div className="assistant-status">{speaking ? "Sta parlando" : listening ? "Ti ascolta" : loading ? "Sta pensando" : "Pronta"}</div>
      </header>
      <div className="messages" aria-live="polite">
        <div className="message-list">
          {messages.map((message, index) => <div className={`message message--${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading ? <div className="message message--assistant">Sto pensando…</div> : null}
        </div>
        <div className="suggestions">
          {(tenant.suggestions || []).map((suggestion) => <button disabled={loading} key={suggestion} onClick={() => send(suggestion)} type="button">{suggestion}</button>)}
        </div>
      </div>
      <div className={`action-dock ${whatsappUrl ? "" : "action-dock--chat-only"}`}>
        <form className="composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
          <button className={`icon-button ${listening ? "is-listening" : ""}`} disabled={!canUseSpeech} onClick={toggleListening} type="button" aria-label={continuousRef.current ? "Disattiva ascolto continuo" : `Attiva ascolto continuo con ${tenant.assistantName}`}>
            <span className="mic-symbol" aria-hidden="true" />
            <span className="voice-label">{continuousRef.current ? "Stop" : "Parla"}</span>
          </button>
          <input aria-label="Messaggio" onChange={(event) => setInput(event.target.value)} placeholder={tenant.inputPlaceholder} value={input} />
          <button aria-label="Invia messaggio" className="send-button" disabled={loading || !input.trim()} type="submit"><span aria-hidden="true">➜</span><span className="sr-only">Invia</span></button>
        </form>
        {whatsappUrl ? (
          <a aria-label="Apri WhatsApp" className="whatsapp-link" href={whatsappUrl} target="_blank" rel="noreferrer"><span className="whatsapp-icon" aria-hidden="true">W</span>WhatsApp</a>
        ) : null}
        <button type="button" onClick={shareAvatar} aria-label={"Condividi " + tenant.assistantName} title="Condividi avatar" className="avatar-share-button" style={{ width: 44, height: 44, flex: "0 0 44px", borderRadius: "50%", border: "1px solid #ffffff70", background: "#102638dd", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.3M8.7 13.3l6.6 4.3"/></svg></button>
        {shareNotice ? <span role="status" style={{ fontSize: 11, color: "white", maxWidth: 160 }}>{shareNotice}</span> : null}
      </div>
      <div className="order-bar"><span>{whatsappUrl ? "Puoi anche inviare le informazioni su WhatsApp." : "Tocca il microfono per parlare oppure scrivi un messaggio."}</span></div>
    </div>
  );
}
