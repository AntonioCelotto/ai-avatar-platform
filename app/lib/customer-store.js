import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export function authAdmin() { if(!url || !key) throw new Error('Servizio non configurato.'); return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}); }
export async function customerDb(path, options={}) {
 if(!url||!key) throw new Error('Servizio non configurato.');
 const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/${path}`,{...options,cache:'no-store',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers}});
 const text=response.status===204?"":await response.text();
 const data=text?JSON.parse(text):null;
 if(!response.ok) {const error=new Error(data?.message||'Operazione non riuscita.');error.code=data?.code;throw error;}
 return data;
}
export async function customerAccess(userId) {
 const rows=await customerDb(`avatar_customer_access?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=user_id,client_id,role,display_name,email`);
 const legacy=await customerDb(`customer_profiles?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=avatar_client_id,role,display_name`);
 return [...rows,...legacy.filter(p=>!rows.some(r=>r.client_id===p.avatar_client_id)).map(p=>({...p,client_id:p.avatar_client_id,user_id:userId}))];
}
export function sameOrigin(request) {const origin=request.headers.get('origin');return Boolean(origin && origin===new URL(request.url).origin);}
export function canEdit(role){return role==='owner'||role==='editor';}
export function customerModules(client){return {restaurantMenu:client?.features?.customerModules?.restaurantMenu===true};}
export function safeClient(client){return {id:client.id,slug:client.slug,company_name:client.company_name,avatar_name:client.avatar_name,spoken_avatar_name:client.spoken_avatar_name,plan_code:client.plan_code,avatar_poster_url:client.avatar_poster_url,modules:customerModules(client)};}
export function publicAvatarPath(slug){return slug==='new-digital-app'?'/mia':slug==='demo-cliente-01'?'/demo-cliente-01':`/avatar/${encodeURIComponent(slug)}`;}
