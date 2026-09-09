import { PageHeader } from "@/components/ui";
import { MovementList } from "@/components/lists/movement-list";
import { getWorkspace } from "@/services/workspace";

export default async function Page() {
  const data = await getWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="TU ESPACIO DE TRABAJO"
        title="Pagos"
        description="Anticipos, abonos y liquidaciones, en un solo lugar."
        action={{ href: "/payments/new", label: "Registrar pago" }}
      />
      <MovementList data={data} kind="payments" />
    </>
  );
}
