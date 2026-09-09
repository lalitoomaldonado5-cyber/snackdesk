"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { EventTable } from "../event-table";
import { EmptyState } from "../ui";
import { Pagination } from "../pagination";
import { usePagination } from "@/hooks/use-pagination";
import { statuses, type Workspace } from "@/types/domain";
export function EventList({
  data,
  date,
  preview = false,
}: {
  data: Workspace;
  date: string;
  preview?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("all");
  const filtered = data.events
    .filter(
      (e) =>
        `${e.title} ${data.clients.find((c) => c.id === e.client_id)?.name}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!status || e.status === status) &&
        (period === "all" ||
          (period === "upcoming" ? e.event_date >= date : e.event_date < date)),
    )
    .sort((a, b) =>
      period === "past"
        ? b.event_date.localeCompare(a.event_date)
        : a.event_date.localeCompare(b.event_date),
    );
  const pagination = usePagination(filtered);
  return (
    <section className="panel">
      <div className="toolbar">
        <label className="search-field">
          <span className="sr-only">Buscar evento</span>
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              pagination.setPage(1);
            }}
            placeholder="Buscar evento o cliente…"
          />
        </label>
        <div className="filters">
          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              pagination.setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            {Object.entries(statuses).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por fecha"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              pagination.setPage(1);
            }}
          >
            <option value="all">Todas las fechas</option>
            <option value="upcoming">Próximos eventos</option>
            <option value="past">Eventos pasados</option>
          </select>
        </div>
      </div>
      {filtered.length ? (
        <EventTable
          data={data}
          events={pagination.rows}
          actions={!preview}
          preview={preview}
        />
      ) : (
        <EmptyState
          title="No hay eventos en esta vista"
          text="Crea tu primer evento o ajusta los filtros de búsqueda."
          href={preview ? undefined : "/events/new"}
          label="Crear evento"
        />
      )}
      <Pagination {...pagination} />
    </section>
  );
}
