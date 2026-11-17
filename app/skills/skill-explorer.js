"use client";

import { useState } from "react";
import { skills, skillGroups } from "./catalog";

export default function SkillExplorer() {
  const [group, setGroup] = useState("Tutte");
  const [selectedId, setSelectedId] = useState("knowledge");
  const selected = skills.find(skill => skill.id === selectedId);
  const visible = skills.filter(skill => group === "Tutte" || skill.group === group);

  function chooseGroup(value) {
    setGroup(value);
    if (value !== "Tutte" && selected.group !== value) setSelectedId(skills.find(skill => skill.group === value).id);
  }

  function requestSkill() {
    window.dispatchEvent(new CustomEvent("avatarone:skill-interest", { detail: { id: selected.id } }));
    document.getElementById("contatti")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("lead-name")?.focus({ preventScroll: true });
  }

  return <section className="a1-skills section" id="skill" aria-labelledby="skill-heading">
    <div className="a1-skills-heading"><div><p className="eyebrow">Le skill di AvatarOne</p><h2 id="skill-heading">Una voce. Tante capacità.<br /><span>Il valore è quello che fa per te.</span></h2></div><p>Scegli cosa deve fare il tuo assistente: rispondere, accompagnare una vendita o dialogare con i tuoi sistemi. Costruiamo il percorso intorno alla tua attività.</p></div>
    <div className="a1-skill-filters" role="group" aria-label="Filtra le skill">{skillGroups.map(item => <button type="button" key={item} aria-pressed={group === item} onClick={() => chooseGroup(item)}>{item}</button>)}</div>
    <div className="a1-skills-layout"><div className="a1-skill-grid">{visible.map(skill => <button type="button" className="a1-skill-card" key={skill.id} aria-pressed={selectedId === skill.id} onClick={() => setSelectedId(skill.id)}><span className="a1-skill-top"><span>{skill.icon}</span><small>{skill.kind === "base" ? "Funzione base" : "Su progetto"}</small></span><strong>{skill.title}</strong><span className="a1-skill-description">{skill.description}</span><span className="a1-skill-more">Scopri come funziona <span aria-hidden="true">↗</span></span></button>)}</div>
      <aside className="a1-skill-preview" aria-label="Dettaglio della skill selezionata"><div aria-live="polite"><span className="a1-skill-preview-label">{selected.label}</span><h3>{selected.title}</h3><p className="a1-skill-outcome">{selected.outcome}</p><div className="a1-skill-example"><small>ESEMPIO DI CONVERSAZIONE</small><p className="a1-skill-question">{selected.question}</p><p className="a1-skill-answer"><strong>AvatarOne</strong>{selected.answer}</p></div><div className="a1-skill-requirements"><strong>Cosa serve</strong><p>{selected.requires}</p></div></div><button type="button" className="a1-skill-cta" onClick={requestSkill}>Voglio questa skill <span aria-hidden="true">→</span></button><small className="a1-skill-disclaimer">Esempio illustrativo. Integrazioni, dati e operazioni vengono definiti e collaudati per ogni progetto.</small></aside>
    </div>
    <div className="a1-skills-bottom"><strong>Dal primo contatto ai processi aziendali.</strong><p>AI in tutti i pacchetti. Conoscenza e voce con Smart; collegamenti ai sistemi con Connect; esperienza immersiva e sviluppo avanzato con Experience. Le integrazioni sono quotate separatamente.</p><a href="#pacchetti">Confronta i pacchetti <span aria-hidden="true">→</span></a></div>
  </section>;
}
