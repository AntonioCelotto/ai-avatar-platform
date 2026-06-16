import { DocumentsDashboard } from "../../../dashboard/documents/ui";
import { getTenantPublicConfig } from "../../../tenant-config";

export const metadata = {
  title: "Fonti Demo Cliente 01",
  description: "Dashboard fonti per la demo cliente 01."
};

export default function DemoDocumentsPage() {
  const tenant = getTenantPublicConfig("demo-cliente-01");

  return <DocumentsDashboard tenant={tenant} />;
}
