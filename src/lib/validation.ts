import { z } from "zod";
const text = (max = 150) =>
  z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio.")
    .max(max, `Máximo ${max} caracteres.`);
const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const money = z
  .string()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, "Usa un monto válido con hasta 2 decimales.")
  .transform(Number);
export const uuid = z.string().uuid("Identificador inválido.");
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
  .refine((v) => {
    const d = new Date(`${v}T12:00:00Z`);
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === v &&
      v >= "1900-01-01" &&
      v <= "2199-12-31"
    );
  }, "Fecha inválida.");
export const clientSchema = z.object({
  name: text(),
  phone: text(30).refine(
    (v) => /^[+\d\s().-]{7,30}$/.test(v),
    "Escribe un teléfono válido.",
  ),
  email: z
    .union([z.email().max(254), z.literal("")])
    .transform((v) => v || null),
  notes: optionalText(),
});
export const eventSchema = z.object({
  client_id: uuid,
  title: text(),
  event_type: text(80),
  event_date: date,
  event_time: z
    .union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")])
    .transform((v) => v || null),
  location: optionalText(500),
  guest_count: z.union([
    z.literal("").transform(() => null),
    z
      .string()
      .regex(/^\d{1,6}$/)
      .transform(Number)
      .refine((v) => v >= 1, "Mínimo una persona."),
  ]),
  total_amount: money,
  status: z.enum(["quoted", "reserved", "paid", "completed", "cancelled"]),
  notes: optionalText(),
});
export const paymentSchema = z.object({
  event_id: uuid,
  amount: money.refine((v) => v > 0, "El monto debe ser mayor a cero."),
  payment_type: z.enum(["deposit", "partial", "final"]),
  payment_date: date,
  notes: optionalText(),
});
export const expenseSchema = z.object({
  event_id: z.union([uuid, z.literal("")]).transform((v) => v || null),
  description: text(250),
  category: optionalText(80),
  amount: money.refine((v) => v > 0, "El monto debe ser mayor a cero."),
  expense_date: date,
  notes: optionalText(),
});
export const businessSchema = z.object({
  name: text(),
  phone: optionalText(30),
});
export const packageSchema = z.object({
  name: text(),
  description: optionalText(),
  base_price: money,
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
  password: z.string().min(10, "Usa al menos 10 caracteres.").max(128),
  full_name: text(),
  business_name: text(),
});
export function formObject(form: FormData) {
  return Object.fromEntries(form.entries());
}
