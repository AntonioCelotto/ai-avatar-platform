"use client";

import { useRef, useState } from "react";
import "./experience.css";
import MiaVideoUpload from "./mia-video-upload";
import { AvatarCreator } from "../../platform/avatar-creator";
import "../../platform/platform.css";

const fields = [
  { key: "portrait", title: "Immagine avatar", accept: "image/*" },
  { key: "idle", title: "Video a riposo", accept: "video/*" },
  { key: "talking", title: "Video mentre parla", accept: "video/*" }
];

export default function ExperienceStudio() {
  const [name, setName] = useState("Experience Demo NDA");
  const [media, setMedia] = useState({});
  const [mode, setMode] = useState("idle");
  const urls = useRef({});
  function upload(key, file) {
    if (urls.current[key]) URL.revokeObjectURL(urls.current[key]);
    const url = file ? URL.createObjectURL(file) : "";
    urls.current[key] = url;
    setMedia(previous => ({ ...previous, [key]: file ? { url, type: file.type, name: file.name } : null }));
  }
  const current = mode === "talking" ? media.talking : media.idle;
  const style = { background: "#122439", color: "#f6faff", padding: 24, borderRadius: 18 };
  return <main className="experience-studio" style={{ maxWidth: 1080, margin: "24px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
    <a href="/platform">← Torna alla dashboard</a>
    <h1>AvatarOne · Experience Studio</h1>
    <p>Laboratorio di prova riservato agli amministratori. Questa versione non modifica gli avatar pubblicati e non salva file sul server.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
      <section style={style}>
        <h2>Avatar dimostrativo</h2>
        <label>Nome avatar<input style={{ display: "block", width: "100%", padding: 10, marginTop: 8 }} value={name} onChange={e => setName(e.target.value)} /></label>
        {fields.map(field => <label key={field.key} style={{ display: "block", marginTop: 22 }}>
          <strong>{field.title}</strong>
          <input style={{ display: "block", marginTop: 8, maxWidth: "100%" }} type="file" accept={field.accept} onChange={e => upload(field.key, e.target.files?.[0])} />
          <small>{media[field.key]?.name || "Nessun file selezionato"}</small>
        </label>)}
        <p style={{ fontSize: 13, marginTop: 24 }}>I file rimangono soltanto nel browser durante questa prova. Il caricamento permanente e il collegamento ai clienti saranno implementati dopo la verifica dei permessi e dello storage.</p>
      </section>
      <section style={style}>
        <h2>Anteprima · {name}</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button onClick={() => setMode("idle")} aria-pressed={mode === "idle"}>Riposo</button>
          <button onClick={() => setMode("talking")} aria-pressed={mode === "talking"}>Parlato</button>
        </div>
        <div style={{ width: "100%", aspectRatio: "9/16", maxHeight: 560, background: "#081827", display: "grid", placeItems: "center", overflow: "hidden" }}>
          {current?.url ? <video key={current.url} src={current.url} autoPlay muted loop playsInline controls style={{ width: "100%", height: "100%", objectFit: "contain" }} /> :
            media.portrait?.url ? <img src={media.portrait.url} alt="Anteprima avatar" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> :
            <p>Carica un'immagine o un video per iniziare.</p>}
        </div>
        <p>Questa anteprima verifica i video e il passaggio manuale tra stati. Non è ancora sincronizzata con l'audio AI.</p>
      </section>
    </div>
    <section id="create-experience" className="experience-create" style={{ marginTop: 32, padding: 24, borderRadius: 18, background: "#f5f7fb", color: "#182331" }}>
      <h2>Crea e salva un nuovo avatar con AI e voce</h2>
      <p>Qui puoi creare un avatar definitivo, scegliere OpenAI o ElevenLabs, caricare foto e video di riposo e parlato, aggiungere conoscenze e pubblicare nel cloud. I file usati nell’anteprima sopra non sono trasferiti automaticamente: selezionali nuovamente nel modulo sottostante.</p>
      <p><strong>Importante:</strong> la creazione pubblica un nuovo avatar nel cloud. Usa un nome univoco per il test. La sincronizzazione reale della bocca con le parole non è ancora inclusa: il video parlato viene riprodotto durante la risposta.</p>
      <MiaVideoUpload />
      <AvatarCreator />
    </section>
  </main>;
}
