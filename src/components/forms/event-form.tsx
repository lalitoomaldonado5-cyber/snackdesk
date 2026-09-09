"use client";
import { saveEvent } from "@/services/records";
import { Field } from "../ui";
import { FormFrame } from "./form-frame";
import { statuses, type Client, type Event } from "@/types/domain";
export function EventForm({
  event,
  clients,
}: {
  event?: Event;
  clients: Client[];
}) {
  return (
    <FormFrame
      action={saveEvent}
      id={event?.id}
      cancelHref={event ? `/events/${event.id}` : "/events"}
      label={event ? "Guardar cambios" : "Crear evento"}
    >
      <div className="span-2">
        <Field label="Cliente *">
          <select
            name="client_id"
            defaultValue={event?.client_id || ""}
            required
          >
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Nombre del evento *">
        <input
          name="title"
          defaultValue={event?.title}
          placeholder="Cumpleaños Ana"
          maxLength={150}
          required
        />
      </Field>
      <Field label="Tipo de evento *">
        <input
          name="event_type"
          list="event-types"
          defaultValue={event?.event_type}
          placeholder="Cumpleaños, boda, XV años…"
          maxLength={80}
          required
        />
        <datalist id="event-types">
          <option>Cumpleaños</option>
          <option>XV años</option>
          <option>Boda</option>
          <option>Corporativo</option>
          <option>Otro</option>
        </datalist>
      </Field>
      <Field label="Fecha *">
        <input
          name="event_date"
          type="date"
          defaultValue={event?.event_date}
          min="1900-01-01"
          max="2199-12-31"
          required
        />
      </Field>
      <Field label="Hora">
        <input
          name="event_time"
          type="time"
          defaultValue={event?.event_time?.slice(0, 5) || ""}
        />
      </Field>
      <Field label="Ubicación">
        <input
          name="location"
          defaultValue={event?.location || ""}
          placeholder="Dirección o nombre del salón"
          maxLength={500}
        />
      </Field>
      <Field label="Número de personas">
        <input
          name="guest_count"
          type="number"
          min="1"
          max="999999"
          step="1"
          defaultValue={event?.guest_count || ""}
          placeholder="80"
        />
      </Field>
      <Field label="Monto total (MXN) *">
        <input
          name="total_amount"
          type="number"
          min="0"
          max="99999999.99"
          step="0.01"
          defaultValue={event?.total_amount}
          placeholder="3800.00"
          required
        />
      </Field>
      <Field
        label="Estado *"
        hint="Pagado requiere tener registrada la liquidación."
      >
        <select name="status" defaultValue={event?.status || "quoted"}>
          {Object.entries(statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="span-2">
        <Field label="Notas">
          <textarea
            name="notes"
            defaultValue={event?.notes || ""}
            maxLength={2000}
            placeholder="Indicaciones, preferencias o detalles del servicio…"
          />
        </Field>
      </div>
    </FormFrame>
  );
}
