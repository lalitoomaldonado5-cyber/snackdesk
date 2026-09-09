import { PageHeader } from "@/components/ui";
import { EventList } from "@/components/lists/event-list";
import { getWorkspace } from "@/services/workspace";
import { today } from "@/lib/format";
export default async function Page() {
  const data = await getWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="TU ESPACIO DE TRABAJO"
        title="Eventos"
        description="De la primera cotización al último detalle."
        action={{ href: "/events/new", label: "Nuevo evento" }}
      />
      <EventList data={data} date={today()} />
    </>
  );
}
