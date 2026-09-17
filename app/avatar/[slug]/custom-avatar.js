"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarVideo } from "../../avatar-video";
import CustomAssistant from "./custom-assistant";

const STORAGE_KEY = "avatarone:custom-avatars";

export default function CustomAvatar({ slug, initialAvatar }) {
  const [avatar, setAvatar] = useState(() => initialAvatar ? {
    slug: initialAvatar.slug,
    companyName: initialAvatar.company_name,
    category: initialAvatar.category,
    name: initialAvatar.spoken_avatar_name || initialAvatar.avatar_name,
    imageUrl: initialAvatar.avatar_poster_url || "",
    videoUrl: initialAvatar.avatar_video_url || "",
    mediaMode: initialAvatar.media_mode,
    voice: initialAvatar.voice_provider,
    role: initialAvatar.personality?.role || "assistente digitale",
    tone: initialAvatar.personality?.tone || "naturale e professionale",
    welcomeMessage: initialAvatar.welcome_message,
    suggestions: initialAvatar.suggestions || [],
    knowledgeSummary: initialAvatar.notes || "",
    knowledgeUrl: initialAvatar.website || "",
    websiteKnowledge: "",
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
    avatarVideo: avatar.videoDataUrl || avatar.videoUrl || "/mia-avatar-video.mp4",
    avatarPoster: avatar.imageDataUrl || avatar.imageUrl || "",
    brandMark: avatar.name.toUpperCase().slice(0, 12),
    whatsappPhone: "393457980259",
    orderFallbackText: `Ciao, vorrei informazioni da ${avatar.name}.`,
    suggestions: avatar.suggestions,
    role: avatar.role,
    tone: avatar.tone,
    knowledgeSummary: avatar.knowledgeSummary,
    knowledgeUrl: avatar.knowledgeUrl || "",
    websiteKnowledge: avatar.websiteKnowledge || "",
    voice: avatar.voice || "browser-it",
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
    <main className="mobile-chat-shell" style={tenant.theme}>
      <div className="aurora aurora--coral" />
      <div className="aurora aurora--cyan" />
      <section className="avatar-stage" aria-label={tenant.assistantName}>
        <div className="avatar-frame" aria-label={`Avatar ${tenant.spokenAssistantName}`}>
          {tenant.mediaMode === "image" && tenant.avatarPoster
            ? <img className="custom-avatar-image" alt={`Avatar ${tenant.spokenAssistantName}`} src={tenant.avatarPoster} />
            : <AvatarVideo label={`Avatar video ${tenant.spokenAssistantName}`} poster={tenant.avatarPoster} src={tenant.avatarVideo} />}
          <div className="mia-name-mark" aria-hidden="true"><span>{tenant.brandMark}</span></div>
        </div>
      </section>
      <section className="assistant-workspace" aria-label={`Chat con ${tenant.assistantName}`}>
        <CustomAssistant tenant={tenant} />
      </section>
    </main>
  );
}
