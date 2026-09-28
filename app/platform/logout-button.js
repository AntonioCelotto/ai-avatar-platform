"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton() { const router = useRouter(); return <button className="platform-logout" onClick={async () => { await fetch("/api/admin-session", { method: "DELETE" }); router.replace("/admin-login"); router.refresh(); }} type="button">Esci</button>; }
