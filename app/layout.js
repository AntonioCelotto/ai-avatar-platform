import "./globals.css";
import "./app-shell.css";
import "./mia-polished.css";
import "./mia-fixes.css";
import "./mia-avatar-test.css";
import { PwaInstaller } from "./pwa-installer";

export const metadata = {
  title: "New Digital App AI",
  description: "Avatar AI parlanti per siti, app e clienti business.",
  applicationName: "Mia AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mia AI"
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport = {
  themeColor: "#05070d",
  colorScheme: "dark"
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
