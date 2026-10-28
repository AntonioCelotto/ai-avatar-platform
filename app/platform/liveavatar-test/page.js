"use client";
import { useState } from "react";

export default function LiveAvatarSandbox() {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState("");
  const [session, setSession] = useState(null);
  async function test() {
    setState("loading"); setResult(""); setSession(null);
    try {
      const response = await fetch("/api/liveavatar-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sandbox: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LiveAvatar non disponibile");
      setSession({sessionToken:data.sessionToken,sessionId:data.sessionId});
      setResult("Connessione riuscita. Sessione sandbox creata. Ora puoi provare ad avviare il flusso.");
      setState("ok");
    } catch (error) { setResult(error.message); setState("error"); }
  }
  async function start() {
    if (!session) return;
    setState("loading");
    try {
      const response = await fetch("/api/liveavatar-test/start", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(session)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossibile avviare la sessione");
      setResult("Sessione avviata: LiveKit disponibile. Il player video verra collegato nella prossima fase.");
      setState("started");
    } catch(error) { setResult(error.message); setState("error"); }
  }
  return <main style={{maxWidth:760,margin:"4rem auto",padding:"2rem",fontFamily:"system-ui",color:"#f5f7ff",background:"#111827",border:"1px solid #334155",borderRadius:18}}>
    <h1>LiveAvatar - laboratorio isolato</h1>
    <p>Questa pagina serve a verificare il collegamento API in modalita sandbox. Non cambia le impostazioni di Fabio o degli altri avatar.</p>
    <p>Le sessioni a pagamento sono disabilitate. Il lip-sync in tempo reale non e ancora collegato.</p>
    <button onClick={test} disabled={state==="loading"} style={{padding:"12px 18px",cursor:"pointer",color:"#fff",background:"#2563eb",border:"none",borderRadius:8}}>{state==="loading"?"Verifica in corso...":"Verifica collegamento sandbox"}</button>
    {session ? <button onClick={start} disabled={state==="loading" || state==="started"} style={{padding:"12px 18px",marginLeft:12,cursor:"pointer",color:"#fff",background:"#047857",border:"none",borderRadius:8}}>Avvia sessione sandbox</button> : null}
    <p role="status">{result}</p>
    <p><a style={{color:"#93c5fd"}} href="/platform">Torna alla piattaforma</a></p>
  </main>;
}
