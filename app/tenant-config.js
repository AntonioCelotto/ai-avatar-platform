export const defaultTenantSlug = "new-digital-app";

export const tenants = [
  {
    slug: "new-digital-app",
    name: "New Digital App",
    assistantName: "Mia.Ai",
    spokenAssistantName: "Mia",
    ownerName: "Antonio",
    website: "https://www.newdigitalapp.com",
    whatsappPhone: "393457980259",
    welcomeMessage: "Ciao, sono Mia",
    inputPlaceholder: "Scrivi a Mia",
    avatarVideo: "/mia-avatar-video.mp4",
    avatarPoster: "",
    brandMark: "MIA",
    orderFallbackText: "Ciao, vorrei informazioni sull'avatar AI di New Digital App.",
    theme: {
      "--mia-coral": "#ff675f",
      "--mia-coral-strong": "#ff4f48",
      "--mia-cyan": "#64e9f7",
      "--accent": "#ff675f",
      "--accent-strong": "#ff4f48",
      "--signal": "#64e9f7"
    },
    suggestions: [
      "Parliamo di un'idea",
      "Aiutami a ragionare",
      "Fammi una domanda"
    ],
    personality: {
      role: "avatar AI conversazionale",
      tone: "naturale, caldo, intelligente, emozionale e professionale",
      experienceGoal:
        "Mia deve essere percepita come una presenza intelligente e naturale, non come un semplice chatbot tecnico o una brochure commerciale."
    },
    knowledge: [
      {
        title: "Prodotto",
        text:
          "New Digital App crea avatar AI parlanti per aziende. L'assistente puo' essere installato su siti, app o interfacce dedicate."
      },
      {
        title: "Esperienza",
        text:
          "Mia deve essere percepita come una presenza intelligente e naturale, non come un semplice chatbot tecnico o una brochure commerciale."
      },
      {
        title: "Apprendimento",
        text:
          "L'avatar deve poter imparare da sito web, documenti PDF e integrazioni API con gestionali, CRM, cataloghi o database del cliente."
      },
      {
        title: "Configurazione avatar",
        text:
          "Ogni cliente potra' configurare nome, colori, numero WhatsApp, genere visivo, carattere e tono dell'assistente. Esempi di tono: educato, professionale, diretto, empatico."
      },
      {
        title: "Sito collegato",
        text: "Il sito ufficiale collegato al primo avatar e' www.newdigitalapp.com."
      },
      {
        title: "Canali",
        text:
          "Il primo canale di contatto operativo e' WhatsApp tramite numero 393457980259. In seguito potranno essere aggiunte integrazioni dirette."
      }
    ]
  },
  {
    slug: "demo-cliente-01",
    name: "Demo Cliente 01",
    assistantName: "EPM",
    spokenAssistantName: "EPM",
    ownerName: "Referente Cliente",
    website: "https://example.com",
    whatsappPhone: "390000000000",
    welcomeMessage: "Ciao, sono EPM",
    inputPlaceholder: "Scrivi a EPM",
    avatarVideo: "/clients/demo-cliente-01/avatar.mp4",
    avatarPoster: "",
    brandMark: "EPM",
    orderFallbackText: "Ciao, vorrei informazioni sull'assistente AI di Demo Cliente 01.",
    theme: {
      "--mia-coral": "#2dd4bf",
      "--mia-coral-strong": "#14b8a6",
      "--mia-cyan": "#facc15",
      "--accent": "#2dd4bf",
      "--accent-strong": "#14b8a6",
      "--signal": "#facc15"
    },
    suggestions: [
      "Parliamo della mia esigenza",
      "Aiutami a scegliere",
      "Fammi una domanda"
    ],
    personality: {
      role: "assistente AI demo per un nuovo cliente",
      tone: "professionale, chiaro, accogliente e orientato all'esperienza",
      experienceGoal:
        "Mostrare come un nuovo avatar cliente possa rispondere con nome, contenuti, tono e contatti personalizzati."
    },
    knowledge: [
      {
        title: "Nota demo",
        text:
          "Questo tenant serve solo per simulare il processo di duplicazione. Non deve sostituire Mia finche' non viene attivato esplicitamente."
      }
    ]
  }
];

export function getTenant(slug = defaultTenantSlug) {
  return tenants.find((tenant) => tenant.slug === slug) || tenants[0];
}

export function getTenantPublicConfig(slug = defaultTenantSlug) {
  const tenant = getTenant(slug);

  return {
    slug: tenant.slug,
    name: tenant.name,
    assistantName: tenant.assistantName,
    spokenAssistantName: tenant.spokenAssistantName,
    whatsappPhone: tenant.whatsappPhone,
    welcomeMessage: tenant.welcomeMessage,
    inputPlaceholder: tenant.inputPlaceholder,
    avatarVideo: tenant.avatarVideo,
    avatarPoster: tenant.avatarPoster,
    brandMark: tenant.brandMark,
    orderFallbackText: tenant.orderFallbackText,
    suggestions: tenant.suggestions,
    theme: tenant.theme
  };
}
