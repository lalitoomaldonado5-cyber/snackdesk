import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PackageForm } from "@/components/forms/package-form";
import { getWorkspace } from "@/services/workspace";
export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const data = await getWorkspace();
  if (data.profile.role !== "owner") redirect("/settings");
  const { id } = await params;
  const servicePackage = data.packages.find((p) => p.id === id);
  if (!servicePackage) notFound();
  return (
    <>
      <PageHeader
        title="Editar paquete"
        description="Actualiza sus detalles o cambia su disponibilidad."
        back="/settings"
      />
      <section className="panel padded form-panel">
        <PackageForm servicePackage={servicePackage} />
      </section>
    </>
  );
}
