"use client";

import { useEffect, useState } from "react";

export default function ImmersiveAvatarShell({ children }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  return (
    <div className={expanded ? "avatarone-standalone-expanded" : "avatarone-standalone"}>
      <style>{`
        .avatarone-standalone, .avatarone-standalone-expanded { position: relative; height: 100svh; }
        .avatarone-standalone-expanded { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; z-index: 2147483000 !important; background: #020609; }
        .avatarone-standalone-expanded .mia-home { width: 100vw !important; max-width: none !important; height: 100dvh !important; min-height: 100dvh !important; max-height: 100dvh !important; grid-template-rows: minmax(0,1fr) !important; }
        .avatarone-standalone-expanded .mia-home .avatar-stage { padding: 0 !important; height: 100dvh !important; }
        .avatarone-standalone-expanded .mia-home .avatar-frame { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        .avatarone-standalone-expanded .mia-home .avatar-frame video, .avatarone-standalone-expanded .mia-home .avatar-frame img { object-fit: contain !important; }
        .avatarone-standalone-expanded .mia-home .assistant-workspace { position: absolute !important; z-index: 8 !important; top: 80px !important; right: 16px !important; left: auto !important; bottom: auto !important; width: 56px !important; height: auto !important; padding: 0 !important; overflow: visible !important; }
        .avatarone-standalone-expanded .mia-home .assistant-panel { display: block !important; width: 56px !important; height: auto !important; min-height: 0 !important; overflow: visible !important; border: 0 !important; background: transparent !important; box-shadow: none !important; backdrop-filter: none !important; }
        .avatarone-standalone-expanded .mia-home .assistant-header, .avatarone-standalone-expanded .mia-home .messages, .avatarone-standalone-expanded .mia-home .suggestions, .avatarone-standalone-expanded .mia-home .order-bar { display: none !important; }
        .avatarone-standalone-expanded .mia-home .action-dock { display: flex !important; flex-direction: column !important; width: 56px !important; gap: 10px !important; padding: 0 !important; }
        .avatarone-standalone-expanded .mia-home .composer { display: flex !important; width: 52px !important; padding: 0 !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }
        .avatarone-standalone-expanded .mia-home .composer input, .avatarone-standalone-expanded .mia-home .send-button { display: none !important; }
        .avatarone-standalone-expanded .mia-home .composer .icon-button { width: 48px !important; height: 48px !important; min-width: 48px !important; min-height: 48px !important; border-radius: 50% !important; }
        .avatarone-standalone-expanded .mia-home .whatsapp-link { width: 48px !important; height: 48px !important; min-height: 48px !important; border-radius: 50% !important; }
        .avatarone-standalone-expanded .mia-home .mia-name-mark { top: 48px !important; }
        .avatarone-expand-button { position: absolute; z-index: 2147483001; top: max(12px, env(safe-area-inset-top)); right: 14px; padding: 10px 15px; border: 1px solid #ffffff80; border-radius: 999px; background: #081a2dd9; color: white; font: 600 14px system-ui, sans-serif; cursor: pointer; }
      `}</style>
      {children}
      <button type="button" className="avatarone-expand-button" aria-label={expanded ? "Riduci avatar" : "Espandi avatar a tutto schermo"} aria-pressed={expanded} onClick={() => setExpanded((v) => !v)}>{expanded ? "↙ Riduci" : "⛶ Espandi"}</button>
    </div>
  );
}
