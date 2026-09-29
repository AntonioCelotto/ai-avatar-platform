"use client";

import { useState } from "react";

export default function ContactForm() {
  const [plan, setPlan] = useState("Business");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.plan = plan;
    payload.consent = form.get("consent") === "on";
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invio non riuscito.");
      setStatus("Richiesta registrata. Si apre WhatsApp per inviarla direttamente ad Antonio.");
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      event.currentTarget.reset();
    } catch (error) { setStatus(error.message || "Invio non riuscito."); }
    finally { setSending(false); }
  }

  return <form className="lead-form" onSubmit={submit}>
    <div className="lead-grid"><label>Nome e cognome<input name="name" required /></label><label>Azienda<input name="company" required /></label><label>Email<input name="email" type="email" required /></label><label>Telefono / WhatsApp<input name="phone" inputMode="tel" required /></label><label>Settore<select name="category"><option>Hotel e turismo</option><option>Beauty e benessere</option><option>Immobiliare</option><option>Formazione</option><option>Ristorazione</option><option>Sanità e servizi</option><option>Retail e fiere</option><option>Altro</option></select></label><label>Pacchetto<select value={plan} onChange={(event) => setPlan(event.target.value)}><option>Start</option><option>Business</option><option>Pro / Box</option><option>Preventivo personalizzato</option></select></label></div>
    <label>Raccontaci cosa deve fare il tuo avatar<textarea name="message" rows="4" placeholder="Esempio: accogliere i clienti, spiegare servizi e raccogliere contatti…" /></label>
    <label className="privacy-check"><input name="consent" type="checkbox" required /> Ho letto la <a href="/privacy" target="_blank">privacy policy</a> e autorizzo il contatto commerciale.</label>
    <button disabled={sending} type="submit">{sending ? "Sto preparando la richiesta…" : "Richiedi preventivo su WhatsApp"}</button>
    {status ? <p className="form-status" role="status">{status}</p> : null}
  </form>;
}
