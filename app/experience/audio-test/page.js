"use client";

import { useEffect, useRef, useState } from "react";

export default function ExperienceAudioTest() {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlRef = useRef(null);
  const [status, setStatus] = useState("Pronto per la prova");
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder));
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  async function start() {
    try {
      setStatus("Richiesta autorizzazione microfono...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        setStatus("Registrazione completata: premi Play per ascoltare.");
      };
      recorder.start();
      setRecording(true);
      setStatus("Registrazione in corso. Pronuncia: Ciao Mia.");
    } catch (error) {
      setRecording(false);
      setStatus("Microfono non accessibile: " + (error?.name || "errore") + ". " + (error?.message || ""));
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#07131d", color: "white", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>AvatarOne Experience</h1>
      <h2>Diagnostica microfono - dispositivo n02</h2>
      <p>Questa pagina di prova non modifica Mia e non invia registrazioni a un server.</p>
      <p aria-live="polite">{status}</p>
      {!supported && <p>Il browser non supporta getUserMedia o MediaRecorder.</p>}
      <button type="button" onClick={recording ? stop : start} disabled={!supported} style={{ padding: 16, fontSize: 18, borderRadius: 12 }}>
        {recording ? "Ferma registrazione" : "Avvia registrazione"}
      </button>
      {audioUrl && <div style={{ marginTop: 24 }}><audio controls src={audioUrl} /></div>}
      <p style={{ marginTop: 24, opacity: 0.8 }}>Test separato dalla funzione SpeechRecognition: verifica l'acquisizione audio reale su Firefox Android.</p>
    </main>
  );
}
