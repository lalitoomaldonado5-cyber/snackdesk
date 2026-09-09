import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PaymentForm } from "@/components/forms/payment-form";
import { getWorkspace } from "@/services/workspace";
import { today } from "@/lib/format";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWorkspace();
  const record = data.payments.find((r) => r.id === id);
  if (!record) notFound();
  return (
    <>
      <PageHeader
        title="Editar pago"
        description="Actualiza la información y guarda los cambios."
        back="/payments"
      />
      <section className="panel padded form-panel">
        <PaymentForm
          payment={record}
          events={data.events}
          payments={data.payments}
          defaultDate={today()}
        />
      </section>
    </>
  );
}
