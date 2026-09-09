import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { getWorkspace } from "@/services/workspace";
import { eventFinance } from "@/lib/finance";
import { dateLabel, money } from "@/lib/format";
import { paymentTypes } from "@/types/domain";
export default async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWorkspace();
  const event = data.events.find((e) => e.id === id);
  if (!event) notFound();
  const client = data.clients.find((c) => c.id === event.client_id)!;
  const finance = eventFinance(event, data.payments, data.expenses);
  const payments = data.payments
    .filter((p) => p.event_id === id)
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const expenses = data.expenses
    .filter((e) => e.event_id === id)
    .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  return (
    <>
      <PageHeader
        title={event.title}
        description={`${event.event_type} · ${dateLabel(event.event_date)}`}
        back="/events"
      />
      <div className="event-detail-actions">
        <StatusBadge status={event.status} />
        <div className="row-actions">
          <Link className="button small" href={`/events/${id}/edit`}>
            <Pencil size={13} />
            Editar evento / estado
          </Link>
          <DeleteButton table="events" id={id} name={event.title} />
        </div>
      </div>
      <div className="detail-grid">
        <div className="stack">
          <section className="panel padded">
            <div className="section-title">
              <h2>Información del evento</h2>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Cliente</dt>
                <dd>
                  <Link className="link" href={`/clients/${client.id}/edit`}>
                    {client.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{client.phone}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{client.email || "—"}</dd>
              </div>
              <div>
                <dt>Fecha y hora</dt>
                <dd>
                  {dateLabel(event.event_date)}
                  {event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}
                </dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>{event.location || "Por definir"}</dd>
              </div>
              <div>
                <dt>Personas</dt>
                <dd>{event.guest_count || "Por definir"}</dd>
              </div>
              <div className="span-2">
                <dt>Notas del evento</dt>
                <dd>{event.notes || "Sin notas adicionales."}</dd>
              </div>
            </dl>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Pagos registrados</h2>
              {event.status !== "cancelled" && finance.balance > 0 && (
                <Link href={`/payments/new?event=${id}`}>
                  <Plus size={13} />
                  Registrar pago
                </Link>
              )}
            </div>
            {payments.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th className="text-right">Monto</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{dateLabel(p.payment_date)}</td>
                        <td>
                          {paymentTypes[p.payment_type]}
                          <span
                            className="secondary-line truncate-note"
                            title={p.notes || ""}
                          >
                            {p.notes}
                          </span>
                        </td>
                        <td className="text-right numbers">
                          {money(p.amount)}
                        </td>
                        <td>
                          <Link
                            aria-label="Editar pago"
                            className="icon-button"
                            href={`/payments/${p.id}/edit`}
                          >
                            <Pencil size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="compact-empty">
                Aún no hay pagos registrados para este evento.
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Gastos relacionados</h2>
              <Link href={`/expenses/new?event=${id}`}>
                <Plus size={13} />
                Registrar gasto
              </Link>
            </div>
            {expenses.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th className="text-right">Monto</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td>{dateLabel(e.expense_date)}</td>
                        <td>
                          {e.description}
                          <span className="secondary-line">{e.category}</span>
                        </td>
                        <td className="text-right numbers">
                          {money(e.amount)}
                        </td>
                        <td>
                          <Link
                            aria-label={`Editar ${e.description}`}
                            className="icon-button"
                            href={`/expenses/${e.id}/edit`}
                          >
                            <Pencil size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="compact-empty">
                Aún no hay gastos relacionados con este evento.
              </div>
            )}
          </section>
        </div>
        <aside className="stack">
          <section className="panel padded">
            <h2>Resumen del evento</h2>
            <div className="finance-line">
              <span>Total del evento</span>
              <strong>{money(event.total_amount)}</strong>
            </div>
            <div className="finance-line">
              <span>Pagado</span>
              <strong>{money(finance.paid)}</strong>
            </div>
            <div className="finance-line total">
              <span>Saldo pendiente</span>
              <strong>{money(finance.balance)}</strong>
            </div>
            {event.status !== "cancelled" && finance.balance > 0 && (
              <Link
                className="button primary full-width"
                href={`/payments/new?event=${id}`}
              >
                <Plus size={15} />
                Registrar pago
              </Link>
            )}
          </section>
          <section className="panel padded">
            <h2>Utilidad estimada</h2>
            <div className="finance-line">
              <span>Total del evento</span>
              <strong>{money(event.total_amount)}</strong>
            </div>
            <div className="finance-line">
              <span>Gastos del evento</span>
              <strong>{money(finance.spent)}</strong>
            </div>
            <div className="finance-line total">
              <span>Estimado</span>
              <strong>{money(finance.profit)}</strong>
            </div>
            <p className="small-note">
              No incluye los gastos generales del negocio. Un evento cotizado o
              cancelado no suma a las ventas del dashboard.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
