import crypto from 'node:crypto';
import {lookup} from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import {customerDb} from './customer-store.js';

export const sourceTypes=['pdf','word','excel','website','faq','text','api'];
export function validateDraft(value){
 if(!Array.isArray(value)||value.length>50)throw new Error('Puoi gestire fino a 50 fonti.');
 const ids=new Set();
 const draft=value.map(s=>{if(typeof s?.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(s.id)||ids.has(s.id))throw new Error('Fonte non valida.');ids.add(s.id);
 const title=String(s.title||'').trim(),content=String(s.content||'').trim();
 if(!title||title.length>180||!content||content.length>45000||!sourceTypes.includes(s.type))throw new Error('Ogni fonte richiede titolo e testo leggibile (massimo 45.000 caratteri).');
 const url=String(s.url||'').slice(0,2000);if(url&&!/^https?:\/\//i.test(url))throw new Error('URL non valido.');
 const menu=s.metadata?.menu?validateMenu(s.metadata.menu):null;return {id:s.id,type:s.type,title,url,content:menu?menuText(menu):content,metadata:menu?{menu}:{}};});
 if(JSON.stringify(draft).length>550000)throw new Error('La bozza supera il limite di contenuti. Riduci i documenti.');return draft;
}
export function validateMenu(value){
 if(!Array.isArray(value)||value.length>200)throw new Error('Menu troppo lungo.');
 return value.map(r=>{const name=String(r.name||'').trim().slice(0,140),category=String(r.category||'').trim().slice(0,80),description=String(r.description||'').trim().slice(0,500),allergens=String(r.allergens||'').trim().slice(0,250),price=String(r.price??'').trim().replace(',','.');
 if(!name||(price&&!/^\d{1,5}(\.\d{1,2})?$/.test(price)))throw new Error('Controlla nome e prezzo dei piatti.');
 return {name,category,description,allergens,price,available:r.available!==false};});
}
export function menuText(rows){return validateMenu(rows).map(r=>`${r.category?`${r.category} — `:''}${r.name}${r.price?` — €${r.price}`:''}. ${r.description} Allergeni dichiarati: ${r.allergens||'non specificati, chiedere al personale'}. Disponibilità: ${r.available?'disponibile':'NON DISPONIBILE'}.`).join('\n');}
export async function readWorkspace(client){
 const [rows,sources,releases,fingerprint]=await Promise.all([
 customerDb(`avatar_knowledge_workspaces?client_id=eq.${client.id}&select=*`),
 customerDb(`avatar_client_knowledge_sources?client_id=eq.${client.id}&status=eq.active&select=id,source_type,title,source_url,content,metadata&order=created_at.asc`),
 customerDb(`avatar_knowledge_releases?client_id=eq.${client.id}&select=id,created_at,label&order=created_at.desc&limit=20`),
 customerDb('rpc/a1_knowledge_fingerprint',{method:'POST',body:JSON.stringify({p_client:client.id})})]);
 const published=sources.map(s=>({id:s.metadata?.workspaceItemId||s.id,type:s.source_type,title:s.title,url:s.source_url||'',content:s.content,metadata:s.metadata||{}}));
 if(!published.length&&client.notes)published.push({id:'initial-notes',type:'text',title:'Conoscenza iniziale',url:'',content:client.notes,metadata:{}});
 const workspace=rows[0];return {draft:workspace?workspace.draft:published,published,revision:workspace?.revision||0,fingerprint:workspace?.base_fingerprint||fingerprint,conflict:Boolean(workspace&&workspace.base_fingerprint!==fingerprint),releases};
}
export function publicAddress(address){
 if(net.isIPv4(address)){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19))||(a===192&&b===0));}
 // Accept only globally routable unicast IPv6; reject mapped/loopback/local addresses.
 return net.isIPv6(address)&&/^[23][0-9a-f]{3}:/i.test(address)&&!address.toLowerCase().startsWith('2001:db8:');
}
export async function fetchPublicPage(value,depth=0){
 const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port)))throw new Error('Indirizzo del sito non ammesso.');
 const hostname=url.hostname.replace(/^\[|\]$/g,'');
 const addresses=net.isIP(hostname)?[{address:hostname,family:net.isIP(hostname)}]:await lookup(hostname,{all:true});
 if(!addresses.length||addresses.some(r=>!publicAddress(r.address)))throw new Error('Indirizzo del sito non ammesso.');
 const pinned=addresses[0];
 const response=await new Promise((resolve,reject)=>{
 const req=(url.protocol==='https:'?https:http).get(url,{headers:{'User-Agent':'AvatarOne-Knowledge/1.0'},lookup:(_host,options,callback)=>options?.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family)},res=>{
 const status=res.statusCode||0;
 if(status>=300&&status<400){res.resume();return resolve({redirect:res.headers.location});}
 if(status!==200||!/text\/(html|plain)/i.test(res.headers['content-type']||'')){res.resume();return reject(new Error('Pagina non leggibile.'));}
 const chunks=[];let size=0;res.on('data',chunk=>{size+=chunk.length;if(size>2000000){res.destroy();reject(new Error('Pagina troppo grande.'));}else chunks.push(chunk);});res.on('end',()=>resolve({html:Buffer.concat(chunks).toString('utf8'),url:url.toString()}));res.on('error',reject);
 });const timer=setTimeout(()=>req.destroy(new Error('Il sito non risponde.')),6000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);
 });
 if(response.redirect){if(depth>=2)throw new Error('Troppi reindirizzamenti.');return fetchPublicPage(new URL(response.redirect,url).toString(),depth+1);}return response;
}
export function htmlText(html){return html.replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();}
export async function importPublicWebsite(value){
 const start=/^https?:\/\//i.test(value)?value:`https://${value}`;
 const first=await fetchPublicPage(start),origin=new URL(first.url).origin;
 const links=[...first.html.matchAll(/href=["']([^"'#]+)["']/gi)].map(m=>{try{const u=new URL(m[1],first.url);u.hash='';return u.origin===origin&&!/\.(pdf|png|jpg|mp4|zip)$/i.test(u.pathname)?u.href:null;}catch{return null;}}).filter(Boolean);
 const pages=await Promise.allSettled([...new Set(links)].filter(u=>u!==first.url).slice(0,3).map(u=>fetchPublicPage(u)));
 const texts=[first,...pages.filter(r=>r.status==='fulfilled').map(r=>r.value)].map(p=>`PAGINA: ${p.url}\n${htmlText(p.html)}`).join('\n\n').slice(0,45000);
 if(texts.length<120)throw new Error('Il sito non contiene abbastanza testo leggibile.');
 return {id:crypto.randomUUID(),type:'website',title:new URL(first.url).hostname,url:first.url,content:texts,metadata:{}};
}
