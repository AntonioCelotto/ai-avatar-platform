import { getAvatarClientBySlug } from "../../lib/supabase-server";
import { demoCupQuery, DEMO_SLUG } from "../../lib/cup-demo";
import { enforceRateLimit } from "../../lib/rate-limit";
export async function GET(request) {
 const limited=enforceRateLimit(request,"cup-demo",{limit:30,windowMs:60000}); if(limited)return limited;
 const url=new URL(request.url);
 const slug=url.searchParams.get("slug");
 if(slug!==DEMO_SLUG)return Response.json({error:"Demo non disponibile"},{status:404});
 const avatar=await getAvatarClientBySlug(slug).catch(()=>null);
 if(!avatar || avatar.status!=="active" || avatar.commercial_status==="suspended")return Response.json({error:"Avatar non disponibile"},{status:404});
 const action=url.searchParams.get("action")||"services";
 if(!["services","availability","directions","ticket"].includes(action))return Response.json({error:"Azione non valida"},{status:400});
 return Response.json(demoCupQuery({action,service:url.searchParams.get("service")||""}),{headers:{"Cache-Control":"no-store"}});
}
