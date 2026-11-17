import Link from 'next/link';
import {requireClientPage} from '../lib/client-auth';
import {getAvatarClientById,listUsageSummary} from '../lib/supabase-server';
import {publicAvatarPath} from '../lib/customer-store';
import ClientLogout from './logout-button';
import './customer.css';
export const dynamic='force-dynamic';
export default async function ClientArea(){
 const session=await requireClientPage();
 const clients=await Promise.all(session.access.map(async access=>{const avatar=await getAvatarClientById(access.client_id);if(!avatar)return null;const usage=await listUsageSummary(avatar.id).catch(()=>({}));return {avatar,usage,access};}));
 return <main className="a1-customer"><header className="a1-customer-top"><Link href="/" className="a1-customer-logo">AvatarOne</Link><ClientLogout/></header><p className="a1-customer-kicker">IL TUO SPAZIO AI</p><h1>Ciao, {session.access[0]?.display_name||'benvenuto'}.</h1><p>Qui trovi gli avatar assegnati alla tua attività. Aggiorna la conoscenza in bozza, prova le risposte e pubblica quando è pronta.</p><section className="a1-customer-avatars">{clients.filter(Boolean).map(({avatar:a,usage,access})=><article className="a1-customer-panel" key={a.id}>{a.avatar_poster_url?<img className="a1-customer-avatar" src={a.avatar_poster_url} alt=""/>:null}<small>{a.company_name}</small><h2>{a.spoken_avatar_name||a.avatar_name}</h2><p>{({smart:'Smart',connect:'Connect',experience:'Experience'})[a.plan_code]||'AvatarOne'} · {access.role==='viewer'?'Sola consultazione':'Gestione contenuti'}</p><p className="a1-customer-muted">{usage.chat||0} interazioni questo mese</p><Link className="a1-customer-primary" href={`/client-area/workspace?client=${encodeURIComponent(a.slug)}`}>Gestisci conoscenza →</Link><Link href={publicAvatarPath(a.slug)} target="_blank" rel="noreferrer">Apri avatar pubblico ↗</Link></article>)}</section><p className="a1-customer-muted">Per voce, aspetto, pacchetto e integrazioni, contatta il tuo referente NDA.</p></main>;
}
