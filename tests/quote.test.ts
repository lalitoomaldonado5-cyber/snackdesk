import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument, PDFName, PDFDict, PDFArray } from "pdf-lib";
import { quoteSchema, quoteTotals } from "../src/lib/quote.ts";
import { QuoteLayoutError, renderQuote } from "../src/lib/quote-pdf.ts";

const input = {
  font: "lato",
  reference: "COT-042",
  issueDate: "2026-09-18",
  validUntil: "2026-09-30",
  clientName: "María Fernanda López",
  clientContact: "55 1234 5678",
  eventTitle: "Cumpleaños de Sofía",
  eventDate: "2026-10-20",
  location: "Jardín Las Flores, Ciudad de México",
  guests: "80",
  items: [
    {
      description: "Barra de snacks · Paquete Premium",
      quantity: 1,
      unitPrice: "4800",
    },
    { description: "Toppings adicionales", quantity: 2, unitPrice: "300" },
    { description: "Transporte y montaje", quantity: 1, unitPrice: "300" },
  ],
  taxPercent: 16,
  deposit: "2000",
  notes:
    "Servicio de tres horas. Incluye vasos, servilletas y montaje.\nGracias por hacernos parte de tu celebración.",
  terms: "Reserva con un anticipo. El saldo se liquida antes del evento.",
};
test("quote money uses cents, rounds tax once, and rejects excessive deposit / total", () => {
  assert.deepEqual(
    quoteTotals({
      items: [{ description: "A", quantity: 3, unitPrice: "0.10" }],
      taxPercent: 16,
    }),
    { subtotal: 30, tax: 5, total: 35 },
  );
  assert.equal(
    quoteSchema.safeParse({ ...input, deposit: "999999" }).success,
    false,
  );
  assert.equal(
    quoteSchema.safeParse({
      ...input,
      items: [{ description: "A", quantity: 9999, unitPrice: "99999999" }],
    }).success,
    false,
  );
  for (const unitPrice of ["-1", "1e3", "0.001", "NaN"])
    assert.equal(
      quoteSchema.safeParse({
        ...input,
        items: [{ description: "A", quantity: 1, unitPrice }],
      }).success,
      false,
    );
});
test("quote validates real dates and does not trust supplied company metadata", () => {
  assert.equal(
    quoteSchema.safeParse({ ...input, eventDate: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    quoteSchema.safeParse({ ...input, validUntil: "2026-09-01" }).success,
    false,
  );
  const parsed = quoteSchema.parse({
    ...input,
    business_id: "someone-else",
    business: { name: "Forged" },
    logo_url: "https://example.com",
  });
  assert.equal("business" in parsed, false);
  assert.equal("business_id" in parsed, false);
  assert.equal("logo_url" in parsed, false);
});
for (const font of ["lato", "instrument", "dm"] as const) {
  test(`quote ${font}: one page, embedded font, logo and accents`, async () => {
    const bytes = await readFile(`assets/pdf/${font}.woff`);
    const logo = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    const pdf = await PDFDocument.load(
      await renderQuote(
        quoteSchema.parse({ ...input, font }),
        { name: "Celebraciones Lucía", phone: "55 5555 5555" },
        bytes,
        logo,
      ),
    );
    assert.equal(pdf.getPageCount(), 1);
    const fonts = pdf
      .getPages()[0]
      .node.Resources()!
      .lookup(PDFName.of("Font"), PDFDict);
    const embedded = fonts
      .lookup(fonts.keys()[0], PDFDict)
      .lookup(PDFName.of("DescendantFonts"), PDFArray)
      .lookup(0, PDFDict)
      .lookup(PDFName.of("FontDescriptor"), PDFDict);
    assert.ok(
      embedded.has(PDFName.of("FontFile2")) ||
        embedded.has(PDFName.of("FontFile3")),
    );
    assert.ok(
      pdf
        .getPages()[0]
        .node.Resources()!
        .lookup(PDFName.of("XObject"), PDFDict)
        .keys().length,
    );
  });
}
test("overflow and unsupported glyphs give actionable errors instead of clipped PDFs", async () => {
  const bytes = await readFile("assets/pdf/lato.woff");
  const q = quoteSchema.parse({
    ...input,
    deposit: "0",
    items: Array.from({ length: 8 }, () => ({
      description: "Descripción de servicio detallada. ".repeat(5),
      quantity: 1,
      unitPrice: "1",
    })),
    notes: "Nota\n".repeat(100),
  });
  await assert.rejects(
    renderQuote(q, { name: "Mi negocio", phone: null }, bytes),
    QuoteLayoutError,
  );
  await assert.rejects(
    renderQuote(
      { ...quoteSchema.parse(input), notes: "Fiesta 🎉" },
      { name: "Mi negocio", phone: null },
      bytes,
    ),
    /símbolos especiales/,
  );
});
