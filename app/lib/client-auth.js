import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCustomerProfileByUserId } from "./supabase-server";

export const CLIENT_COOKIE = "avatarone_client_session";
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export async function signInClient(email, password) {
  if (!supabaseUrl || !publicKey) throw new Error("Accesso clienti non configurato.");
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: publicKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Email o password non corrette.");
  const profile = await getCustomerProfileByUserId(data.user?.id);
  if (!profile?.active) throw new Error("Account cliente non ancora attivato.");
  return { token: data.access_token, maxAge: Math.min(Number(data.expires_in || 3600), 3600) };
}

export async function clientFromToken(token) {
  if (!token || !supabaseUrl || !publicKey) return null;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, { headers: { apikey: publicKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return null;
  const user = await response.json();
  const profile = await getCustomerProfileByUserId(user.id).catch(() => null);
  return profile?.active ? { user, profile } : null;
}

export async function getClientSessionFromRequest(request) {
  const rawCookie = request.headers.get("cookie") || "";
  const token = rawCookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${CLIENT_COOKIE}=`))?.slice(CLIENT_COOKIE.length + 1);
  return clientFromToken(token ? decodeURIComponent(token) : "");
}

export async function requireClientPage() {
  const store = await cookies();
  const session = await clientFromToken(store.get(CLIENT_COOKIE)?.value);
  if (!session) redirect("/client-login");
  return session;
}

export function clientCookieHeader(token, maxAge = 3600) { return `${CLIENT_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
