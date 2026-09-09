"use client";
import Image from "next/image";
import { saveBusiness } from "@/services/settings";
import { Field } from "../ui";
import { FormFrame } from "./form-frame";
import { initials } from "@/lib/format";
import type { Business } from "@/types/domain";
export function BusinessForm({
  business,
  logoSrc,
}: {
  business: Business;
  logoSrc: string | null;
}) {
  return (
    <>
      <div className="logo-settings">
        <div className="workspace-avatar">
          {logoSrc ? (
            <Image
              unoptimized
              src={logoSrc}
              alt="Logo actual"
              width={50}
              height={50}
            />
          ) : (
            initials(business.name)
          )}
        </div>
        <div>
          <h3>{business.name}</h3>
          <p>La identidad de tu negocio.</p>
        </div>
      </div>
      <FormFrame action={saveBusiness} cancelHref="/dashboard">
        <div className="span-2">
          <Field label="Nombre del negocio *">
            <input
              name="name"
              defaultValue={business.name}
              maxLength={150}
              required
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Teléfono">
            <input
              name="phone"
              type="tel"
              defaultValue={business.phone || ""}
              maxLength={30}
            />
          </Field>
        </div>
        <div className="span-2">
          <Field
            label="Logo"
            hint="PNG, JPG o WebP. Máximo 2 MB. Se guarda de forma privada."
          >
            <input
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
            />
          </Field>
        </div>
      </FormFrame>
    </>
  );
}
