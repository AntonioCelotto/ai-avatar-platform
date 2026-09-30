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
  description: "Avatar AI parlanti per siti, app e clienti business.",
  applicationName: "AvatarOne",
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
