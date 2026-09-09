"use client";
import { saveClient } from "@/services/records";
import { Field } from "../ui";
import { FormFrame } from "./form-frame";
import type { Client } from "@/types/domain";
export function ClientForm({ client }: { client?: Client }) {
  return (
    <FormFrame
      action={saveClient}
      id={client?.id}
      cancelHref="/clients"
      label={client ? "Guardar cambios" : "Crear cliente"}
    >
      <Field label="Nombre *">
        <input
          name="name"
          defaultValue={client?.name}
          placeholder="Nombre y apellido"
          maxLength={150}
          required
        />
      </Field>
      <Field label="Teléfono *">
        <input
          name="phone"
          type="tel"
          defaultValue={client?.phone}
          placeholder="55 1234 5678"
          maxLength={30}
          minLength={7}
          required
        />
      </Field>
      <div className="span-2">
        <Field label="Correo electrónico">
          <input
            name="email"
            type="email"
            defaultValue={client?.email || ""}
            placeholder="cliente@correo.com"
            maxLength={254}
          />
        </Field>
      </div>
      <div className="span-2">
        <Field label="Notas">
          <textarea
            name="notes"
            defaultValue={client?.notes || ""}
            placeholder="Detalles que quieras recordar sobre este cliente…"
            maxLength={2000}
          />
        </Field>
      </div>
    </FormFrame>
  );
}
