"use client";
import { useState } from "react";
import { savePayment } from "@/services/records";
import { Field, Notice } from "../ui";
import { FormFrame } from "./form-frame";
import { paymentTypes, type Event, type Payment } from "@/types/domain";
import { eventFinance } from "@/lib/finance";
import { money } from "@/lib/format";
export function PaymentForm({
  payment,
  events,
  payments,
  defaultEventId = "",
  defaultDate,
}: {
  payment?: Payment;
  events: Event[];
  payments: Payment[];
  defaultEventId?: string;
  defaultDate: string;
}) {
  const [selected, setSelected] = useState(payment?.event_id || defaultEventId);
  const event = events.find((e) => e.id === selected);
  const balance = event
    ? eventFinance(
        event,
        payments.filter((p) => p.id !== payment?.id),
        [],
      ).balance
    : 0;
  return (
    <FormFrame
      action={savePayment}
      id={payment?.id}
      cancelHref="/payments"
      label={payment ? "Guardar cambios" : "Registrar pago"}
    >
      <div className="span-2">
        <Field
          label="Evento *"
          hint={
            payment
              ? "El evento de un pago registrado no se puede cambiar."
              : undefined
          }
        >
          <select
            name="event_id"
            required
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!!payment}
          >
            <option value="" disabled>
              Selecciona un evento
            </option>
            {events
              .filter(
                (e) => e.status !== "cancelled" || e.id === payment?.event_id,
              )
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
          </select>
          {payment && (
            <input type="hidden" name="event_id" value={payment.event_id} />
          )}
        </Field>
        {event && (
          <Notice>
            Saldo disponible para este pago: <strong>{money(balance)}</strong>
          </Notice>
        )}
      </div>
      <Field label="Cantidad (MXN) *">
        <input
          name="amount"
          type="number"
          min="0.01"
          max={event ? balance : "99999999.99"}
          step="0.01"
          defaultValue={payment?.amount}
          required
          placeholder="1500.00"
        />
      </Field>
      <Field label="Tipo de pago *">
        <select
          name="payment_type"
          defaultValue={payment?.payment_type || "deposit"}
        >
          {Object.entries(paymentTypes).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Fecha *">
        <input
          name="payment_date"
          type="date"
          defaultValue={payment?.payment_date || defaultDate}
          min="1900-01-01"
          max="2199-12-31"
          required
        />
      </Field>
      <div className="span-2">
        <Field label="Notas">
          <textarea
            name="notes"
            defaultValue={payment?.notes || ""}
            placeholder="Transferencia, efectivo o referencia del pago…"
            maxLength={2000}
          />
        </Field>
      </div>
    </FormFrame>
  );
}
