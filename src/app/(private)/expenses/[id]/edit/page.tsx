import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "@/components/forms/expense-form";
import { getWorkspace } from "@/services/workspace";
import { today } from "@/lib/format";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWorkspace();
  const record = data.expenses.find((r) => r.id === id);
  if (!record) notFound();
  return (
    <>
      <PageHeader
        title="Editar gasto"
        description="Actualiza la información y guarda los cambios."
        back="/expenses"
      />
      <section className="panel padded form-panel">
        <ExpenseForm
          expense={record}
          events={data.events}
          defaultDate={today()}
        />
      </section>
    </>
  );
}
