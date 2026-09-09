import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ClientForm } from "@/components/forms/client-form";
import { getWorkspace } from "@/services/workspace";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWorkspace();
  const record = data.clients.find((r) => r.id === id);
  if (!record) notFound();
  return (
    <>
      <PageHeader
        title="Editar cliente"
        description="Actualiza la información y guarda los cambios."
        back="/clients"
      />
      <section className="panel padded form-panel">
        <ClientForm client={record} />
      </section>
    </>
  );
}
