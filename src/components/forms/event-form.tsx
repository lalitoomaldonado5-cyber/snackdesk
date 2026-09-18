"use client";
import { useState } from "react";
import { createClientInline, saveEvent } from "@/services/records";
import { Field, Notice } from "../ui";
import { Modal } from "../design/primitives";
import { FormFrame } from "./form-frame";
import { statuses, type Client, type Event } from "@/types/domain";
export function EventForm({
  event,
  clients,
}: {
  event?: Event;
  clients: Client[];
}) {
  const [addedClients, setAddedClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(event?.client_id || "");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const allClients = [
    ...clients,
    ...addedClients.filter(
      (c) => !clients.some((existing) => existing.id === c.id),
    ),
  ];
  return (
    <>
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
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecciona un cliente
              </option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="button"
            type="button"
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            + Agregar cliente nuevo
          </button>
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
      <Modal
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title="Nuevo cliente"
        closeLabel="Cerrar nuevo cliente"
        className="sd-client-modal"
      >
        {open && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setPending(true);
              setError("");
              try {
                const result = await createClientInline(form);
                if (result.error) setError(result.error);
                if (result.client) {
                  setAddedClients((list) => [...list, result.client!]);
                  setClientId(result.client.id);
                  setOpen(false);
                }
              } catch {
                setError(
                  "No pudimos guardar el cliente. Revisa tu conexión e inténtalo de nuevo.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            <p>
              Se guardará en tus clientes y quedará seleccionado para este
              evento.
            </p>
            <div className="form-grid">
              <Field label="Nombre del cliente *">
                <input name="name" maxLength={150} required />
              </Field>
              <Field label="Teléfono *">
                <input
                  name="phone"
                  type="tel"
                  minLength={7}
                  maxLength={30}
                  required
                />
              </Field>
              <Field label="Correo">
                <input name="email" type="email" maxLength={254} />
              </Field>
              <Field label="Notas del cliente">
                <textarea name="notes" maxLength={2000} />
              </Field>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="form-actions">
              <button
                type="button"
                className="button"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={pending}>
                {pending ? "Guardando…" : "Guardar y seleccionar"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
