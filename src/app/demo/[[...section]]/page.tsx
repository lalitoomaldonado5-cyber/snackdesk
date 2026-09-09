import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { ClientList } from "@/components/lists/client-list";
import { EventList } from "@/components/lists/event-list";
import { MovementList } from "@/components/lists/movement-list";
import { PackageList } from "@/components/package-list";
import { PageHeader, Notice } from "@/components/ui";
import { demoData as data } from "@/lib/demo-data";
// Public, immutable fixtures only. No database calls or authentication bypass.
export default async function DemoPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const section = (await params).section?.join("/") || "dashboard";
  if (
    ![
      "dashboard",
      "clients",
      "events",
      "payments",
      "expenses",
      "settings",
    ].includes(section)
  )
    notFound();
  return (
    <AppShell
      businessName={data.business.name}
      userName={data.profile.full_name}
      role="owner"
      logoSrc={null}
      preview
    >
      {section === "dashboard" && (
        <Dashboard data={data} date="2026-09-02" month="2026-09" preview />
      )}
      {section === "clients" && (
        <>
          <PageHeader
            eyebrow="RELACIONES QUE CRECEN"
            title="Clientes"
            description="Las personas detrás de cada celebración."
          />
          <ClientList clients={data.clients} preview />
        </>
      )}
      {section === "events" && (
        <>
          <PageHeader
            eyebrow="TU AGENDA"
            title="Eventos"
            description="De la primera cotización al último detalle."
          />
          <EventList data={data} date="2026-09-02" preview />
        </>
      )}
      {(section === "payments" || section === "expenses") && (
        <>
          <PageHeader
            eyebrow="TU NEGOCIO EN NÚMEROS"
            title={section === "payments" ? "Pagos" : "Gastos"}
            description="Cada movimiento, en su lugar."
          />
          <MovementList data={data} kind={section} preview />
        </>
      )}
      {section === "settings" && (
        <>
          <PageHeader
            eyebrow="A TU MANERA"
            title="Configuración"
            description="Los datos y servicios que hacen único a tu negocio."
          />
          <div className="settings-grid">
            <section className="panel padded">
              <h2>Información del negocio</h2>
              <dl className="detail-list">
                <div>
                  <dt>Nombre</dt>
                  <dd>{data.business.name}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{data.business.phone}</dd>
                </div>
              </dl>
              <Notice>
                Conecta Supabase para cambiar los datos y subir tu logo.
              </Notice>
            </section>
            <PackageList packages={data.packages} canEdit={false} />
          </div>
        </>
      )}
    </AppShell>
  );
}
