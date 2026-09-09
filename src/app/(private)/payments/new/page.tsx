import { PageHeader, EmptyState } from "@/components/ui";
import { PaymentForm } from "@/components/forms/payment-form";
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
        title="Registrar pago"
        description="El saldo de tu evento se actualizará automáticamente."
        back="/payments"
      />
      <section className="panel padded form-panel">
        <>
          {data.events.some((e) => e.status !== "cancelled") ? (
            <PaymentForm
              events={data.events}
              payments={data.payments}
              defaultDate={today()}
              defaultEventId={eventId}
            />
          ) : (
            <EmptyState
              title="Primero, crea un evento"
              text="Los pagos se registran sobre un evento activo."
              href="/events/new"
              label="Crear evento"
            />
          )}
        </>
      </section>
    </>
  );
}
