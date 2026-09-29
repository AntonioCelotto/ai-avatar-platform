"use client";
export default function ClientLogout(){async function logout(){await fetch("/api/client-session",{method:"DELETE"});location.href="/client-login"}return <button className="platform-manage-link" onClick={logout} type="button">Esci</button>}
