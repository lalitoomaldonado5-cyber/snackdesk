import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { money } from "@/lib/format";
import { EmptyState } from "./ui";
import type { ServicePackage } from "@/types/domain";
export function PackageList({
  packages,
  canEdit,
}: {
  packages: ServicePackage[];
  canEdit: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Paquetes y precios</h2>
          <p>Tu catálogo de servicios, listo para consultar.</p>
        </div>
        {canEdit && (
          <Link href="/settings/packages/new" className="button small">
            <Plus size={14} />
            Crear paquete
          </Link>
        )}
      </div>
      {packages.length ? (
        <div className="package-list">
          {packages
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <div key={p.id} className="package-item">
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.description || "Sin descripción"}</p>
                  <span className={`badge ${p.active ? "paid" : "completed"}`}>
                    <span />
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="package-price">
                  <strong>{money(p.base_price)}</strong>
                  <span className="secondary-line">precio base</span>
                  {canEdit && (
                    <Link
                      className="icon-button"
                      href={`/settings/packages/${p.id}/edit`}
                      aria-label={`Editar ${p.name}`}
                    >
                      <Pencil size={14} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <EmptyState
          title="Tu primer paquete"
          text="Define tus servicios y precios base. Podrás editarlos cuando lo necesites."
        />
      )}
    </section>
  );
}
