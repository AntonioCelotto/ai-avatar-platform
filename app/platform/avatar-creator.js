"use client";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "avatarone:custom-avatars";
const EMPTY_MEDIA = { imageDataUrl: "", imageName: "", videoDataUrl: "", videoName: "" };
function readAvatars() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
function saveAvatar(avatar) { const current = readAvatars(); localStorage.setItem(STORAGE_KEY, JSON.stringify([avatar, ...current.filter((item) => item.slug !== avatar.slug)].slice(0, 20))); window.dispatchEvent(new Event("avatarone:avatars-changed")); }
function readSmallFile(file, maxBytes) { return new Promise((resolve, reject) => { if (!file) return resolve(""); if (file.size > maxBytes) return reject(new Error(`Il file supera ${Math.round(maxBytes / 1048576)} MB. Usa un URL pubblico.`)); const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => reject(new Error("Non riesco a leggere il file.")); reader.readAsDataURL(file); }); }

export function AvatarCreator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);
  const [media, setMedia] = useState(EMPTY_MEDIA);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [voice, setVoice] = useState("browser-it");
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [knowledgeNotes, setKnowledgeNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [created, setCreated] = useState(null);
  const preview = useMemo(() => ({ image: media.imageDataUrl || imageUrl.trim(), video: media.videoDataUrl || videoUrl.trim() }), [imageUrl, media, videoUrl]);
  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  async function createConfiguration(event) {
    event.preventDefault(); const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 15) return setError("Descrivi l’avatar con almeno 15 caratteri.");
    setLoading(true); setError(""); setCreated(null);
    try { const response = await fetch("/api/avatar-creator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: cleanPrompt }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Creazione non riuscita."); setDraft(data.avatar); setKnowledgeNotes(data.avatar.knowledgeSummary || ""); }
    catch (creationError) { setError(creationError.message); } finally { setLoading(false); }
  }

  async function selectMedia(event, kind) {
    const file = event.target.files?.[0]; if (!file) return; setError("");
    try { const dataUrl = await readSmallFile(file, kind === "image" ? 1572864 : 3145728); setMedia((current) => ({ ...current, [`${kind}DataUrl`]: dataUrl, [`${kind}Name`]: file.name })); }
    catch (fileError) { setError(fileError.message); }
  }

  function testVoice() {
    if (!draft || !("speechSynthesis" in window)) return setError("La prova voce non è disponibile in questo browser.");
    speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(`Ciao, sono ${draft.name}. Questa è la mia voce di prova.`); utterance.lang = "it-IT";
    const voices = speechSynthesis.getVoices(); const preferred = voice === "browser-female" ? voices.find((item) => /elsa|isabella|female/i.test(item.name)) : voices.find((item) => item.lang?.startsWith("it")); if (preferred) utterance.voice = preferred; speechSynthesis.speak(utterance);
  }

  function publishAvatar() {
    if (!consent) return setError("Conferma di avere i diritti per utilizzare immagine, video e voce.");
    const completed = { ...draft, imageDataUrl: media.imageDataUrl, imageUrl: imageUrl.trim(), imageName: media.imageName, videoDataUrl: media.videoDataUrl, videoUrl: videoUrl.trim(), videoName: media.videoName, voice, knowledgeUrl: knowledgeUrl.trim(), knowledgeSummary: knowledgeNotes.trim() || draft.knowledgeSummary, mediaMode: preview.video ? "video" : preview.image ? "image" : "placeholder", syncMode: preview.video ? "speaking-loop" : "still-image", publishedAt: new Date().toISOString() };
    try { saveAvatar(completed); setCreated(completed); setError(""); } catch { setError("Il file è troppo grande per il salvataggio locale. Inserisci un URL pubblico."); }
  }

  return <div className="creator-flow">
    <form className="platform-creator-card" onSubmit={createConfiguration}><label htmlFor="creatorPrompt">Descrivi cosa vuoi creare</label><textarea id="creatorPrompt" onChange={(e) => setPrompt(e.target.value)} placeholder="Esempio: crea Ettore, assistente commerciale che presenta prodotti e servizi alle aziende." value={prompt} /><button disabled={loading} type="submit">{loading ? "Sto creando…" : draft ? "↻ Rigenera con AI" : "✨ Crea con AI"}</button></form>
    {error ? <p className="creator-message creator-message--error">{error}</p> : null}
    {draft ? <div className="creator-blocks">
      <CreatorBlock number="1" title="Azienda e identità" text="Controlla la configurazione proposta dall’AI."><div className="creator-fields"><Field label="Nome avatar" value={draft.name} onChange={(v) => updateDraft("name", v)} /><Field label="Azienda" value={draft.companyName} onChange={(v) => updateDraft("companyName", v)} /><Field label="Categoria" value={draft.category} onChange={(v) => updateDraft("category", v)} /><label>Colore<input type="color" value={draft.accent} onChange={(e) => updateDraft("accent", e.target.value)} /></label><Field area wide label="Ruolo" value={draft.role} onChange={(v) => updateDraft("role", v)} /><Field area wide label="Tono" value={draft.tone} onChange={(v) => updateDraft("tone", v)} /></div></CreatorBlock>
      <CreatorBlock number="2" title="Immagine e video" text="Carica file leggeri per il test oppure usa URL pubblici."><div className="creator-media-grid"><label className="creator-upload">Foto avatar<input accept="image/jpeg,image/png,image/webp" type="file" onChange={(e) => selectMedia(e, "image")} /><small>{media.imageName || "JPG, PNG o WebP · max 1,5 MB"}</small></label><label className="creator-upload">Video avatar<input accept="video/mp4,video/webm" type="file" onChange={(e) => selectMedia(e, "video")} /><small>{media.videoName || "MP4 o WebM · max 3 MB"}</small></label><Field label="URL immagine" placeholder="https://…/avatar.jpg" value={imageUrl} onChange={setImageUrl} /><Field label="URL video" placeholder="https://…/avatar.mp4" value={videoUrl} onChange={setVideoUrl} /></div><div className="creator-preview">{preview.video ? <video autoPlay loop muted playsInline src={preview.video} /> : preview.image ? <img alt={`Anteprima ${draft.name}`} src={preview.image} /> : <div>{draft.name.slice(0, 1)}</div>}<span>{preview.video ? "Video pronto: si attiva quando parla" : preview.image ? "Foto pronta: lip-sync da generare" : "Aggiungi foto o video"}</span></div></CreatorBlock>
      <CreatorBlock number="3" title="Voce" text="Scegli e ascolta la voce prima della pubblicazione."><div className="creator-inline"><select aria-label="Voce avatar" value={voice} onChange={(e) => setVoice(e.target.value)}><option value="browser-it">Voce italiana del dispositivo</option><option value="browser-female">Voce italiana femminile</option><option value="openai">OpenAI Voice · collegata</option><option value="elevenlabs">ElevenLabs / voce clonata · da collegare</option></select><button type="button" onClick={testVoice}>▶ Prova voce</button></div></CreatorBlock>
      <CreatorBlock number="4" title="Knowledge" text="Aggiungi sito e informazioni certe. PDF e scansione sito saranno collegati al database."><div className="creator-fields"><Field wide label="Sito web" placeholder="https://www.azienda.it" value={knowledgeUrl} onChange={setKnowledgeUrl} /><Field area wide label="Conoscenza iniziale" value={knowledgeNotes} onChange={setKnowledgeNotes} /><label className="creator-upload creator-wide">Documenti PDF<input accept="application/pdf" multiple type="file" disabled /><small>Si attiva con il salvataggio cloud/Supabase.</small></label></div></CreatorBlock>
      <CreatorBlock number="5" title="Test e pubblicazione" text="Il movimento base usa un video; il lip-sync facciale professionale richiede HeyGen."><div className="creator-status-grid"><span className="is-ready">Identità</span><span className={preview.image || preview.video ? "is-ready" : ""}>Media</span><span className="is-ready">Voce</span><span className={knowledgeNotes ? "is-ready" : ""}>Knowledge</span><span>Lip-sync HeyGen</span></div><label className="creator-consent"><input checked={consent} type="checkbox" onChange={(e) => setConsent(e.target.checked)} /> Confermo di avere l’autorizzazione a utilizzare immagine, video e voce caricati.</label><button className="creator-publish" type="button" onClick={publishAvatar}>Pubblica avatar di prova</button></CreatorBlock>
    </div> : null}
    {created ? <div className="creator-result"><div><span>✓ Avatar pubblicato</span><strong>{created.name}</strong><small>{created.companyName}</small></div><a href={`/avatar/${created.slug}`} target="_blank">Apri e prova {created.name} ↗</a></div> : null}
  </div>;
}

