import { PageHeader } from "@/components/ui";
import { ClientForm } from "@/components/forms/client-form";

export default async function Page() {
  return (
    <>
      <PageHeader
        title="Nuevo cliente"
        description="Empieza con los datos básicos. Los detalles hacen la diferencia."
        back="/clients"
      />
      <section className="panel padded form-panel">
        <ClientForm />
      </section>
    </>
  );
}
