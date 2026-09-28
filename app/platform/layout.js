import { requireAdminPage } from "../lib/admin-auth";

export default async function PlatformLayout({ children }) {
  await requireAdminPage();
  return children;
}
