import {cookies} from 'next/headers';
import {verifyAdminToken,ADMIN_COOKIE} from '../../lib/admin-auth';
import {CUSTOMER_SESSION_COOKIE} from '../../lib/session-mode';
import {requireClientPage} from '../../lib/client-auth';
import Workspace from './ui';
import '../customer.css';
export const dynamic='force-dynamic';
export default async function WorkspacePage({searchParams}){const cookieStore=await cookies();const admin=!cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value&&verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);if(!admin)await requireClientPage();const params=await searchParams;return <Workspace slug={typeof params?.client==='string'?params.client:''} admin={admin}/>;}
