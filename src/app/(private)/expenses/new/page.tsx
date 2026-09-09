import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "@/components/forms/expense-form";
import { getWorkspace } from "@/services/workspace";
import { today } from "@/lib/format";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const data = await getWorkspace();
  const requested = (await searchParams).event;
  const eventId = data.events.some((e) => e.id === requested)
    ? requested
    : undefined;
  return (
    <>
      <PageHeader
        title="Registrar gasto"
        description="Asócialo a un evento o regístralo como gasto general del negocio."
        back="/expenses"
      />
      <section className="panel padded form-panel">
        <ExpenseForm
          events={data.events}
          defaultDate={today()}
          defaultEventId={eventId}
        />
      </section>
    </>
  );
}
