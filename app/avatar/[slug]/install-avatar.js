"use client";
import { useEffect, useState } from "react";

export default function AvatarInstall({ name }) {
  const [prompt, setPrompt] = useState(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalled(standalone);
    const onPrompt = (event) => { event.preventDefault(); setPrompt(event); };
    const onInstalled = () => { setInstalled(true); setHelp(false); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  async function install() {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else setHelp((current) => !current);
  }
  if (installed) return null;
  return <div style={{ position: "absolute", top: 12, left: 12, zIndex: 12, maxWidth: "min(78vw, 270px)", fontFamily: "system-ui,sans-serif" }}>
    <button type="button" onClick={install} style={{ background: "#081a2de8", color: "white", border: "1px solid #ffffff80", borderRadius: 22, padding: "9px 12px", fontSize: 12, cursor: "pointer" }}>⬇ Installa {name}</button>
    {help ? <div role="status" style={{ marginTop: 8, background: "#081a2df5", color: "white", borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 1.5 }}>
      Su iPhone: apri in Safari, tocca Condividi e scegli Aggiungi alla schermata Home, poi Apri come app. Su Android: apri il menu del browser e scegli Installa app o Aggiungi a schermata Home.
    </div> : null}
  </div>;
}
