"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Pencil } from "lucide-react";
import { DeleteButton } from "../delete-button";
import { EmptyState } from "../ui";
import { Pagination } from "../pagination";
import { usePagination } from "@/hooks/use-pagination";
import { initials } from "@/lib/format";
import type { Client } from "@/types/domain";
export function ClientList({
  clients,
  preview = false,
}: {
  clients: Client[];
  preview?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = clients
    .filter((c) =>
      `${c.name} ${c.phone} ${c.email || ""}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const pagination = usePagination(filtered);
  return (
    <section className="panel">
      <div className="toolbar">
        <label className="search-field">
          <span className="sr-only">Buscar cliente</span>
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              pagination.setPage(1);
            }}
            placeholder="Buscar por nombre, teléfono o correo…"
          />
        </label>
        <span className="muted list-count">
          {clients.length} clientes en tu negocio
        </span>
      </div>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Correo electrónico</th>
                <th>Notas</th>
                {!preview && <th className="text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="date-cell">
                      <span className="client-initials">
                        {initials(client.name)}
                      </span>
                      <strong>{client.name}</strong>
                    </div>
                  </td>
                  <td>{client.phone}</td>
                  <td>{client.email || "—"}</td>
                  <td>
                    <span className="truncate-note" title={client.notes || ""}>
                      {client.notes || "—"}
                    </span>
                  </td>
                  {!preview && (
                    <td>
                      <div className="row-actions">
                        <Link
                          href={`/clients/${client.id}/edit`}
                          className="icon-button"
                          aria-label={`Editar ${client.name}`}
                        >
                          <Pencil size={14} />
                        </Link>
                        <DeleteButton
                          table="clients"
                          id={client.id}
                          name={client.name}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={query ? "Sin coincidencias" : "Conoce a tu próximo cliente"}
          text={
            query
              ? "Prueba con otro nombre, teléfono o correo."
              : "Agrega sus datos y ten a la mano todo lo que necesitas para atenderlo."
          }
          href={!query && !preview ? "/clients/new" : undefined}
          label="Crear cliente"
        />
      )}
      <Pagination {...pagination} />
    </section>
  );
}
