"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Notice } from "../ui";
import type { ActionState } from "@/types/domain";
export function FormFrame({
  action,
  children,
  id,
  cancelHref,
  label = "Guardar cambios",
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  id?: string;
  cancelHref: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      {id && <input type="hidden" name="id" value={id} />}
      <div className="form-grid">{children}</div>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.success && <Notice tone="success">{state.success}</Notice>}
      <div className="form-actions">
        <Link className="button" href={cancelHref}>
          Cancelar
        </Link>
        <button className="button primary" disabled={pending}>
          <Check size={16} />
          {pending ? "Guardando…" : label}
        </button>
      </div>
    </form>
  );
}
