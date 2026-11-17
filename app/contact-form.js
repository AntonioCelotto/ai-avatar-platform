"use client";

import { useEffect, useState } from "react";

import { skills } from "./skills/catalog";

export default function ContactForm() {
  const [plan, setPlan] = useState("Preventivo personalizzato");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const [skillId, setSkillId] = useState("");
  const selectedSkill = skills.find(skill => skill.id === skillId);
  useEffect(() => {
    const receive = event => { if (skills.some(skill => skill.id === event.detail?.id)) setSkillId(event.detail.id); };
    window.addEventListener("avatarone:skill-interest", receive);
    return () => window.removeEventListener("avatarone:skill-interest", receive);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    payload.plan = plan;
    if (selectedSkill) payload.message = `Skill di interesse: ${selectedSkill.title}.\n${payload.message || ""}`;
    payload.consent = form.get("consent") === "on";
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invio non riuscito.");
      setStatus("Richiesta registrata. Si apre WhatsApp per inviarla direttamente ad Antonio.");
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      formElement.reset();
      setSkillId("");
    } catch (error) { setStatus(error.message || "Invio non riuscito."); }
    finally { setSending(false); }
  }

  return <form className="lead-form" onSubmit={submit}>
    <div className="lead-grid"><label>Nome e cognome<input id="lead-name" name="name" autoComplete="name" required /></label><label>Azienda<input name="company" required /></label><label>Email<input name="email" type="email" required /></label><label>Telefono / WhatsApp<input name="phone" inputMode="tel" required /></label><label>Settore<select name="category"><option>Hotel e turismo</option><option>Beauty e benessere</option><option>Immobiliare</option><option>Formazione</option><option>Ristorazione</option><option>Sanità e servizi</option><option>Retail e fiere</option><option>Altro</option></select></label><label>Pacchetto<select value={plan} onChange={(event) => setPlan(event.target.value)}><option>AvatarOne Smart</option><option>AvatarOne Connect</option><option>AvatarOne Experience</option><option>Preventivo personalizzato</option></select></label></div>
    {selectedSkill ? <div className="a1-skill-interest" role="status">Skill di interesse: <strong>{selectedSkill.title}</strong><button type="button" onClick={() => setSkillId("")}>Rimuovi dalla richiesta</button></div> : null}
    <label>Raccontaci cosa deve fare il tuo avatar<textarea name="message" rows="4" placeholder="Esempio: accogliere i clienti, spiegare servizi e raccogliere contatti…" /></label>
    <label className="privacy-check"><input name="consent" type="checkbox" required /> Ho letto la <a href="/privacy" target="_blank">privacy policy</a> e autorizzo il contatto commerciale.</label>
    <button disabled={sending} type="submit">{sending ? "Sto preparando la richiesta…" : "Richiedi preventivo su WhatsApp"}</button>
    {status ? <p className="form-status" role="status">{status}</p> : null}
  </form>;
}
