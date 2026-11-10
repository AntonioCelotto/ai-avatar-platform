"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarVideo } from "../../avatar-video";
import CustomAssistant from "./custom-assistant";
import AvatarInstall from "./install-avatar";

const STORAGE_KEY = "avatarone:custom-avatars";

export default function CustomAvatar({ slug, initialAvatar, initialImmersive = false, experienceMode = false }) {
  const [immersive, setImmersive] = useState(initialImmersive);
  const [avatar, setAvatar] = useState(() => initialAvatar ? {
    slug: initialAvatar.slug,
    companyName: initialAvatar.company_name,
    category: initialAvatar.category,
    name: initialAvatar.spoken_avatar_name || initialAvatar.avatar_name,
    imageUrl: initialAvatar.avatar_poster_url || "",
    videoUrl: initialAvatar.avatar_video_url || "",
    idleVideoUrl: initialAvatar.features?.idleVideoUrl || "",
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

  const experienceMedia = experienceMode ? (initialAvatar?.features?.experienceMedia || {}) : {};
  const tenant = {
    slug: avatar.slug,
    name: avatar.companyName,
    assistantName: avatar.name,
    spokenAssistantName: avatar.name,
    welcomeMessage: avatar.welcomeMessage,
    inputPlaceholder: `Scrivi a ${avatar.name}`,
    avatarVideo: experienceMedia.talking || avatar.videoDataUrl || avatar.videoUrl || "",
    avatarIdleVideo: experienceMedia.idle || avatar.idleVideoUrl || "",
    avatarPoster: experienceMedia.poster || avatar.imageDataUrl || avatar.imageUrl || "",
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
    <main className={`mobile-chat-shell custom-avatar-shell ${immersive ? "avatar-immersive" : ""} ${slug === "giulia-new-digital-app" ? "giulia-framing" : ""}`} style={tenant.theme}>
      <style>{`
        .custom-avatar-shell.avatar-immersive { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; overflow: hidden !important; z-index: 2147483000 !important; display: flex !important; flex-direction: column !important; background: #06121e !important; }
        .avatar-immersive .avatar-stage { flex: 1 1 auto !important; min-height: 0 !important; height: auto !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        .avatar-immersive .avatar-frame { width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; border-radius: 0 !important; }
        .avatar-immersive .assistant-workspace { position: absolute !important; bottom: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; z-index: 8 !important; pointer-events: none !important; }
        .avatar-immersive .assistant-panel { pointer-events: none !important; padding: 40px 14px max(18px, env(safe-area-inset-bottom)) !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; min-height: 0 !important; height: auto !important; max-height: none !important; background: linear-gradient(transparent, #071825aa) !important; }
        .avatar-immersive .assistant-panel .messages, .avatar-immersive .assistant-panel .suggestions, .avatar-immersive .assistant-panel .order-bar { display: none !important; }
        .avatar-immersive .assistant-panel .assistant-header { display: flex !important; position: fixed !important; bottom: max(20px, env(safe-area-inset-bottom)) !important; left: 50% !important; transform: translateX(-50%) !important; width: max-content !important; max-width: calc(100vw - 32px) !important; background: #06121edb !important; padding: 8px 12px !important; border-radius: 16px !important; pointer-events: none !important; z-index: 12 !important; }
        .avatar-immersive .assistant-panel .assistant-title { display: none !important; }
        .avatar-immersive .assistant-panel .assistant-status { display: block !important; color: #fff !important; font-size: 13px !important; text-align: center !important; }
        .avatar-immersive .assistant-panel .action-dock { pointer-events: auto !important; display: flex !important; justify-content: center !important; align-items: center !important; gap: 12px !important; margin: 0 auto !important; width: min(100%, 320px) !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
        .avatar-immersive .assistant-panel .composer input { display: none !important; }
        .avatar-immersive .assistant-panel .composer .send-button { display: none !important; }
        .avatar-immersive .assistant-panel .composer { flex: 0 0 auto !important; width: auto !important; justify-content: center !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
        .avatar-immersive .assistant-panel .composer .icon-button { width: 70px !important; height: 70px !important; border-radius: 50% !important; background: #008c86dd !important; box-shadow: 0 6px 25px #0008 !important; }
        .avatar-immersive .assistant-panel .whatsapp-link { width: 46px !important; height: 46px !important; min-width: 46px !important; padding: 0 !important; border-radius: 50% !important; font-size: 0 !important; overflow: hidden !important; justify-content: center !important; }
        .avatar-immersive .assistant-panel .whatsapp-link .whatsapp-icon { font-size: 20px !important; }
        .avatar-immersive .assistant-panel .action-dock--chat-only { justify-content: center !important; }
        .avatar-immersive .avatar-frame .custom-avatar-image, .avatar-immersive .avatar-frame video { object-fit: contain !important; }
        .avatar-immersive .avatar-frame { background: #06121e !important; }
        .avatar-immersive .assistant-workspace { top: 76px !important; right: 12px !important; bottom: auto !important; left: auto !important; width: 48px !important; }
        .avatar-immersive .assistant-panel { width: 48px !important; padding: 0 !important; background: transparent !important; }
        .avatar-immersive .assistant-panel .action-dock { flex-direction: column !important; gap: 8px !important; width: 48px !important; }
        .avatar-immersive .assistant-panel .composer { width: 48px !important; }
        .avatar-immersive .assistant-panel .composer .icon-button { width: 44px !important; height: 44px !important; min-width: 44px !important; }
        .avatar-immersive .assistant-panel .composer .voice-label { display: none !important; }
        .avatar-immersive .assistant-panel .whatsapp-link { width: 42px !important; height: 42px !important; min-width: 42px !important; }
        .avatar-immersive .avatar-stage, .avatar-immersive .avatar-frame { height: 100dvh !important; }
        .avatar-immersive .avatar-expand-toggle { padding: 8px 11px !important; font-size: 12px !important; }
        .avatar-immersive.giulia-framing .avatar-frame video, .avatar-immersive.giulia-framing .avatar-frame .custom-avatar-image { width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important; }
        /* Giulia Experience only: simulated holographic depth and green-screen key. */
        .giulia-depth-demo .avatar-frame { isolation: isolate; background: radial-gradient(ellipse at 50% 42%, #164454 0%, #071b27 50%, #02070c 100%) !important; }
        .giulia-depth-demo .avatar-frame::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 78%, #6ce7d52b, transparent 47%), linear-gradient(90deg, #8bfff510, transparent 18%, transparent 82%, #8bfff510); }
        .giulia-depth-demo .avatar-frame::after { content: ""; position: absolute; left: 14%; right: 14%; bottom: 3%; height: 14%; border-radius: 50%; background: radial-gradient(ellipse, #86f9eb45, #20474b22 42%, transparent 73%); transform: perspective(320px) rotateX(64deg); z-index: 0; pointer-events: none; }
        .giulia-depth-demo .avatar-frame > div:first-child { position: relative; z-index: 1; }
        .giulia-depth-demo .avatar-frame > div:first-child video, .giulia-depth-demo .avatar-frame > div:first-child img { filter: url(#giulia-experience-key) drop-shadow(0 10px 16px #0009) !important; }
        .giulia-depth-demo .avatar-frame .mia-name-mark, .giulia-depth-demo .avatar-frame .mia-commercial-badge { z-index: 4; }
        /* Giulia banner compact test. */
        .custom-avatar-shell.giulia-framing.avatar-immersive .mia-commercial-badge { left: 14px !important; right: auto !important; width: max-content !important; max-width: min(47vw, 245px) !important; padding: 5px 9px !important; font-size: 10px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
        .giulia-depth-toggle { position: fixed !important; z-index: 2147483100 !important; top: 76px !important; left: 14px !important; padding: 9px 12px; border-radius: 999px; border: 1px solid #a8f6e980; color: white; background: #071923dc; font: 600 12px system-ui,sans-serif; cursor: pointer; }
        /* Keep the compact controls fully visible inside the portrait viewport. */
        .avatar-immersive .assistant-workspace { top: 82px !important; right: 18px !important; width: 56px !important; max-width: 56px !important; overflow: visible !important; }
        .avatar-immersive .assistant-panel { width: 56px !important; max-width: 56px !important; overflow: visible !important; }
        .avatar-immersive .assistant-panel .action-dock { display: flex !important; flex-direction: column !important; width: 56px !important; min-width: 56px !important; max-width: 56px !important; overflow: visible !important; align-items: center !important; }
        .avatar-immersive .assistant-panel .composer { width: 56px !important; min-width: 56px !important; max-width: 56px !important; overflow: visible !important; display: flex !important; justify-content: center !important; }
        .avatar-immersive .assistant-panel .composer .icon-button { flex: 0 0 46px !important; width: 46px !important; min-width: 46px !important; height: 46px !important; min-height: 46px !important; margin: 0 !important; }
        .avatar-immersive .assistant-panel .whatsapp-link { flex: 0 0 44px !important; width: 44px !important; min-width: 44px !important; height: 44px !important; min-height: 44px !important; margin: 0 !important; }
        /* Immersive controls: transparent containers, only the two round buttons remain visible. */
        .avatar-immersive .assistant-workspace, .avatar-immersive .assistant-panel, .avatar-immersive .action-dock, .avatar-immersive .composer { background: transparent !important; background-color: transparent !important; background-image: none !important; box-shadow: none !important; border: 0 !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        .avatar-immersive .assistant-workspace::before, .avatar-immersive .assistant-workspace::after, .avatar-immersive .assistant-panel::before, .avatar-immersive .assistant-panel::after, .avatar-immersive .action-dock::before, .avatar-immersive .action-dock::after, .avatar-immersive .composer::before, .avatar-immersive .composer::after { content: none !important; display: none !important; }
        @media (max-width: 600px) { .avatar-immersive .avatar-expand-toggle { font-size: 13px; } }
        .avatar-expand-toggle { position: absolute; top: max(12px, env(safe-area-inset-top)); right: 14px; z-index: 10; border: 1px solid #ffffff80; border-radius: 999px; padding: 10px 15px; background: #081a2dd9; color: white; font: 600 14px system-ui, sans-serif; cursor: pointer; }
        .avatar-immersive .avatar-share-button { flex: 0 0 44px !important; width: 44px !important; height: 44px !important; }
        .avatar-immersive .mia-commercial-badge { right: 12px !important; max-width: calc(100% - 150px) !important; }
        /* Keep the avatar label clear of the bottom listening/speaking indicator. */
        .custom-avatar-shell.avatar-immersive .mia-name-mark { top: auto !important; bottom: max(105px, calc(env(safe-area-inset-bottom) + 105px)) !important; }
        /* The compact view needs a bounded, visible video stage on mobile. */
        @media (max-width: 860px) {
          .custom-avatar-shell:not(.avatar-immersive) { display: flex !important; flex-direction: column !important; min-height: 100dvh !important; }
          .giulia-framing .avatar-frame video, .giulia-framing .avatar-frame img { object-fit: contain !important; object-position: center center !important; }
        .giulia-framing .avatar-frame > div:first-child { width: 100% !important; height: 100% !important; }
        .giulia-framing .avatar-frame { background: #06121e !important; }
        .custom-avatar-shell:not(.avatar-immersive) .avatar-stage { display: flex !important; position: relative !important; flex: 0 0 auto !important; height: clamp(360px, 53dvh, 590px) !important; min-height: 0 !important; max-height: none !important; padding: 10px !important; overflow: visible !important; }
          .custom-avatar-shell:not(.avatar-immersive) .avatar-frame { position: relative !important; display: block !important; flex: 1 1 auto !important; height: 100% !important; min-height: 0 !important; overflow: hidden !important; }
          .custom-avatar-shell:not(.avatar-immersive) .avatar-frame > div:first-child { width: 100% !important; height: 100% !important; }
          .custom-avatar-shell:not(.avatar-immersive):not(.giulia-framing) .avatar-frame video, .custom-avatar-shell:not(.avatar-immersive):not(.giulia-framing) .avatar-frame img { display: block !important; width: 100% !important; height: 100% !important; object-fit: cover !important; object-position: center 24% !important; }
          .custom-avatar-shell:not(.avatar-immersive) .mia-name-mark { top: auto !important; bottom: 14px !important; }
          .custom-avatar-shell:not(.avatar-immersive) .mia-name-mark span { font-size: clamp(38px, 12vw, 60px) !important; }
          .custom-avatar-shell:not(.avatar-immersive) .assistant-workspace { flex: 1 1 auto !important; height: auto !important; min-height: 0 !important; padding-bottom: max(12px, env(safe-area-inset-bottom)) !important; }
          .custom-avatar-shell:not(.avatar-immersive) .assistant-panel { height: auto !important; min-height: 0 !important; max-height: none !important; padding-bottom: 8px !important; display: flex !important; flex-direction: column !important; }
          .custom-avatar-shell:not(.avatar-immersive) .assistant-panel .messages { flex: 0 1 auto !important; max-height: 240px !important; min-height: 0 !important; overflow-y: auto !important; }
          .custom-avatar-shell:not(.avatar-immersive) .assistant-panel .message-list { min-height: 0 !important; justify-content: flex-start !important; }
          .custom-avatar-shell:not(.avatar-immersive) .assistant-panel .action-dock { position: sticky !important; left: auto !important; right: auto !important; bottom: max(8px, env(safe-area-inset-bottom)) !important; z-index: 100 !important; width: auto !important; max-width: none !important; margin: 0 !important; padding: 9px !important; border-radius: 22px !important; background: #071825f5 !important; border: 1px solid #64e9f744 !important; box-shadow: 0 6px 24px #0008 !important; display: flex !important; align-items: center !important; }
          .custom-avatar-shell:not(.avatar-immersive) .assistant-panel .order-bar { display: none !important; }
        }


        /* Tablet-specific fix: the <=860px contain rule must not override immersive cover. */
        .custom-avatar-shell.avatar-immersive.giulia-framing .avatar-frame,
        .custom-avatar-shell.avatar-immersive.giulia-framing .avatar-frame > div:first-child { width:100% !important;height:100% !important;max-width:none !important;overflow:hidden !important; }
        .custom-avatar-shell.avatar-immersive.giulia-framing .avatar-frame video,
        .custom-avatar-shell.avatar-immersive.giulia-framing .avatar-frame img { width:100% !important;height:100% !important;object-fit:cover !important;object-position:center center !important; }
        /* Give the install prompt its own line below the online badge. */
        .custom-avatar-shell.avatar-immersive.giulia-framing .avatar-install-control { top:58px !important;left:14px !important;z-index:25 !important;max-width:min(65vw,240px) !important; }
        .custom-avatar-shell.avatar-immersive.giulia-framing .mia-commercial-badge { top:12px !important;left:14px !important;right:auto !important;max-width:calc(100vw - 130px) !important; }
      `}</style>
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label={tenant.assistantName} style={{ position: "relative" }}>
        <button type="button" className="avatar-expand-toggle" aria-label={immersive ? "Esci dalla modalità a tutto schermo" : "Espandi avatar a tutto schermo"} aria-pressed={immersive} onClick={() => setImmersive((value) => !value)}>{immersive ? "↙ Riduci" : "⛶ Espandi"}</button>
        <AvatarInstall name={tenant.assistantName} />
        <div className="avatar-frame" aria-label={`Avatar ${tenant.spokenAssistantName}`}>
          {Boolean(tenant.avatarVideo || tenant.avatarIdleVideo)
            ? <AvatarVideo label={`Avatar video ${tenant.spokenAssistantName}`} poster={tenant.avatarPoster} src={tenant.avatarVideo || tenant.avatarIdleVideo} idleSrc={tenant.avatarIdleVideo} />
            : tenant.avatarPoster
              ? <img className="custom-avatar-image" alt={`Avatar ${tenant.spokenAssistantName}`} src={tenant.avatarPoster} />
              : <div className="custom-avatar-placeholder" aria-label="Immagine avatar non disponibile">{tenant.spokenAssistantName.slice(0, 1)}</div>}
          {!experienceMode && <div className="mia-name-mark" aria-hidden="true"><span>{tenant.brandMark}</span></div>}
          <div className="mia-commercial-badge" aria-label={`${tenant.assistantName} è online`}>
            <span className="mia-commercial-dot" aria-hidden="true" />
            {tenant.assistantName.toUpperCase()} · ASSISTENTE AI ONLINE
          </div>
        </div>
      </section>
      <section className="assistant-workspace" aria-label={`Chat con ${tenant.assistantName}`}>
        <CustomAssistant tenant={tenant} immersive={immersive} />
      </section>
    </main>
  );
}
