import { z } from "zod";

export const quoteFonts = {
  lato: "Lato · Contemporánea",
  instrument: "Instrument Serif · Editorial",
  dm: "DM Serif Display · Clásica",
} as const;
const text = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres.`);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Revisa las fechas.")
  .refine((value) => {
    const d = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01" &&
      value <= "2199-12-31"
    );
  }, "Fecha inválida.");
const amount = z
  .string()
  .regex(
    /^\d{1,8}(\.\d{1,2})?$/,
    "Usa importes positivos con hasta dos decimales.",
  );
export function cents(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export const quoteSchema = z
  .object({
    font: z.enum(["lato", "instrument", "dm"]),
    reference: text(30).min(1, "Agrega una referencia para la cotización."),
    issueDate: date,
    validUntil: date,
    clientName: text(150).min(1, "Escribe el nombre del cliente."),
    clientContact: text(300),
    eventTitle: text(150).min(1, "Escribe el nombre del evento."),
    eventDate: date,
    location: text(200),
    guests: z.union([
      z.literal(""),
      z
        .string()
        .regex(/^\d{1,6}$/)
        .refine((v) => Number(v) > 0),
    ]),
    items: z
      .array(
        z.object({
          description: text(180).min(1, "Describe cada concepto."),
          quantity: z.number().int().min(1).max(9999),
          unitPrice: amount,
        }),
      )
      .min(1)
      .max(8, "Una página admite hasta ocho conceptos."),
    taxPercent: z.union([z.literal(0), z.literal(16)]),
    deposit: amount,
    notes: text(600),
    terms: text(400),
  })
  .superRefine((q, ctx) => {
    if (q.validUntil < q.issueDate)
      ctx.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "La vigencia no puede ser anterior a la fecha de emisión.",
      });
    const totals = quoteTotals(q);
    if (totals.total > 9_999_999_999)
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "El total supera el importe máximo permitido.",
      });
    if (cents(q.deposit) > totals.total)
      ctx.addIssue({
        code: "custom",
        path: ["deposit"],
        message: "El anticipo no puede superar el total.",
      });
  });
export type QuoteInput = z.infer<typeof quoteSchema>;
export function quoteTotals(q: Pick<QuoteInput, "items" | "taxPercent">) {
  const subtotal = q.items.reduce(
    (sum, item) => sum + cents(item.unitPrice) * item.quantity,
    0,
  );
  const tax = Math.round((subtotal * q.taxPercent) / 100);
  return { subtotal, tax, total: subtotal + tax };
}
export const quoteMoney = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    value / 100,
  );
