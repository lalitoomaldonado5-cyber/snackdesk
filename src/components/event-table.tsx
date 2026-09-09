import Link from "next/link";
import { Pencil } from "lucide-react";
import { StatusBadge } from "./ui";
import { DeleteButton } from "./delete-button";
import { dateLabel, money } from "@/lib/format";
import { eventFinance } from "@/lib/finance";
import type { Event, Workspace } from "@/types/domain";
export function EventTable({
  events,
  data,
  actions = false,
  preview = false,
}: {
  events: Event[];
  data: Workspace;
  actions?: boolean;
  preview?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente / Evento</th>
            <th>Personas</th>
            <th className="text-right">Total</th>
            <th className="text-right">Saldo</th>
            <th>Estado</th>
            {actions && <th className="text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const client = data.clients.find((c) => c.id === event.client_id);
            const finance = eventFinance(event, data.payments, data.expenses);
            return (
              <tr key={event.id}>
                <td>
                  <div className="date-cell">
                    <span className="date-tile">
                      <strong>{event.event_date.slice(8)}</strong>
                      <small>
                        {dateLabel(event.event_date, { month: "short" })}
                      </small>
                    </span>
                    <div>
                      {dateLabel(event.event_date, { weekday: "short" })}
                      <span className="secondary-line">
                        {event.event_time?.slice(0, 5) ||
                          event.event_date.slice(0, 4)}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  {preview ? (
                    <strong>{client?.name}</strong>
                  ) : (
                    <Link href={`/events/${event.id}`}>
                      <strong>{client?.name}</strong>
                    </Link>
                  )}
                  <span className="secondary-line">{event.title}</span>
                </td>
                <td>{event.guest_count ?? "—"}</td>
                <td className="text-right numbers">
                  <strong>{money(event.total_amount)}</strong>
                </td>
                <td className="text-right numbers">{money(finance.balance)}</td>
                <td>
                  <StatusBadge status={event.status} />
                </td>
                {actions && (
                  <td>
                    <div className="row-actions">
                      <Link
                        aria-label={`Editar ${event.title}`}
                        className="icon-button"
                        href={`/events/${event.id}/edit`}
                      >
                        <Pencil size={14} />
                      </Link>
                      <DeleteButton
                        table="events"
                        id={event.id}
                        name={event.title}
                      />
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
