import "./globals.css";

export const metadata = {
  title: "New Digital App AI",
  description: "Avatar AI parlanti per siti, app e clienti business."
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
