import {getAvatarClientBySlug,getAvatarKnowledgeText} from "../../lib/supabase-server";
import {ETHRASOL_SLUG} from "../../lib/ethrasol-catalog";
import EthrasolExperience from "../../avatar/[slug]/ethrasol-experience";
export const dynamic="force-dynamic";
export const metadata={title:"Esmeralda · ETHRASOL",robots:{index:false,follow:false}};
export default async function Page(){
  const avatar=await getAvatarClientBySlug(ETHRASOL_SLUG);
  if(!avatar||avatar.status!=="active")return <main>Esmeralda non è disponibile.</main>;
  avatar.website_knowledge=await getAvatarKnowledgeText(avatar.id);
  return <EthrasolExperience slug={ETHRASOL_SLUG} initialAvatar={avatar} embedded/>;
}
