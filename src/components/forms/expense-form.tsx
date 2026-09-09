"use client";
import { saveExpense } from "@/services/records";
import { Field } from "../ui";
import { FormFrame } from "./form-frame";
import type { Expense, Event } from "@/types/domain";
export function ExpenseForm({
  expense,
  events,
  defaultEventId = "",
  defaultDate,
}: {
  expense?: Expense;
  events: Event[];
  defaultEventId?: string;
  defaultDate: string;
}) {
  return (
    <FormFrame
      action={saveExpense}
      id={expense?.id}
      cancelHref="/expenses"
      label={expense ? "Guardar cambios" : "Registrar gasto"}
    >
      <div className="span-2">
        <Field label="Descripción *">
          <input
            name="description"
            defaultValue={expense?.description}
            placeholder="Compra de snacks y desechables"
            maxLength={250}
            required
          />
        </Field>
      </div>
      <Field label="Categoría">
        <input
          name="category"
          list="categories"
          defaultValue={expense?.category || ""}
          placeholder="Insumos, transporte…"
          maxLength={80}
        />
        <datalist id="categories">
          <option>Insumos</option>
          <option>Transporte</option>
          <option>Personal</option>
          <option>Equipo</option>
          <option>Otros</option>
        </datalist>
      </Field>
      <Field label="Cantidad (MXN) *">
        <input
          name="amount"
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          defaultValue={expense?.amount}
          placeholder="450.00"
          required
        />
      </Field>
      <Field label="Fecha *">
        <input
          name="expense_date"
          type="date"
          defaultValue={expense?.expense_date || defaultDate}
          min="1900-01-01"
          max="2199-12-31"
          required
        />
      </Field>
      <Field label="Evento relacionado">
        <select
          name="event_id"
          defaultValue={expense?.event_id || defaultEventId}
        >
          <option value="">Gasto general del negocio</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="span-2">
        <Field label="Notas">
          <textarea
            name="notes"
            defaultValue={expense?.notes || ""}
            maxLength={2000}
            placeholder="Detalles adicionales del gasto…"
          />
        </Field>
      </div>
    </FormFrame>
  );
}