function CreatorBlock({ number, title, text, children }) { return <section className="creator-block"><div className="creator-block-head"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>{children}</section>; }
function Field({ area, label, onChange, placeholder, value, wide }) { return <label className={wide ? "creator-wide" : ""}>{label}{area ? <textarea rows="4" value={value} onChange={(e) => onChange(e.target.value)} /> : <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />}</label>; }

export function CreatedAvatarCards() {
  const [avatars, setAvatars] = useState([]);
  useEffect(() => { const refresh = () => setAvatars(readAvatars()); refresh(); addEventListener("avatarone:avatars-changed", refresh); addEventListener("storage", refresh); return () => { removeEventListener("avatarone:avatars-changed", refresh); removeEventListener("storage", refresh); }; }, []);
  return avatars.map((avatar) => <article className="platform-client-card" key={avatar.slug}><div className="platform-client-head"><div className="platform-client-avatar">✨</div><mark>Test</mark></div><div className="platform-client-title"><span>AI</span><div><h3>{avatar.name}</h3><p>{avatar.companyName}</p></div></div><div className="platform-client-meta"><span>{avatar.category}</span><span>{avatar.voice === "elevenlabs" ? "ElevenLabs" : "Voce AI"}</span></div><div className="platform-client-launch"><span>{avatar.mediaMode === "video" ? "Video dinamico" : avatar.mediaMode === "image" ? "Immagine" : "Creator Beta"}</span><strong>Pronto</strong></div><div className="platform-client-actions"><a className="platform-open-button" href={`/avatar/${avatar.slug}`} target="_blank">Apri e prova {avatar.name} <span>↗</span></a><span className="platform-local-label">Salvato su questo dispositivo</span></div></article>);
}
