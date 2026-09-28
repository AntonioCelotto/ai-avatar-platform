import { requireAdminPage } from "../../lib/admin-auth";

export default async function DashboardLayout({ children }) {
  await requireAdminPage();
  return children;
}
