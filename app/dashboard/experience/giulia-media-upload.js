"use client";
import {useState} from "react";
const SLUG="giulia-new-digital-app";
export default function GiuliaMediaUpload(){
 const [portrait,setPortrait]=useState(null),[idle,setIdle]=useState(null),[talk,setTalk]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function upload(file,kind){
  if(!file)return null;
  if(file.size>20*1024*1024)throw Error("Ogni file deve essere inferiore a 20 MB.");
  const res=await fetch("/api/avatar-creator",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"create_media_upload",slug:SLUG,kind,fileName:file.name,fileType:file.type})});
  const data=await res.json();if(!res.ok||!data.upload?.signedUrl)throw Error(data.error||"Caricamento non autorizzato");
  const sent=await fetch(data.upload.signedUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});if(!sent.ok)throw Error("Invio file non riuscito");return data.upload.publicUrl;
 }
 async function save(){setBusy(true);setError("");setMessage("");try{
  if(!portrait||!idle||!talk)throw Error("Carica immagine, video respirazione e video parlato.");
  setMessage("Caricamento immagine…");const image=await upload(portrait,"poster");
  setMessage("Caricamento respirazione…");const rest=await upload(idle,"idle");
  setMessage("Caricamento parlato…");const speaking=await upload(talk,"video");
  setMessage("Collegamento alla Giulia Experience…");
  const res=await fetch("/api/avatar-clients",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:SLUG,avatarPosterUrl:image,idleVideoUrl:rest,avatarVideoUrl:speaking,mediaMode:"video"})});
  const d=await res.json();if(!res.ok)throw Error(d.error||"Impossibile salvare i media");
  setMessage("Media collegati. Verifica la versione Experience nel link sottostante.");
 }catch(e){setError(e.message||"Errore");setMessage("");}finally{setBusy(false)}}
 return <section style={{padding:20,borderRadius:16,background:"#edf6f4",color:"#123e39",marginTop:22}}><h2>Giulia Experience · Media definitivi</h2><p>Carica i tre file Mango per la versione a corpo intero. I file vengono collegati alla Giulia esistente: anche la demo standard userà i nuovi media. AI, voce e CUP rimangono invariati.</p>
 <label style={{display:"block",marginBottom:12}}>Foto Giulia (PNG/JPG)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPortrait(e.target.files?.[0]||null)}/></label>
 <label style={{display:"block",marginBottom:12}}>Video respirazione (MP4/WebM)<input type="file" accept="video/mp4,video/webm" onChange={e=>setIdle(e.target.files?.[0]||null)}/></label>
 <label style={{display:"block",marginBottom:12}}>Video parlato (MP4/WebM)<input type="file" accept="video/mp4,video/webm" onChange={e=>setTalk(e.target.files?.[0]||null)}/></label>
 <button type="button" disabled={busy||!portrait||!idle||!talk} onClick={save} style={{background:"#087d70",color:"white",padding:"12px 18px",border:0,borderRadius:9,cursor:"pointer"}}>{busy?"Caricamento…":"Salva i tre file su Giulia"}</button>
 {message&&<p role="status">{message}</p>}{error&&<p role="alert" style={{color:"#b91c1c"}}>{error}</p>}
 <p><a href="/experience/giulia" target="_blank" rel="noopener noreferrer">Apri il link pubblico Giulia Experience</a></p></section>;
}
