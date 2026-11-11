"use client";

import { useEffect, useRef, useState } from "react";
import CupDemoPanel from "./cup-demo-panel";
import PharmacyDemoPanel from "./pharmacy-demo-panel";

export default function CustomAssistant({ tenant, immersive = false }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: tenant.welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micError, setMicError] = useState("");
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
  const sendRef = useRef(() => {});
  const loadingRef = useRef(false);
  const micSessionRef = useRef(0);
  const fillerRef = useRef(null);
  const stopRecognitionRef = useRef(null);
  const stoppedRef = useRef(false);

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
      try { stopRecognitionRef.current?.abort(); } catch {}
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      delete document.documentElement.dataset.miaAvatarState;
    };
  }, []);

  useEffect(() => {
    const state = speaking ? "speaking" : loading ? "thinking" : listening ? "listening" : "idle";
    document.documentElement.dataset.miaAvatarState = state;
    window.dispatchEvent(new CustomEvent("mia-avatar-state-change", { detail: { state } }));
  }, [listening, loading, speaking]);

  useEffect(() => {
    speakingRef.current = speaking;
    if (speaking) {
      try { recognitionRef.current?.abort(); } catch {}
      setListening(false);
    } else if (!loading && !busyRef.current && continuousRef.current) {
      restartListeningRef.current();
    }
  }, [speaking, loading]);

  function stopSpeech() {
    stoppedRef.current = true;
    speechSequenceRef.current += 1;
    try { audioRef.current?.pause(); } catch {}
    try { stopRecognitionRef.current?.abort(); } catch {}
    stopRecognitionRef.current = null;
    try { window.speechSynthesis?.cancel(); } catch {}
    try { fillerRef.current = null; } catch {}
    speakingRef.current = false;
    busyRef.current = false;
    setSpeaking(false);
    setLoading(false);
    restartListeningRef.current();
  }

  function listenForStop() {
    if (!immersive || !continuousRef.current || stopRecognitionRef.current) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    stopRecognitionRef.current = rec;
    rec.lang = "it-IT";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      const spoken = Array.from(event.results || []).map((r) => r[0]?.transcript || "").join(" ").toLowerCase();
      if (/\b(?:giulia\s+)?(?:stop|fermati|basta)\b/i.test(spoken)) stopSpeech();
    };
    rec.onend = () => { if (stopRecognitionRef.current === rec) stopRecognitionRef.current = null; };
    try { rec.start(); } catch { stopRecognitionRef.current = null; }
  }

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
    utterance.onend = () => { speakingRef.current = false; setSpeaking(false); busyRef.current = false; restartListeningRef.current(); };
    utterance.onerror = () => { speakingRef.current = false; setSpeaking(false); busyRef.current = false; restartListeningRef.current(); };
    speakingRef.current = true;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function speak(text, onAudioStart = () => {}) {
    const sequence = ++speechSequenceRef.current;
    if (stoppedRef.current) return;
    let revealed = false;
    const reveal = () => { if (!revealed && sequence === speechSequenceRef.current) { revealed = true; onAudioStart(); } };
    const clean = cleanSpeech(text).replace(/new\s+digital\s+app/gi, tenant.slug === "mia-nda" ? "enne di a" : "New Digital App");
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
      if (sequence !== speechSequenceRef.current || stoppedRef.current) { URL.revokeObjectURL(url); return; }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplaying = () => { speakingRef.current = true; reveal(); setSpeaking(true); listenForStop(); };
      let finishPlayback;
      const playbackDone = new Promise((resolve) => { finishPlayback = resolve; });
      audio.onended = () => { speakingRef.current = false; setSpeaking(false); URL.revokeObjectURL(url); finishPlayback(); };
      audio.onerror = () => { speakingRef.current = false; setSpeaking(false); URL.revokeObjectURL(url); finishPlayback(); };
      await audio.play();
      await playbackDone;
    } catch {
      setSpeaking(false);
      reveal();
      speakWithBrowser(clean);
    }
  }

  async function send(content) {
    const clean = String(content || "").trim();
    if (/^(?:giulia[ ,]*)?(?:stop|fermati|basta)[.! ]*$/i.test(clean)) { stopSpeech(); return; }
    if (!clean || loadingRef.current || busyRef.current) return;
    const next = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    stoppedRef.current = false;
    busyRef.current = true;
    loadingRef.current = true;
    // Invalidate callbacks from the recognition instance deliberately stopped for playback.
    micSessionRef.current += 1;
    recognitionRef.current = null;
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
      try { if (fillerRef.current) window.speechSynthesis.cancel(); } catch {}
      fillerRef.current = null;
      if (stoppedRef.current) return;
      const reply = data.reply || "Non ho trovato una risposta.";
      await speak(reply, () => setMessages((current) => [...current, { role: "assistant", content: reply }]));
      setLoading(false);
    } catch {
      try { if (fillerRef.current) window.speechSynthesis.cancel(); } catch {}
      fillerRef.current = null;
      if (stoppedRef.current) return;
      const fallback = "Non riesco a rispondere in questo momento. Riprova tra poco.";
      setMessages((current) => [...current, { role: "assistant", content: fallback }]);
      speakWithBrowser(fallback);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      if (!speakingRef.current && !("speechSynthesis" in window && window.speechSynthesis.speaking)) {
        busyRef.current = false;
        restartListeningRef.current();
      }
    }
  }

  sendRef.current = send;

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
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    const session = micSessionRef.current;
    recognition.onstart = () => { if (session !== micSessionRef.current) return; setMicError(""); setListening(true); };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (/^(?:giulia[ ,]*)?(?:stop|fermati|basta)[.! ]*$/i.test(transcript.trim())) { stopSpeech(); return; }
      if (session === micSessionRef.current && transcript.trim() && continuousRef.current && !busyRef.current) {
        setInput(transcript);
        sendRef.current(transcript);
      }
    };
    recognition.onerror = (event) => {
      if (session !== micSessionRef.current) return;
      setListening(false);
      if (busyRef.current || speakingRef.current || !continuousRef.current || event.error === "aborted") return;
      setMicError(event.error || "errore sconosciuto");
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        continuousRef.current = false;
        setMicEnabled(false);
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      if (session !== micSessionRef.current) return;
      setListening(false);
      if (continuousRef.current && !busyRef.current && !speakingRef.current) restartListeningRef.current();
    };
    try { recognition.start(); } catch (error) {
      setMicError(error?.name || "avvio non riuscito");
      recognitionRef.current = null;
      setListening(false);
      if (continuousRef.current) restartTimerRef.current = setTimeout(() => restartListeningRef.current(), 1200);
    }
  }

  restartListeningRef.current = () => {
    clearTimeout(restartTimerRef.current);
    if (!continuousRef.current || busyRef.current || speakingRef.current) return;
    restartTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        restartListeningRef.current();
        return;
      }
      startRecognition();
    }, 650);
  };

  function toggleListening() {
    if (!canUseSpeech) return;
    if (continuousRef.current) {
      micSessionRef.current += 1;
      continuousRef.current = false;
      setMicEnabled(false);
      clearTimeout(restartTimerRef.current);
      try { recognitionRef.current?.abort(); } catch {}
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    micSessionRef.current += 1;
    continuousRef.current = true;
    setMicError("");
    setMicEnabled(true);
    startRecognition();
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <div className="assistant-title">
          <strong>Parla o scrivi a {tenant.assistantName}</strong>
          <span>Scegli come iniziare</span>
        </div>
        <div className="assistant-status">{micError ? `Microfono: ${micError}` : speaking ? "Sta parlando" : loading ? "Sta pensando" : listening ? "Ti ascolta" : micEnabled ? "Ascolto continuo attivo" : "Pronta"}</div>
      </header>
      <CupDemoPanel tenant={tenant} messages={messages} immersive={immersive} />
      <PharmacyDemoPanel tenant={tenant} messages={messages} immersive={immersive} />
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
          <button className={`icon-button ${micEnabled ? "is-listening" : ""}`} disabled={!canUseSpeech} onClick={speaking ? stopSpeech : toggleListening} type="button" aria-label={speaking ? "Ferma Giulia" : micEnabled ? "Disattiva ascolto continuo" : `Attiva ascolto continuo con ${tenant.assistantName}`}>
            <span className="mic-symbol" aria-hidden="true" />
            <span className="voice-label">{micEnabled ? "Stop" : "Parla"}</span>
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
