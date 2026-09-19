import { PageHeader } from "@/components/ui";
import { EventForm } from "@/components/forms/event-form";
import { getWorkspace } from "@/services/workspace";

export default async function Page() {
  const data = await getWorkspace();

  return (
    <>
      <PageHeader
        title="Nuevo evento"
        description="Ponle fecha a la próxima celebración."
        back="/events"
      />
      <section className="panel padded form-panel">
        <EventForm clients={data.clients} />
      </section>
    </>
  );
}
