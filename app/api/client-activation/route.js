import {authAdmin,customerAccess,sameOrigin} from '../../lib/customer-store';
import {clientCookieHeader} from '../../lib/client-auth';
import {enforceRateLimit} from '../../lib/rate-limit';
const headers={'Cache-Control':'no-store'};
export async function POST(request){
 if(!sameOrigin(request))return Response.json({error:'Origine non valida.'},{status:403,headers});
 const limited=enforceRateLimit(request,'client-activation',{limit:10,windowMs:900000});if(limited)return limited;
 try{
 const p=await request.json();if(typeof p.password!=='string'||p.password.length<12||p.password.length>128)return Response.json({error:'Scegli una password tra 12 e 128 caratteri.'},{status:400,headers});
 if(!['invite','magiclink','recovery'].includes(p.type)||typeof p.token_hash!=='string'||p.token_hash.length>128||!/^[a-zA-Z0-9_-]+$/.test(p.token_hash))throw new Error();
 const admin=authAdmin();const {data,error}=await admin.auth.verifyOtp({token_hash:p.token_hash,type:p.type});
 if(error||!data.user?.id||!data.session?.access_token)throw new Error();
 const access=await customerAccess(data.user.id);if(!access.length)throw new Error();
 const updated=await admin.auth.updateUser({password:p.password});if(updated.error)throw new Error();
 return Response.json({ok:true},{headers:{...headers,'Set-Cookie':clientCookieHeader(data.session.access_token,Math.min(data.session.expires_in||3600,3600))}});
 }catch{return Response.json({error:'Link scaduto, già utilizzato o accesso non attivo. Richiedi un nuovo invito a NDA.'},{status:400,headers});}
}
