import { PageHeader, EmptyState } from "@/components/ui";
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
        <>
          {data.clients.length ? (
            <EventForm clients={data.clients} />
          ) : (
            <EmptyState
              title="Primero, agrega un cliente"
              text="Cada evento necesita un cliente. Regístralo y vuelve aquí para continuar."
              href="/clients/new"
              label="Crear cliente"
            />
          )}
        </>
      </section>
    </>
  );
}
