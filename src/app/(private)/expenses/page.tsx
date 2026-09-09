import { PageHeader } from "@/components/ui";
import { MovementList } from "@/components/lists/movement-list";
import { getWorkspace } from "@/services/workspace";

export default async function Page() {
  const data = await getWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="TU ESPACIO DE TRABAJO"
        title="Gastos"
        description="Lleva el control de lo que inviertes en cada celebración."
        action={{ href: "/expenses/new", label: "Registrar gasto" }}
      />
      <MovementList data={data} kind="expenses" />
    </>
  );
}
