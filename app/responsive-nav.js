"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResponsiveNav({ sectorPage = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return <nav className={`landing-nav${open ? " menu-open" : ""}`}>
    <Link className="brand" href="/" onClick={() => setOpen(false)}><img className="landing-brand-mark" src="/icon-512.png" alt="Icona M di AvatarOne"/><div>AvatarOne <small>by New Digital App</small></div></Link>
    <button className="mobile-menu-button" type="button" aria-label={open ? "Chiudi menu" : "Apri menu"} aria-expanded={open} onClick={() => setOpen(value => !value)}><span/><span/><span/></button>
    <div className="nav-links">
      <Link href="/avatar" onClick={() => setOpen(false)}>Avatar</Link>
      {sectorPage ? <a href="#vantaggi" onClick={() => setOpen(false)}>Vantaggi</a> : <a href="/#funzioni" onClick={() => setOpen(false)}>Funzioni</a>}
      <Link href="/avatar#settori" onClick={() => setOpen(false)}>Settori</Link>
      {!sectorPage && <a href="/#pacchetti" onClick={() => setOpen(false)}>Pacchetti</a>}
      <Link href="/mia" onClick={() => setOpen(false)}>Prova MIA</Link>
      <a className="nav-cta" href={sectorPage ? "#contatti" : "/#contatti"} onClick={() => setOpen(false)}>{sectorPage ? "Richiedi una demo" : "Richiedi preventivo"}</a>
    </div>
  </nav>;
}
