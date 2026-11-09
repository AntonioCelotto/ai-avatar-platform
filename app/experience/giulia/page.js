import CustomAvatar from "../../avatar/[slug]/custom-avatar";
import { getAvatarClientBySlug, getAvatarKnowledgeText } from "../../lib/supabase-server";

export const metadata={title:"Giulia Experience · CUP Ospedaliero · AvatarOne",description:"Demo ospedaliera interattiva di Giulia con AI, voce e prenotazioni CUP dimostrative"};
export const dynamic="force-dynamic";
export default async function GiuliaExperiencePage(){
 let avatar=null;
 try{avatar=await getAvatarClientBySlug("giulia-new-digital-app");if(avatar?.id)avatar.website_knowledge=await getAvatarKnowledgeText(avatar.id);}catch{}
 return <CustomAvatar slug="giulia-new-digital-app" initialAvatar={avatar} initialImmersive={true} experienceMode={true}/>;
}
