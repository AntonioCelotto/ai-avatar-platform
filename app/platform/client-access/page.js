import {listAvatarClients} from '../../lib/supabase-server';
import ClientAccessManager from './ui';
import '../../client-area/customer.css';
export const dynamic='force-dynamic';
export default async function AccessPage(){const clients=await listAvatarClients();return <ClientAccessManager clients={clients.filter(c=>!['new-digital-app','demo-cliente-01'].includes(c.slug)).map(c=>({id:c.id,slug:c.slug,name:c.spoken_avatar_name||c.avatar_name,company:c.company_name}))}/>;}
