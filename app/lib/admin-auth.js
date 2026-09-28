import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "avatarone_admin";
const SESSION_SECONDS = 60 * 60 * 12;

function adminEmail() {
  return String(process.env.DASHBOARD_ADMIN_EMAIL || "a.celotto@newdigitalapp.com").trim().toLowerCase();
}

function secret() {
  return process.env.DASHBOARD_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DASHBOARD_UPLOAD_PIN || "";
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signature(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function validateAdminCredentials(email, password) {
  const expectedPassword = process.env.DASHBOARD_ADMIN_PASSWORD || process.env.DASHBOARD_UPLOAD_PIN || "";
  return Boolean(
    secret() &&
    expectedPassword &&
    safeEqual(String(email || "").trim().toLowerCase(), adminEmail()) &&
    safeEqual(String(password || ""), expectedPassword)
  );
}

export function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({ email: adminEmail(), exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || !secret()) return false;
  const [payload, receivedSignature] = String(token).split(".");
  if (!payload || !receivedSignature || !safeEqual(signature(payload), receivedSignature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.email === adminEmail() && Number(data.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isAdminRequest(request) {
  const rawCookie = request.headers.get("cookie") || "";
  const token = rawCookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
  return verifyAdminToken(token ? decodeURIComponent(token) : "");
}

export async function requireAdminPage() {
  const cookieStore = await cookies();
  if (!verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin-login");
}

export function adminCookieHeader(token, maxAge = SESSION_SECONDS) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
