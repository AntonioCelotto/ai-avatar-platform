"use client";
import { useEffect, useRef, useState } from "react";

export default function LiveAvatarSandbox() {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState("");
  const [session, setSession] = useState(null);
  const [connected, setConnected] = useState(false);
  const roomRef = useRef(null);
  const socketRef = useRef(null);
  const [voiceReady, setVoiceReady] = useState(false);
  const [speakingTest, setSpeakingTest] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; roomRef.current?.disconnect(); roomRef.current = null; socketRef.current?.close(); socketRef.current = null; };
  }, []);

  async function disconnect() {
    socketRef.current?.close(); socketRef.current = null; setVoiceReady(false);
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setConnected(false);
    setState("idle");
    setSession(null);
    setResult("Streaming disconnesso.");
  }

  async function test() {
    setState("loading"); setResult("");
    try {
      if (roomRef.current) await disconnect();
      const response = await fetch("/api/liveavatar-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sandbox: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LiveAvatar non disponibile");
      setSession({sessionToken:data.sessionToken,sessionId:data.sessionId});
      setResult("Token sandbox ottenuto. Ora avvia lo streaming.");
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
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const room = new Room({adaptiveStream:true,dynacast:true});
      roomRef.current = room;
      const attach = (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          videoRef.current.play().catch(() => {});
        }
        if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current);
          audioRef.current.play().catch(() => setResult("Video connesso. Premi 'Attiva audio' per ascoltare."));
        }
      };
      room.on(RoomEvent.TrackSubscribed, attach);
      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach());
      room.on(RoomEvent.Disconnected, () => { if (mountedRef.current) { setConnected(false); setResult("Sessione LiveAvatar terminata."); } });
      await room.connect(data.livekitUrl, data.livekitToken);
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) if (publication.track) attach(publication.track);
      }
      if (data.wsUrl && /^wss:\/\//.test(data.wsUrl)) {
        const socket = new WebSocket(data.wsUrl);
        socketRef.current = socket;
        socket.onmessage = (event) => { try { const msg = JSON.parse(event.data); if (msg.type === "session.state_updated" && (msg.state === "connected" || msg.status === "connected")) setVoiceReady(true); } catch {} };
        socket.onclose = () => setVoiceReady(false);
        socket.onerror = () => setResult("Video attivo, ma canale voce non disponibile.");
      }
      setConnected(true);
      setState("started");
      setResult("Streaming LiveKit collegato. Attendi che l'avatar appaia. Questo test non invia ancora audio per il lip-sync.");
    } catch (error) {
      roomRef.current?.disconnect();
      roomRef.current = null;
      setResult(error.message || "Errore di streaming");
      setState("error");
    }
  }

  async function speakTest() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !voiceReady) { setResult("Canale voce non ancora pronto."); return; }
    setSpeakingTest(true);
    try {
      const response = await fetch("/api/liveavatar-test/speech", {method:"POST"});
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Voce non disponibile"); }
      const pcm = new Uint8Array(await response.arrayBuffer());
      const eventId = "sandbox-" + Date.now();
      for (let offset = 0; offset < pcm.length; offset += 48000) {
        const chunk = pcm.subarray(offset, offset + 48000);
        let binary = "";
        for (let i = 0; i < chunk.length; i += 8192) binary += String.fromCharCode(...chunk.subarray(i, i + 8192));
        socket.send(JSON.stringify({type:"agent.speak",event_id:eventId,audio:btoa(binary)}));
      }
      socket.send(JSON.stringify({type:"agent.speak_end",event_id:eventId}));
      setResult("Audio inviato a LiveAvatar. Controlla movimento della bocca e audio.");
    } catch(error) {setResult(error.message);} finally {setSpeakingTest(false);}
  }

  async function enableAudio() {
    try { await audioRef.current?.play(); setResult("Audio abilitato. Attendi la trasmissione dell'avatar."); }
    catch { setResult("Il browser ha bloccato l'audio. Riprova dopo aver interagito con la pagina."); }
  }

  const buttonStyle = {padding:"12px 18px",cursor:"pointer",color:"#fff",background:"#2563eb",border:"none",borderRadius:8,marginRight:10,marginBottom:10};
  return <main style={{maxWidth:800,margin:"4rem auto",padding:"2rem",fontFamily:"system-ui",color:"#f5f7ff",background:"#111827",border:"1px solid #334155",borderRadius:18}}>
    <h1>LiveAvatar - laboratorio isolato</h1>
    <p>Test video in diretta con avatar sandbox. Fabio e gli altri avatar non vengono modificati.</p>
    <p>Le sessioni a pagamento sono disabilitate. Il lip-sync con ElevenLabs non e ancora collegato.</p>
    <button onClick={test} disabled={state==="loading" || connected} style={buttonStyle}>Verifica collegamento sandbox</button>
    {session && !connected ? <button onClick={start} disabled={state==="loading"} style={{...buttonStyle,background:"#047857"}}>Avvia streaming sandbox</button> : null}
    {connected && voiceReady ? <button onClick={speakTest} disabled={speakingTest} style={{...buttonStyle,background:"#7c3aed"}}>{speakingTest ? "Invio audio..." : "Fai parlare l avatar"}</button> : null}
    {connected && !voiceReady ? <p>Attendo collegamento del canale voce...</p> : null}
    {connected ? <button onClick={enableAudio} style={buttonStyle}>Attiva audio</button> : null}
    {connected ? <button onClick={disconnect} style={{...buttonStyle,background:"#b91c1c"}}>Termina streaming</button> : null}
    <p role="status">{result}</p>
    <div style={{position:"relative",background:"#020617",border:"1px solid #334155",borderRadius:12,overflow:"hidden",minHeight:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <video ref={videoRef} autoPlay playsInline style={{width:"100%",maxHeight:520,objectFit:"contain"}} />
      {!connected ? <span style={{position:"absolute",color:"#94a3b8",pointerEvents:"none"}}>Il video comparira qui dopo la connessione</span> : null}
    </div>
    <audio ref={audioRef} autoPlay />
    <p><a style={{color:"#93c5fd"}} href="/platform">Torna alla piattaforma</a></p>
  </main>;
}
