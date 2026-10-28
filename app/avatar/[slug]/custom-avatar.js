"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarVideo } from "../../avatar-video";
import CustomAssistant from "./custom-assistant";

const STORAGE_KEY = "avatarone:custom-avatars";

export default function CustomAvatar({ slug, initialAvatar }) {
  const [immersive, setImmersive] = useState(false);
  const [avatar, setAvatar] = useState(() => initialAvatar ? {
    slug: initialAvatar.slug,
    companyName: initialAvatar.company_name,
    category: initialAvatar.category,
    name: initialAvatar.spoken_avatar_name || initialAvatar.avatar_name,
    imageUrl: initialAvatar.avatar_poster_url || "",
    videoUrl: initialAvatar.avatar_video_url || "",
    mediaMode: initialAvatar.media_mode,
    voice: initialAvatar.voice_provider,
    voiceId: initialAvatar.voice_id || "",
    whatsappPhone: initialAvatar.whatsapp_phone || "",
    role: initialAvatar.personality?.role || "assistente digitale",
    tone: initialAvatar.personality?.tone || "naturale e professionale",
    welcomeMessage: initialAvatar.welcome_message,
    suggestions: initialAvatar.suggestions || [],
    knowledgeSummary: initialAvatar.notes || "",
    knowledgeUrl: initialAvatar.website || "",
    websiteKnowledge: initialAvatar.website_knowledge || "",
    accent: initialAvatar.theme?.accent || "#0071e3",
    cloud: true
  } : undefined);

  useEffect(() => {
    if (initialAvatar) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      setAvatar(Array.isArray(saved) ? saved.find((item) => item.slug === slug) || null : null);
    } catch {
      setAvatar(null);
    }
  }, [initialAvatar, slug]);

  useEffect(() => {
    if (!immersive) return;
    const onKey = (event) => { if (event.key === "Escape") setImmersive(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [immersive]);

  if (avatar === undefined) return null;

  if (!avatar) {
    return (
      <main className="custom-avatar-missing">
        <section>
          <span>AvatarOne Creator</span>
          <h1>Avatar non trovato</h1>
          <p>Questo avatar non è ancora disponibile nel cloud.</p>
          <Link href="/platform#nuovo-cliente">Torna alla dashboard</Link>
        </section>
      </main>
    );
  }

  const tenant = {
    slug: avatar.slug,
    name: avatar.companyName,
    assistantName: avatar.name,
    spokenAssistantName: avatar.name,
    welcomeMessage: avatar.welcomeMessage,
    inputPlaceholder: `Scrivi a ${avatar.name}`,
    avatarVideo: avatar.videoDataUrl || avatar.videoUrl || "",
    avatarPoster: avatar.imageDataUrl || avatar.imageUrl || "",
    brandMark: avatar.name.toUpperCase().slice(0, 12),
    whatsappPhone: avatar.whatsappPhone || "",
    orderFallbackText: `Ciao, vorrei informazioni da ${avatar.name}.`,
    suggestions: avatar.suggestions,
    role: avatar.role,
    tone: avatar.tone,
    knowledgeSummary: avatar.knowledgeSummary,
    knowledgeUrl: avatar.knowledgeUrl || "",
    websiteKnowledge: avatar.websiteKnowledge || "",
    voice: avatar.voice || "openai",
    voiceId: avatar.voiceId || "",
    mediaMode: avatar.mediaMode || "placeholder",
    personality: {
      role: avatar.role,
      tone: avatar.tone,
      experienceGoal: "Aiutare l'utente in modo chiaro, utile e coerente con il progetto."
    },
    theme: {
      "--mia-coral": avatar.accent,
      "--mia-coral-strong": avatar.accent,
      "--mia-cyan": "#64e9f7",
      "--accent": avatar.accent,
      "--accent-strong": avatar.accent,
      "--signal": "#64e9f7"
    }
  };

  return (
    <main className={`mobile-chat-shell custom-avatar-shell ${immersive ? "avatar-immersive" : ""}`} style={tenant.theme}>
      <style>{`
        .custom-avatar-shell.avatar-immersive { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; overflow: hidden !important; z-index: 2147483000 !important; display: flex !important; flex-direction: column !important; background: #06121e !important; }
        .avatar-immersive .avatar-stage { flex: 1 1 auto !important; min-height: 0 !important; height: auto !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        .avatar-immersive .avatar-frame { width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; border-radius: 0 !important; }
        .avatar-immersive .assistant-workspace { flex: 0 0 auto !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; position: relative !important; z-index: 4 !important; }
        .avatar-immersive .assistant-panel { padding: 10px 14px max(12px, env(safe-area-inset-bottom)) !important; border-radius: 0 !important; min-height: 0 !important; height: auto !important; max-height: 185px !important; background: #071825ee !important; }
        .avatar-immersive .assistant-panel .messages, .avatar-immersive .assistant-panel .suggestions, .avatar-immersive .assistant-panel .order-bar { display: none !important; }
        .avatar-immersive .assistant-panel .assistant-header { margin-bottom: 8px !important; padding: 0 !important; }
        .avatar-immersive .assistant-panel .action-dock { margin: 0 !important; }
        .avatar-immersive .assistant-panel .composer input { display: none !important; }
        .avatar-immersive .assistant-panel .composer .send-button { display: none !important; }
        .avatar-immersive .assistant-panel .composer { justify-content: center !important; }
        .avatar-expand-toggle { position: absolute; top: max(12px, env(safe-area-inset-top)); right: 14px; z-index: 10; border: 1px solid #ffffff80; border-radius: 999px; padding: 10px 15px; background: #081a2dd9; color: white; font: 600 14px system-ui, sans-serif; cursor: pointer; }
        .avatar-immersive .mia-commercial-badge { right: 12px !important; max-width: calc(100% - 150px) !important; }
      `}</style>
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label={tenant.assistantName} style={{ position: "relative" }}>
        <button type="button" className="avatar-expand-toggle" aria-label={immersive ? "Esci dalla modalità a tutto schermo" : "Espandi avatar a tutto schermo"} aria-pressed={immersive} onClick={() => setImmersive((value) => !value)}>{immersive ? "↙ Riduci" : "⛶ Espandi"}</button>
        <div className="avatar-frame" aria-label={`Avatar ${tenant.spokenAssistantName}`}>
          {tenant.mediaMode === "video" && tenant.avatarVideo
            ? <AvatarVideo label={`Avatar video ${tenant.spokenAssistantName}`} poster={tenant.avatarPoster} src={tenant.avatarVideo} />
            : tenant.avatarPoster
              ? <img className="custom-avatar-image" alt={`Avatar ${tenant.spokenAssistantName}`} src={tenant.avatarPoster} />
              : <div className="custom-avatar-placeholder" aria-label="Immagine avatar non disponibile">{tenant.spokenAssistantName.slice(0, 1)}</div>}
          <div className="mia-name-mark" aria-hidden="true"><span>{tenant.brandMark}</span></div>
          <div className="mia-commercial-badge" aria-label={`${tenant.assistantName} è online`}>
            <span className="mia-commercial-dot" aria-hidden="true" />
            {tenant.assistantName.toUpperCase()} · ASSISTENTE AI ONLINE
          </div>
        </div>
      </section>
      <section className="assistant-workspace" aria-label={`Chat con ${tenant.assistantName}`}>
        <CustomAssistant tenant={tenant} />
      </section>
    </main>
  );
}
