"use client";
import { savePackage } from "@/services/records";
import { Field } from "../ui";
import { FormFrame } from "./form-frame";
import type { ServicePackage } from "@/types/domain";
export function PackageForm({
  servicePackage,
}: {
  servicePackage?: ServicePackage;
}) {
  return (
    <FormFrame
      action={savePackage}
      id={servicePackage?.id}
      cancelHref="/settings"
      label={servicePackage ? "Guardar cambios" : "Crear paquete"}
    >
      <Field label="Nombre del paquete *">
        <input
          name="name"
          defaultValue={servicePackage?.name}
          maxLength={150}
          required
          placeholder="Barra clásica"
        />
      </Field>
      <Field label="Precio base (MXN) *">
        <input
          name="base_price"
          type="number"
          min="0"
          max="99999999.99"
          step="0.01"
          defaultValue={servicePackage?.base_price}
          required
          placeholder="2500.00"
        />
      </Field>
      <div className="span-2">
        <Field label="Descripción">
          <textarea
            name="description"
            defaultValue={servicePackage?.description || ""}
            maxLength={2000}
            placeholder="Qué incluye el servicio…"
          />
        </Field>
      </div>
      <Field label="Disponibilidad">
        <select
          name="active"
          defaultValue={String(servicePackage?.active ?? true)}
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </Field>
    </FormFrame>
  );
}
