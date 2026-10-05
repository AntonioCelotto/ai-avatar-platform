import "./globals.css";
import "./app-shell.css";
import "./mia-polished.css";
import "./mia-fixes.css";
import "./mia-avatar-test.css";
import "./dashboard-fixes.css";
import "./mia-commercial.css";
import { PwaInstaller } from "./pwa-installer";

export const metadata = {
  metadataBase: new URL("https://www.avatarone.it"),
  title: "AvatarOne · Persone digitali AI",
  description: "Avatar AI personalizzati che parlano, rispondono, apprendono da siti e PDF e trasformano le conversazioni in contatti.",
  applicationName: "AvatarOne",
  keywords: ["avatar AI", "assistente virtuale", "intelligenza artificiale per aziende", "avatar parlante", "chatbot vocale", "AvatarOne", "MIA AI"],
  authors: [{ name: "New Digital App", url: "https://www.avatarone.it" }],
  creator: "New Digital App",
  publisher: "New Digital App",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://www.avatarone.it",
    siteName: "AvatarOne",
    title: "AvatarOne · Persone digitali AI per aziende",
    description: "Avatar AI personalizzati che parlano, rispondono, apprendono da siti e PDF e trasformano le conversazioni in contatti.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "AvatarOne by New Digital App" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AvatarOne · Persone digitali AI per aziende",
    description: "Avatar AI personalizzati che parlano, rispondono e conoscono la tua azienda.",
    images: ["/icon-512.png"]
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AvatarOne"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <PwaInstaller />
        {children}
      </body>
    </html>
  );
}
