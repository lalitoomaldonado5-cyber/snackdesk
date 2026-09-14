import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Wallet,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Card, EmptyState } from "./design/primitives";
import { dashboardMetrics, eventFinance, isConfirmed } from "@/lib/finance";
import { dateLabel, money } from "@/lib/format";
import { statuses, paymentTypes, type Workspace } from "@/types/domain";

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
      (event) =>
        event.event_date >= date &&
        event.status !== "cancelled" &&
        event.status !== "completed",
    )
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const pending = data.events
    .filter(isConfirmed)
    .filter(
      (event) => eventFinance(event, data.payments, data.expenses).balance > 0,
    )
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const clients = new Map(
    data.clients.map((client) => [client.id, client.name]),
  );
  const events = new Map(data.events.map((event) => [event.id, event.title]));
  const activity = [
    ...data.events.map((event) => ({
      id: `event-${event.id}`,
      created: event.created_at,
      title: "Evento registrado",
      description: event.title,
      href: `/events/${event.id}`,
    })),
    ...data.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      created: payment.created_at,
      title: `${paymentTypes[payment.payment_type]} registrado · ${money(payment.amount)}`,
      description: events.get(payment.event_id) || "Pago registrado",
      href: `/events/${payment.event_id}`,
    })),
    ...data.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      created: expense.created_at,
      title: `Gasto registrado · ${money(expense.amount)}`,
      description: expense.description,
      href: "/expenses",
    })),
  ]
    .sort((a, b) => b.created.localeCompare(a.created))
    .slice(0, 4);
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
      note: "Incluye eventos en estado cotizado",
      icon: CalendarDays,
    },
    {
      label: "Por cobrar",
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
  const bars = [
    { label: "Ventas confirmadas", value: metrics.sales, tone: "sales" },
    { label: "Gastos", value: metrics.spent, tone: "spent" },
    {
      label: "Ganancia estimada",
      value: metrics.profit,
      tone: metrics.profit < 0 ? "negative" : "profit",
    },
  ];
  const maxBar = Math.max(
    metrics.sales,
    metrics.spent,
    Math.abs(metrics.profit),
    1,
  );
  const base = preview ? "/demo" : "";
  const monthLabel = dateLabel(`${month}-01`, {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="sd-v2 sd-dashboard">
      <div className="sd-dashboard-heading">
        <div>
          <span className="sd-eyebrow">Tu negocio, de un vistazo</span>
          <h1>Hola, {data.profile.full_name.trim().split(/\s+/)[0]}.</h1>
          <p>
            Un buen día empieza en orden. <strong>{data.business.name}</strong>
          </p>
        </div>
        <div className="sd-heading-actions">
          <span className="sd-dashboard-date">
            <CalendarDays size={14} aria-hidden="true" />
            {dateLabel(date, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {!preview && (
            <Link className="sd-button primary" href="/events/new">
              <Plus size={16} aria-hidden="true" />
              Nuevo evento
            </Link>
          )}
        </div>
      </div>
      <div className="sd-period">
        <span>
          {monthLabel} <span className="sd-currency">/ MXN</span>
        </span>
        {!preview && (
          <form className="sd-month-form">
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
              required
            />
            <button className="sd-button secondary">Ver mes</button>
          </form>
        )}
      </div>
      <div className="sd-kpis">
        {kpis.map((kpi) => (
          <div className="sd-kpi" key={kpi.label}>
            <div className="sd-kpi-top">
              <span>{kpi.label}</span>
              <kpi.icon size={17} strokeWidth={1.4} aria-hidden="true" />
            </div>
            <div className="sd-kpi-value numbers">{kpi.value}</div>
            <div className="sd-kpi-note">{kpi.note}</div>
          </div>
        ))}
      </div>
      <div className="sd-dashboard-columns">
        <Card aria-labelledby="upcoming-title">
          <div className="sd-card-heading">
            <div>
              <h2 id="upcoming-title">Próximos eventos</h2>
              <p>Las celebraciones que vienen.</p>
            </div>
            <Link className="sd-text-link" href={`${base}/events`}>
              Ver todos
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {upcoming.length ? (
            <div className="sd-upcoming-list">
              {upcoming.slice(0, 4).map((event) => (
                <div className="sd-upcoming-row" key={event.id}>
                  <div
                    className="sd-date-tile"
                    aria-label={dateLabel(event.event_date)}
                  >
                    <strong>{event.event_date.slice(8)}</strong>
                    <span>
                      {dateLabel(event.event_date, { month: "short" })}
                    </span>
                  </div>
                  <div className="sd-event-info">
                    <strong>
                      {preview ? (
                        event.title
                      ) : (
                        <Link href={`/events/${event.id}`}>{event.title}</Link>
                      )}
                    </strong>
                    <p>{clients.get(event.client_id) || "Cliente"}</p>
                    <small>
                      {event.event_time?.slice(0, 5)}
                      {event.event_time && event.location ? " · " : ""}
                      {event.location || ""}
                    </small>
                  </div>
                  <div className="sd-event-value">
                    <strong className="numbers">
                      {money(event.total_amount)}
                    </strong>
                    <span className={`sd-badge ${event.status}`}>
                      {statuses[event.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Todavía no tienes eventos por venir."
              text="Registra la próxima celebración y reúne todos sus detalles en un solo lugar."
              href={preview ? undefined : "/events/new"}
              label="Crear mi primer evento"
            />
          )}
          <div className="sd-card-footer">
            <span>
              {upcoming.length}{" "}
              {upcoming.length === 1 ? "evento por venir" : "eventos por venir"}
            </span>
            <span>Una celebración a la vez.</span>
          </div>
        </Card>
        <Card aria-labelledby="pending-title">
          <div className="sd-card-heading">
            <div>
              <h2 id="pending-title">Pagos pendientes</h2>
              <p>Un seguimiento a tiempo.</p>
            </div>
            <span
              className="sd-count"
              aria-label={`${pending.length} eventos con saldo`}
            >
              {pending.length}
            </span>
          </div>
          {pending.length ? (
            <div className="sd-pending-list">
              {pending.slice(0, 3).map((event) => (
                <div className="sd-pending-item" key={event.id}>
                  <div className="sd-pending-main">
                    <div>
                      <strong>{event.title}</strong>
                      <p>
                        {clients.get(event.client_id)} ·{" "}
                        {dateLabel(event.event_date, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <strong className="numbers">
                      {money(
                        eventFinance(event, data.payments, data.expenses)
                          .balance,
                      )}
                    </strong>
                  </div>
                  {!preview && (
                    <Link
                      className="sd-text-link"
                      href={`/payments/new?event=${event.id}`}
                    >
                      Registrar pago
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Todo al día."
              text="No tienes saldos pendientes en eventos confirmados. Aquí aparecerán cuando los haya."
            />
          )}
          <div className="sd-card-footer">
            <span>Eventos confirmados · Todas las fechas</span>
            <Link className="sd-text-link" href={`${base}/payments`}>
              Ver pagos
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </div>
      <div className="sd-dashboard-columns">
        <Card aria-labelledby="finance-title">
          <div className="sd-card-heading">
            <div>
              <h2 id="finance-title">Tus números, en perspectiva</h2>
              <p>{monthLabel} · Importes en MXN</p>
            </div>
            <ChartNoAxesCombined
              size={18}
              strokeWidth={1.4}
              aria-hidden="true"
            />
          </div>
          {metrics.sales || metrics.spent ? (
            <div className="sd-finance-chart">
              {bars.map((bar) => (
                <div className="sd-finance-bar" key={bar.label}>
                  <div>
                    <span>{bar.label}</span>
                    <strong className="numbers">{money(bar.value)}</strong>
                  </div>
                  <div className="sd-bar-track" aria-hidden="true">
                    <span
                      className={bar.tone}
                      style={{
                        width: `${(Math.abs(bar.value) / maxBar) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="sd-chart-note">
                Ventas según la fecha de los eventos confirmados; gastos según
                su fecha de registro. La ganancia es estimada, no el efectivo
                disponible.
              </p>
            </div>
          ) : (
            <EmptyState
              title="Aquí empieza la claridad."
              text="Tus ventas y gastos del mes darán forma a este resumen cuando registres tus primeros movimientos."
              href={`${base}/expenses`}
              label="Ver gastos"
            />
          )}
        </Card>
        <Card aria-labelledby="activity-title">
          <div className="sd-card-heading">
            <div>
              <h2 id="activity-title">Actividad reciente</h2>
              <p>Lo último que registraste.</p>
            </div>
          </div>
          {activity.length ? (
            <ol className="sd-activity">
              {activity.map((item) => (
                <li key={item.id}>
                  <span className="sd-activity-dot" aria-hidden="true" />
                  <div>
                    <strong>
                      {preview ? (
                        item.title
                      ) : (
                        <Link href={item.href}>{item.title}</Link>
                      )}
                    </strong>
                    <p>{item.description}</p>
                    <small>{dateLabel(item.created.slice(0, 10))}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Cada paso cuenta."
              text="Tus nuevos eventos, pagos y gastos aparecerán aquí al registrarlos."
            />
          )}
        </Card>
      </div>
      <div className="sd-dashboard-foot">
        <span>
          <ShieldCheck size={13} aria-hidden="true" />
          Un espacio privado para {data.business.name}.
        </span>
        <span>Tu negocio, en orden.</span>
      </div>
    </div>
  );
}
