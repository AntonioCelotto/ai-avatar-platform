import "./globals.css";

export const metadata = {
  title: "AI Avatar Platform",
  description: "Assistenti AI con avatar per ristoranti, hotel e attivita locali."
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
