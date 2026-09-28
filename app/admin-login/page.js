"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../platform/platform.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("a.celotto@newdigitalapp.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Accesso non riuscito.");
      router.replace("/platform"); router.refresh();
    } catch (loginError) { setError(loginError.message); }
    finally { setLoading(false); }
  }

  return <main className="admin-login-shell"><form className="admin-login-card" onSubmit={login}>
    <div className="platform-logo"><span>A1</span><div><strong>AvatarOne</strong><small>by New Digital App</small></div></div>
    <p className="platform-kicker">Area protetta</p><h1>Accedi alla dashboard</h1><p>Gestisci persone digitali, conoscenza e pubblicazione.</p>
    <label>Email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
    <label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    {error ? <p className="creator-message creator-message--error">{error}</p> : null}
    <button className="platform-primary" disabled={loading} type="submit">{loading ? "Accesso…" : "Accedi"}</button>
  </form></main>;
}
