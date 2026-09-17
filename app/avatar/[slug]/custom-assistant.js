"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomAssistant({ tenant }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: tenant.welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [canUseSpeech, setCanUseSpeech] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const lastAssistantMessage = [...messages].reverse().find((item) => item.role === "assistant")?.content || tenant.orderFallbackText;
  const whatsappUrl = tenant.whatsappPhone
    ? `https://wa.me/${tenant.whatsappPhone}?text=${encodeURIComponent(`Ciao, vorrei ricevere informazioni da ${tenant.assistantName}. Ultima informazione: ${lastAssistantMessage}`)}`
    : "";

  useEffect(() => {
    setCanUseSpeech("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      audioRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      delete document.documentElement.dataset.miaAvatarState;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.miaAvatarState = speaking ? "speaking" : listening ? "listening" : loading ? "thinking" : "idle";
  }, [listening, loading, speaking]);

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
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function speak(text) {
    const clean = cleanSpeech(text);
    if (!clean) return;
    if (tenant.voice === "browser" || String(tenant.voice).startsWith("browser")) {
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
      audio.onplaying = () => setSpeaking(true);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch {
      setSpeaking(false);
      speakWithBrowser(clean);
    }
  }

  async function send(content) {
    const clean = String(content || "").trim();
    if (!clean || loading) return;
    const next = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/custom-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar: {
            name: tenant.assistantName,
            companyName: tenant.name,
            role: tenant.role,
            tone: tenant.tone,
            knowledgeSummary: tenant.knowledgeSummary,
            knowledgeUrl: tenant.knowledgeUrl,
            websiteKnowledge: tenant.websiteKnowledge
          },
          messages: next
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const reply = data.reply || "Non ho trovato una risposta.";
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      await speak(reply);
    } catch {
      const fallback = "Non riesco a rispondere in questo momento. Riprova tra poco.";
      setMessages((current) => [...current, { role: "assistant", content: fallback }]);
      speakWithBrowser(fallback);
    } finally {
      setLoading(false);
    }
  }

  function toggleListening() {
    if (!canUseSpeech) return;
    if (listening) {
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      if (transcript.trim()) send(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <div className="avatar-photo custom-avatar-initial">{tenant.assistantName.slice(0, 1)}</div>
        <div className="assistant-title"><strong>{tenant.assistantName}</strong><span>{tenant.name}</span></div>
        <div className="assistant-status">{speaking ? "Sta parlando" : listening ? "Ti ascolta" : loading ? "Sta pensando" : "Online"}</div>
      </header>
      <div className="messages">
        <div className="message-list">
          {messages.map((message, index) => <div className={`message message--${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading ? <div className="message message--assistant">Sto pensando…</div> : null}
        </div>
        <div className="suggestions">
          {(tenant.suggestions || []).map((suggestion) => <button disabled={loading} key={suggestion} onClick={() => send(suggestion)} type="button">{suggestion}</button>)}
        </div>
      </div>
      {whatsappUrl ? <div className="order-bar"><span>Vuoi ricevere o inviare queste informazioni?</span><a className="whatsapp-link" href={whatsappUrl} target="_blank" rel="noreferrer">Invia su WhatsApp</a></div> : null}
      <form className="composer custom-composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <button className={`mic-button ${listening ? "is-listening" : ""}`} disabled={!canUseSpeech || loading} onClick={toggleListening} type="button" aria-label={listening ? "Ferma microfono" : "Parla con l'avatar"}>{listening ? "■" : "●"}</button>
        <input aria-label="Messaggio" onChange={(event) => setInput(event.target.value)} placeholder={tenant.inputPlaceholder} value={input} />
        <button className="custom-send-button" disabled={loading || !input.trim()} type="submit">Invia</button>
      </form>
    </div>
  );
}
