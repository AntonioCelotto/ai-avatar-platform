"use client";

import { useState } from "react";

export default function CustomAssistant({ tenant }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: tenant.welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
            knowledgeSummary: tenant.knowledgeSummary
          },
          messages: next
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = "it-IT";
        const voices = window.speechSynthesis.getVoices();
        const selected = tenant.voice === "browser-female"
          ? voices.find((item) => /elsa|isabella|female/i.test(item.name))
          : voices.find((item) => item.lang?.startsWith("it"));
        if (selected) utterance.voice = selected;
        utterance.onstart = () => { document.documentElement.dataset.miaAvatarState = "speaking"; };
        utterance.onend = () => { document.documentElement.dataset.miaAvatarState = "idle"; };
        utterance.onerror = () => { document.documentElement.dataset.miaAvatarState = "idle"; };
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Non riesco a rispondere in questo momento. Riprova tra poco." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="assistant-panel">
      <header className="assistant-header">
        <div className="avatar-photo custom-avatar-initial">{tenant.assistantName.slice(0, 1)}</div>
        <div className="assistant-title"><strong>{tenant.assistantName}</strong><span>{tenant.name}</span></div>
        <div className="assistant-status">Online</div>
      </header>
      <div className="messages">
        <div className="message-list">
          {messages.map((message, index) => <div className={`message message--${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}
          {loading ? <div className="message message--assistant">Sto pensando…</div> : null}
        </div>
        <div className="suggestions">
          {tenant.suggestions.map((suggestion) => <button disabled={loading} key={suggestion} onClick={() => send(suggestion)} type="button">{suggestion}</button>)}
        </div>
      </div>
      <form className="composer custom-composer" onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <input aria-label="Messaggio" onChange={(event) => setInput(event.target.value)} placeholder={tenant.inputPlaceholder} value={input} />
        <button className="custom-send-button" disabled={loading || !input.trim()} type="submit">Invia</button>
      </form>
    </div>
  );
}
