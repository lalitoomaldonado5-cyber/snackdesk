import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { EventForm } from "@/components/forms/event-form";
import { getWorkspace } from "@/services/workspace";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWorkspace();
  const record = data.events.find((r) => r.id === id);
  if (!record) notFound();
  return (
    <>
      <PageHeader
        title="Editar evento"
        description="Actualiza la información y guarda los cambios."
        back="/events"
      />
      <section className="panel padded form-panel">
        <EventForm event={record} clients={data.clients} />
      </section>
    </>
  );
}
