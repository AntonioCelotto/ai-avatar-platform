"use client";
import { useState } from "react";

export default function LiveAvatarSandbox() {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState("");
  async function test() {
    setState("loading"); setResult("");
    try {
      const response = await fetch("/api/liveavatar-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sandbox: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LiveAvatar non disponibile");
      setResult("Token sandbox ottenuto. ID sessione: " + (data.sessionId || "non restituito") + ". Lo streaming non e ancora attivo.");
      setState("ok");
    } catch (error) { setResult(error.message); setState("error"); }
  }
  return <main style={{maxWidth:760,margin:"4rem auto",padding:"2rem",fontFamily:"system-ui"}}>
    <h1>LiveAvatar - laboratorio isolato</h1>
    <p>Questa pagina serve a verificare il collegamento API in modalita sandbox. Non cambia le impostazioni di Fabio o degli altri avatar.</p>
    <p>Le sessioni a pagamento sono disabilitate. Il lip-sync in tempo reale non e ancora collegato.</p>
    <button onClick={test} disabled={state==="loading"} style={{padding:"12px 18px",cursor:"pointer"}}>{state==="loading"?"Verifica in corso...":"Verifica collegamento sandbox"}</button>
    <p role="status">{result}</p>
    <p><a href="/platform">Torna alla piattaforma</a></p>
  </main>;
}
