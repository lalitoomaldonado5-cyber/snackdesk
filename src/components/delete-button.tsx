"use client";
import { useActionState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/services/records";
import { Notice } from "./ui";
export function DeleteButton({
  table,
  id,
  name,
}: {
  table: "clients" | "events" | "payments" | "expenses";
  id: string;
  name: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(deleteRecord, {});
  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label={`Eliminar ${name}`}
        onClick={() => dialog.current?.showModal()}
      >
        <Trash2 size={15} />
      </button>
      <dialog
        ref={dialog}
        className="delete-dialog"
        aria-labelledby={`delete-${id}`}
      >
        <h2 id={`delete-${id}`}>¿Eliminar este registro?</h2>
        <p>
          Vas a eliminar <strong>{name}</strong>. Esta acción no se puede
          deshacer.
          {(table === "clients" || table === "events") &&
            " Si tiene registros relacionados, primero debes resolverlos."}
        </p>
        <form action={action}>
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={id} />
          {state.error && <Notice tone="error">{state.error}</Notice>}
          <div className="form-actions">
            <button
              type="button"
              className="button"
              onClick={() => dialog.current?.close()}
              disabled={pending}
            >
              Cancelar
            </button>
            <button className="button danger" disabled={pending}>
              {pending ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
