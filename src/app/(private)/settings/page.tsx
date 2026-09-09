import { PageHeader, Notice } from "@/components/ui";
import { BusinessForm } from "@/components/forms/business-form";
import { PackageList } from "@/components/package-list";
import { getWorkspace } from "@/services/workspace";
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const data = await getWorkspace();
  const owner = data.profile.role === "owner";
  return (
    <>
      <PageHeader
        eyebrow="A TU MANERA"
        title="Configuración"
        description="Los datos y servicios que hacen único a tu negocio."
      />
      {(await searchParams).saved && (
        <Notice tone="success">
          Los cambios de tu negocio se guardaron correctamente.
        </Notice>
      )}
      <div className="settings-grid">
        <section className="panel padded">
          <div className="section-title">
            <h2>Información del negocio</h2>
            <p>Se muestra en tu espacio de trabajo.</p>
          </div>
          {owner ? (
            <BusinessForm business={data.business} logoSrc={data.logoSrc} />
          ) : (
            <>
              <h3>{data.business.name}</h3>
              <p>{data.business.phone || "Sin teléfono"}</p>
              <Notice>
                El propietario administra la configuración del negocio.
              </Notice>
            </>
          )}
        </section>
        <PackageList packages={data.packages} canEdit={owner} />
      </div>
    </>
  );
}
