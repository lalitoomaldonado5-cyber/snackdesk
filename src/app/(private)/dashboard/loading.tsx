import { Skeleton } from "@/components/design/primitives";
export default function DashboardLoading() {
  return (
    <div
      className="sd-v2"
      role="status"
      aria-label="Cargando resumen del negocio"
    >
      <Skeleton className="title" />
      <div className="sd-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div className="sd-kpi" key={i}>
            <Skeleton className="block" />
          </div>
        ))}
      </div>
      <div className="sd-dashboard-columns">
        <Skeleton className="large" />
        <Skeleton className="large" />
      </div>
      <span className="sr-only">Cargando resumen del negocio…</span>
    </div>
  );
}
