import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PackageForm } from "@/components/forms/package-form";
import { requireSession } from "@/lib/session";
export default async function NewPackagePage() {
  if ((await requireSession()).profile.role !== "owner") redirect("/settings");
  return (
    <>
      <PageHeader
        title="Nuevo paquete"
        description="Define qué incluye tu servicio y su precio base."
        back="/settings"
      />
      <section className="panel padded form-panel">
        <PackageForm />
      </section>
    </>
  );
}
