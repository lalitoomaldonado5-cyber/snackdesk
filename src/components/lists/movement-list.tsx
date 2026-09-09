"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Pencil } from "lucide-react";
import { DeleteButton } from "../delete-button";
import { EmptyState } from "../ui";
import { Pagination } from "../pagination";
import { usePagination } from "@/hooks/use-pagination";
import { dateLabel, money } from "@/lib/format";
import { paymentTypes, type Workspace } from "@/types/domain";
export function MovementList({
  data,
  kind,
  preview = false,
}: {
  data: Workspace;
  kind: "payments" | "expenses";
  preview?: boolean;
}) {
  const [query, setQuery] = useState("");
  const isPayment = kind === "payments";
  const rows = isPayment
    ? data.payments.map((p) => ({
        id: p.id,
        date: p.payment_date,
        description: paymentTypes[p.payment_type],
        eventId: p.event_id,
        amount: p.amount,
        notes: p.notes,
        category: null,
      }))
    : data.expenses.map((e) => ({
        id: e.id,
        date: e.expense_date,
        description: e.description,
        eventId: e.event_id,
        amount: e.amount,
        notes: e.notes,
        category: e.category,
      }));
  const filtered = rows
    .filter((r) =>
      `${r.description} ${data.events.find((e) => e.id === r.eventId)?.title || ""} ${r.category || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const pagination = usePagination(filtered);
  return (
    <section className="panel">
      <div className="toolbar">
        <label className="search-field">
          <span className="sr-only">
            Buscar {isPayment ? "pagos" : "gastos"}
          </span>
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              pagination.setPage(1);
            }}
            placeholder={
              isPayment
                ? "Buscar por evento o tipo de pago…"
                : "Buscar descripción, evento o categoría…"
            }
          />
        </label>
        <span className="muted list-count">
          {rows.length} movimientos registrados
        </span>
      </div>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>{isPayment ? "Tipo de pago" : "Descripción"}</th>
                <th>Evento</th>
                <th className="text-right">Monto</th>
                <th>Notas</th>
                {!preview && <th className="text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row) => (
                <tr key={row.id}>
                  <td>{dateLabel(row.date)}</td>
                  <td>
                    <strong>{row.description}</strong>
                    {row.category && (
                      <span className="secondary-line">{row.category}</span>
                    )}
                  </td>
                  <td>
                    {row.eventId ? (
                      preview ? (
                        data.events.find((e) => e.id === row.eventId)?.title
                      ) : (
                        <Link href={`/events/${row.eventId}`}>
                          {data.events.find((e) => e.id === row.eventId)?.title}
                        </Link>
                      )
                    ) : (
                      "Gasto general"
                    )}
                  </td>
                  <td className="text-right numbers">
                    <strong>{money(row.amount)}</strong>
                  </td>
                  <td>
                    <span className="truncate-note" title={row.notes || ""}>
                      {row.notes || "—"}
                    </span>
                  </td>
                  {!preview && (
                    <td>
                      <div className="row-actions">
                        <Link
                          className="icon-button"
                          aria-label={`Editar ${row.description}`}
                          href={`/${kind}/${row.id}/edit`}
                        >
                          <Pencil size={14} />
                        </Link>
                        <DeleteButton
                          table={kind}
                          id={row.id}
                          name={`${row.description} · ${money(row.amount)}`}
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
          title={
            query
              ? "Sin coincidencias"
              : isPayment
                ? "Cada pago, bien registrado"
                : "Tus gastos también cuentan"
          }
          text={
            query
              ? "Intenta con otra búsqueda."
              : isPayment
                ? "Registra anticipos y liquidaciones para conocer el saldo real de cada evento."
                : "Registra tus compras y gastos para estimar mejor tus ganancias."
          }
          href={preview ? undefined : `/${kind}/new`}
          label={isPayment ? "Registrar pago" : "Registrar gasto"}
        />
      )}
      <Pagination {...pagination} />
    </section>
  );
}
