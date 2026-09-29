import { CLIENT_COOKIE, clientCookieHeader, signInClient } from "../../lib/client-auth";
import { enforceRateLimit } from "../../lib/rate-limit";

export async function POST(request){
  const limited=enforceRateLimit(request,"client-login",{limit:5,windowMs:15*60_000}); if(limited)return limited;
  let payload; try{payload=await request.json()}catch{return Response.json({error:"Richiesta non valida."},{status:400})}
  try{const session=await signInClient(String(payload.email||"").trim().toLowerCase(),String(payload.password||""));return Response.json({ok:true},{headers:{"Set-Cookie":clientCookieHeader(session.token,session.maxAge),"Cache-Control":"no-store"}})}catch(error){return Response.json({error:error.message||"Accesso non riuscito."},{status:401})}
}
export async function DELETE(){return Response.json({ok:true},{headers:{"Set-Cookie":`${CLIENT_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}})}
