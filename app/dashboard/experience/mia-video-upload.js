"use client";
import { useState } from "react";

export default function MiaVideoUpload() {
  const [idle, setIdle] = useState(null);
  const [talk, setTalk] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function upload(file, kind) {
    if (!file || !["video/mp4", "video/webm"].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error("Sono ammessi MP4 o WebM fino a 20 MB.");
    const res = await fetch("/api/avatar-creator", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"create_media_upload",slug:"mia-nda",kind,fileName:file.name,fileType:file.type})});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Impossibile preparare il caricamento.");
    const sent = await fetch(data.upload.signedUrl, {method:"PUT",headers:{"Content-Type":file.type},body:file});
    if (!sent.ok) throw new Error("Caricamento del video non riuscito.");
    return data.upload.publicUrl;
  }
  async function save() {
    if (!idle || !talk) { setError("Seleziona entrambi i video."); return; }
    setError(""); setDone(false);
    try {
      setStatus("Caricamento video riposo…");
      const idleUrl = await upload(idle,"idle");
      setStatus("Caricamento video parlato…");
      const talkUrl = await upload(talk,"video");
      setStatus("Collegamento a Mia NDA…");
      const res = await fetch("/api/avatar-clients",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:"mia-nda",idleVideoUrl:idleUrl,avatarVideoUrl:talkUrl,mediaMode:"video"})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Non riesco a salvare i video.");
      setDone(true); setStatus("Video salvati e collegati a Mia NDA.");
    } catch(e) {setError(e.message || "Errore di caricamento");setStatus("");}
  }
  return <section style={{padding:20,borderRadius:16,background:"#f5f7fb",color:"#182331",marginTop:24}}>
    <h2>Collega i due video a Mia NDA</h2>
    <p>Questa operazione aggiorna soltanto i video dell'avatar mia-nda: la voce Francesca e la conoscenza AI rimangono invariate.</p>
    <label style={{display:"block",marginBottom:14}}>Video riposo (riposo.mp4)<input type="file" accept="video/mp4,video/webm" onChange={e=>setIdle(e.target.files?.[0] || null)} /></label>
    <label style={{display:"block",marginBottom:14}}>Video parlato (15 sec.mp4)<input type="file" accept="video/mp4,video/webm" onChange={e=>setTalk(e.target.files?.[0] || null)} /></label>
    <button type="button" onClick={save} disabled={!idle || !talk || Boolean(status && !done && !error)} style={{background:"#1769e0",color:"#fff",padding:"14px 20px",borderRadius:10,fontWeight:700}}>Salva entrambi i video su Mia NDA</button>
    {status && <p role="status" style={{fontWeight:700}}>{status}</p>}
    {error && <p role="alert" style={{color:"#b91c1c",fontWeight:700}}>{error}</p>}
    {done && <p><a href="/avatar/mia-nda" target="_blank" rel="noreferrer" style={{color:"#1769e0",fontWeight:700}}>Apri Mia NDA aggiornata</a></p>}
  </section>;
}
