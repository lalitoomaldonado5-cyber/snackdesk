import { PageHeader } from "@/components/ui";
import { ClientList } from "@/components/lists/client-list";
import { getWorkspace } from "@/services/workspace";

export default async function Page() {
  const data = await getWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="TU ESPACIO DE TRABAJO"
        title="Clientes"
        description="Las personas detrás de cada celebración."
        action={{ href: "/clients/new", label: "Nuevo cliente" }}
      />
      <ClientList clients={data.clients} />
    </>
  );
}
