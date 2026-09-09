import "server-only";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "./session";
import { formObject, uuid } from "./validation";
export async function validated<T>(
  form: FormData,
  schema: z.ZodType<T>,
  ownerOnly = false,
) {
  const session = await requireSession();
  if (ownerOnly && session.profile.role !== "owner")
    return {
      ok: false as const,
      error: "Solo el propietario puede realizar este cambio.",
    };
  const result = schema.safeParse(formObject(form));
  if (!result.success)
    return { ok: false as const, error: result.error.issues[0].message };
  const rawId = form.get("id");
  if (rawId && !uuid.safeParse(rawId).success)
    return { ok: false as const, error: "El identificador no es válido." };
  return {
    ok: true as const,
    values: result.data,
    id: typeof rawId === "string" && rawId ? rawId : null,
    session,
  };
}
export function safeDbError(error: {
  code?: string;
  message?: string;
}): string {
  if (error.message?.includes("payment_exceeds_balance"))
    return "El pago supera el saldo pendiente del evento.";
  if (error.message?.includes("total_below_payments"))
    return "El total no puede ser menor que los pagos ya registrados.";
  if (error.message?.includes("event_not_fully_paid"))
    return "Registra la liquidación antes de marcar el evento como pagado.";
  if (error.message?.includes("event_cancelled"))
    return "No se pueden registrar pagos en un evento cancelado.";
  if (error.message?.includes("payment_event_immutable"))
    return "Un pago registrado no puede cambiar de evento. Elimínalo y vuelve a registrarlo si fue un error.";
  if (error.code === "23503")
    return "No se pudo completar el cambio. El registro está relacionado con otros datos o la referencia no está disponible en tu negocio.";
  if (error.code === "23514")
    return "Revisa los importes y los campos del formulario.";
  if (error.code === "PGRST116" || error.code === "42501")
    return "No encontramos el registro o no tienes permiso para modificarlo.";
  return "No pudimos guardar el cambio. Verifica tu conexión e inténtalo de nuevo.";
}
export function finish(href: string): never {
  revalidatePath("/", "layout");
  redirect(href);
}
