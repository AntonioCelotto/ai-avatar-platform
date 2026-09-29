import { requireClientPage } from "../lib/client-auth";
export default async function ClientAreaLayout({children}){await requireClientPage();return children}
