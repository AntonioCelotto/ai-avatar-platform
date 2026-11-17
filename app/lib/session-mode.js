export const ADMIN_SESSION_COOKIE='avatarone_admin';
export const CUSTOMER_SESSION_COOKIE='avatarone_client_session';
export function cookieValue(raw,name){const value=String(raw||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${name}=`))?.slice(name.length+1)||'';try{return decodeURIComponent(value);}catch{return '';}}
// When both old cookies exist, the narrower customer role always wins.
export function customerMode(raw){return Boolean(cookieValue(raw,CUSTOMER_SESSION_COOKIE));}
export function clearCookie(name){return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;}
export function withClearedCookie(response,name){response.headers.append('Set-Cookie',clearCookie(name));return response;}
