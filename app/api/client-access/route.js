import {isAdminRequest} from '../../lib/admin-auth';
import {authAdmin,customerDb,sameOrigin} from '../../lib/customer-store';
import {getAvatarClientBySlug} from '../../lib/supabase-server';
import {enforceRateLimit} from '../../lib/rate-limit';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(request){
 if(!isAdminRequest(request))return Response.json({error:'Accesso amministratore richiesto.'},{status:401,headers});
 const rows=await customerDb('avatar_customer_access?select=user_id,client_id,email,display_name,role,active,created_at&order=created_at.desc');
 return Response.json({accounts:rows},{headers});
}
export async function POST(request){
 if(!isAdminRequest(request))return Response.json({error:'Accesso amministratore richiesto.'},{status:401,headers});
 if(!sameOrigin(request))return Response.json({error:'Origine non valida.'},{status:403,headers});
 const limited=enforceRateLimit(request,'customer-invite',{limit:20,windowMs:3600000});if(limited)return limited;
 try{
 const p=await request.json(),email=String(p.email||'').trim().toLowerCase(),name=String(p.name||'').trim().slice(0,100);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>180)throw new Error('Email non valida.');
 const avatar=await getAvatarClientBySlug(String(p.slug||''));if(!avatar?.id)throw new Error('Avatar non trovato.');
 if(['new-digital-app','demo-cliente-01'].includes(avatar.slug))throw new Error('Gli avatar interni NDA restano riservati all’amministratore.');
 const role=['owner','editor','viewer'].includes(p.role)?p.role:'editor';
 const admin=authAdmin();let result=await admin.auth.admin.generateLink({type:'invite',email});
 if(result.error && (result.error.code==='email_exists'||/already.*registered|already.*exist/i.test(result.error.message)))result=await admin.auth.admin.generateLink({type:'magiclink',email});
 if(result.error||!result.data?.user?.id||!result.data?.properties?.hashed_token)throw new Error('Non è stato possibile generare l’invito. Riprova o verifica la configurazione Auth.');
 const userId=result.data.user.id;
 await customerDb('avatar_customer_access?on_conflict=user_id,client_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:userId,client_id:avatar.id,email,display_name:name,role,active:true})});
 const fragment=new URLSearchParams({token_hash:result.data.properties.hashed_token,type:result.data.properties.verification_type});
 return Response.json({ok:true,url:`https://www.avatarone.it/client-activate#${fragment}`,message:'Link personale monouso. Copialo e invialo al cliente; nessuna email viene inviata automaticamente.'},{headers});
 }catch{return Response.json({error:'Invito non creato. Controlla email e avatar; gli avatar interni NDA non sono assegnabili.'},{status:400,headers});}
}
export async function PATCH(request){
 if(!isAdminRequest(request))return Response.json({error:'Accesso amministratore richiesto.'},{status:401,headers});
 if(!sameOrigin(request))return Response.json({error:'Origine non valida.'},{status:403,headers});
 try{const p=await request.json();if(!/^[\da-f-]{36}$/i.test(p.userId)||!/^[\da-f-]{36}$/i.test(p.clientId))throw new Error();
 const role=['owner','editor','viewer'].includes(p.role)?p.role:undefined;
 await customerDb(`avatar_customer_access?user_id=eq.${p.userId}&client_id=eq.${p.clientId}`,{method:'PATCH',body:JSON.stringify({...(role?{role}:{}),...(typeof p.active==='boolean'?{active:p.active}:{})})});
 return Response.json({ok:true},{headers});}catch{return Response.json({error:'Aggiornamento non riuscito.'},{status:400,headers});}
}
