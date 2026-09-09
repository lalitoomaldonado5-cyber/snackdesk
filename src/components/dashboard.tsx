import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Wallet,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { PageHeader, EmptyState } from "./ui";
import { EventTable } from "./event-table";
import { dashboardMetrics, eventFinance, isConfirmed } from "@/lib/finance";
import { dateLabel, money, initials } from "@/lib/format";
import type { Workspace } from "@/types/domain";
export function Dashboard({
  data,
  date,
  month,
  preview = false,
}: {
  data: Workspace;
  date: string;
  month: string;
  preview?: boolean;
}) {
  const metrics = dashboardMetrics(
    data.events,
    data.payments,
    data.expenses,
    month,
  );
  const upcoming = data.events
    .filter(
      (e) =>
        e.event_date >= date &&
        e.status !== "cancelled" &&
        e.status !== "completed",
    )
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const pending = data.events
    .filter(isConfirmed)
    .filter((e) => eventFinance(e, data.payments, data.expenses).balance > 0)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const kpis = [
    {
      label: "Ventas del mes",
      value: money(metrics.sales),
      note: "Eventos confirmados del mes",
      icon: CircleDollarSign,
    },
    {
      label: "Eventos este mes",
      value: String(metrics.eventCount).padStart(2, "0"),
      note: "Incluye cotizaciones activas",
      icon: CalendarDays,
    },
    {
      label: "Pendiente por cobrar",
      value: money(metrics.outstanding),
      note: "Saldo confirmado · todas las fechas",
      icon: Wallet,
    },
    {
      label: "Ganancia estimada",
      value: money(metrics.profit),
      note: "Ventas menos gastos del mes",
      icon: ChartNoAxesCombined,
    },
  ];
  const maxBar = Math.max(metrics.sales, metrics.spent, 1);
  const base = preview ? "/demo" : "";
  return (
    <>
      <PageHeader
        eyebrow="TU NEGOCIO, DE UN VISTAZO"
        title={`Hola, ${data.profile.full_name.split(" ")[0]}`}
        description="Todo listo para crear momentos que se disfrutan."
        action={
          preview ? undefined : { href: "/events/new", label: "Nuevo evento" }
        }
      />
      <div className="dashboard-period">
        <div>
          <span className="period-dot" />
          Resumen de{" "}
          {dateLabel(`${month}-01`, { month: "long", year: "numeric" })}
        </div>
        {!preview && (
          <form className="period-form">
            <label className="sr-only" htmlFor="month">
              Mes del resumen
            </label>
            <input
              id="month"
              type="month"
              name="month"
              defaultValue={month}
              min="1900-01"
              max="2199-12"
            />
            <button className="button small">Ver mes</button>
          </form>
        )}
        <span className="muted">Importes en MXN</span>
      </div>
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div className="kpi" key={kpi.label}>
            <div className="kpi-top">
              {kpi.label}
              <span className="kpi-icon">
                <kpi.icon size={16} strokeWidth={1.5} />
              </span>
            </div>
            <div className="kpi-value numbers">{kpi.value}</div>
            <div className="kpi-note">{kpi.note}</div>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Próximos eventos</h2>
            <p>Las siguientes fechas en tu agenda.</p>
          </div>
          <Link href={`${base}/events`}>
            Ver eventos
            <ArrowRight size={13} />
          </Link>
        </div>
        {upcoming.length ? (
          <EventTable
            events={upcoming.slice(0, 5)}
            data={data}
            preview={preview}
          />
        ) : (
          <EmptyState
            title="Tu próximo evento empieza aquí"
            text="Crea un cliente y registra tu primer evento para empezar a llenar tu agenda."
            href={preview ? undefined : "/events/new"}
            label="Crear evento"
          />
        )}
        <div className="panel-footer">
          <span>{upcoming.length} eventos por venir</span>
          <span>Una celebración a la vez.</span>
        </div>
      </section>
      <div className="section-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Ventas y gastos</h2>
              <p>
                {dateLabel(`${month}-01`, { month: "long", year: "numeric" })} ·
                Resumen del mes
              </p>
            </div>
            <ChartNoAxesCombined size={16} color="#9da99e" />
          </div>
          <div
            className="chart"
            role="img"
            aria-label={`Ventas ${money(metrics.sales)}. Gastos ${money(metrics.spent)}. Ganancia estimada ${money(metrics.profit)}.`}
          >
            <div className="bar-row">
              <span>Ventas</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(metrics.sales / maxBar) * 100}%` }}
                />
              </div>
              <strong className="numbers">{money(metrics.sales)}</strong>
            </div>
            <div className="bar-row">
              <span>Gastos</span>
              <div className="bar-track">
                <div
                  className="bar-fill expense"
                  style={{ width: `${(metrics.spent / maxBar) * 100}%` }}
                />
              </div>
              <strong className="numbers">{money(metrics.spent)}</strong>
            </div>
            <div className="chart-summary">
              <span>Ganancia estimada</span>
              <strong className="numbers">{money(metrics.profit)}</strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Pagos pendientes</h2>
              <p>Un seguimiento a tiempo hace la diferencia.</p>
            </div>
            <span className="count-pill">{pending.length}</span>
          </div>
          {pending.length ? (
            pending.slice(0, 4).map((event) => (
              <div key={event.id} className="pending-row">
                <span className="client-initials">
                  {initials(
                    data.clients.find((c) => c.id === event.client_id)?.name ||
                      event.title,
                  )}
                </span>
                <div>
                  <strong>
                    {preview ? (
                      event.title
                    ) : (
                      <Link href={`/events/${event.id}`}>{event.title}</Link>
                    )}
                  </strong>
                  <span className="secondary-line">
                    {dateLabel(event.event_date)}
                  </span>
                </div>
                <div className="pending-amount">
                  <strong className="numbers">
                    {money(
                      eventFinance(event, data.payments, data.expenses).balance,
                    )}
                  </strong>
                  <span className="secondary-line">por cobrar</span>
                </div>
                {!preview && (
                  <Link
                    aria-label={`Registrar pago de ${event.title}`}
                    href={`/payments/new?event=${event.id}`}
                  >
                    <ArrowUpRight size={15} color="#93a095" />
                  </Link>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              title="Todo al día"
              text="No tienes saldos pendientes en eventos confirmados."
            />
          )}
        </section>
      </div>
      <div className="bottom-note">
        <span>
          <ShieldCheck size={12} /> Un espacio privado para {data.business.name}
          .
        </span>
        <span>Cada evento cuenta. Hazlo memorable.</span>
      </div>
    </>
  );
}
