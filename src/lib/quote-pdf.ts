import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { cents, quoteMoney, quoteTotals, type QuoteInput } from "./quote.ts";

export class QuoteLayoutError extends Error {}
export async function renderQuote(
  q: QuoteInput,
  business: { name: string; phone: string | null },
  fontBytes: Uint8Array,
  logo?: Uint8Array,
) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Cotización ${q.reference} · ${business.name}`);
  doc.setAuthor(business.name);
  const font = await doc.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  const page = doc.addPage([612, 792]);
  const ink = rgb(0.07, 0.2, 0.17),
    muted = rgb(0.34, 0.39, 0.37);
  const line = rgb(0.85, 0.88, 0.85),
    pale = rgb(0.94, 0.96, 0.93);
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`));
  function wrap(value: string, width: number, size: number) {
    const normalized = value
      .normalize("NFC")
      .replace(/\r\n?/g, "\n")
      .replace(/\t/g, " ");
    for (const char of normalized) {
      if (char !== "\n" && !supported.has(char.codePointAt(0)!))
        throw new QuoteLayoutError(
          "La tipografía no admite uno de los caracteres. Quita emojis o símbolos especiales e inténtalo de nuevo.",
        );
    }
    const lines: string[] = [];
    for (const paragraph of normalized.split("\n")) {
      let current = "";
      for (const word of paragraph.split(/ +/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width)
          current = candidate;
        else {
          if (current) lines.push(current);
          current = "";
          for (const char of word) {
            if (
              current &&
              font.widthOfTextAtSize(current + char, size) > width
            ) {
              lines.push(current);
              current = "";
            }
            current += char;
          }
        }
      }
      lines.push(current);
    }
    return lines;
  }
  function paragraph(
    value: string,
    x: number,
    top: number,
    width: number,
    size = 11,
    color = ink,
  ) {
    const lines = wrap(value, width, size);
    const bottom = top - lines.length * (size + 4);
    if (bottom < 48)
      throw new QuoteLayoutError(
        "El contenido no cabe en una página. Acorta las notas, condiciones o descripciones y vuelve a generar el PDF.",
      );
    lines.forEach((text, i) =>
      page.drawText(text, {
        x,
        y: top - size - i * (size + 4),
        size,
        font,
        color,
      }),
    );
    return bottom;
  }
  function right(value: string, edge: number, y: number, size = 11) {
    paragraph(value, edge - font.widthOfTextAtSize(value, size), y, 140, size);
  }
  function rule(y: number) {
    page.drawLine({
      start: { x: 42, y },
      end: { x: 570, y },
      thickness: 0.6,
      color: line,
    });
  }
  let nameX = 42,
    nameWidth = 325;
  if (logo) {
    const image = await doc.embedPng(logo);
    const fit = image.scaleToFit(72, 64);
    page.drawImage(image, { x: 42, y: 748 - fit.height, ...fit });
    nameX = 130;
    nameWidth = 237;
  }
  const nameEnd = paragraph(business.name, nameX, 750, nameWidth, 23);
  const contactEnd = business.phone
    ? paragraph(business.phone, nameX, nameEnd - 6, nameWidth, 10, muted)
    : nameEnd;
  paragraph("COTIZACIÓN", 405, 748, 165, 17);
  const referenceEnd = paragraph(q.reference, 405, 723, 165, 10, muted);
  let y = Math.min(662, contactEnd - 20, referenceEnd - 18);
  rule(y);
  y -= 17;
  paragraph(`Emisión: ${formatDate(q.issueDate)}`, 42, y, 260, 10, muted);
  paragraph(
    `Válida hasta: ${formatDate(q.validUntil)}`,
    312,
    y,
    258,
    10,
    muted,
  );
  y -= 29;
  const clientBottom = paragraph(
    `PARA\n${q.clientName}${q.clientContact ? `\n${q.clientContact}` : ""}`,
    42,
    y,
    245,
  );
  const eventBottom = paragraph(
    `EVENTO\n${q.eventTitle}\n${formatDate(q.eventDate)}${q.guests ? ` · ${q.guests} personas` : ""}${q.location ? `\n${q.location}` : ""}`,
    312,
    y,
    258,
  );
  y = Math.min(clientBottom, eventBottom) - 20;
  page.drawRectangle({ x: 42, y: y - 26, width: 528, height: 26, color: pale });
  paragraph("Concepto", 50, y - 5, 275, 10);
  right("Cant.", 361, y - 5, 10);
  right("Precio", 463, y - 5, 10);
  right("Importe", 562, y - 5, 10);
  y -= 34;
  for (const item of q.items) {
    const bottom = paragraph(item.description, 50, y, 272);
    right(String(item.quantity), 361, y);
    right(quoteMoney(cents(item.unitPrice)), 463, y, 10);
    right(quoteMoney(cents(item.unitPrice) * item.quantity), 562, y, 10);
    y = bottom - 9;
    rule(y);
    y -= 9;
  }
  const totals = quoteTotals(q);
  for (const [label, value] of [
    ["Subtotal", totals.subtotal],
    [`IVA (${q.taxPercent}%)`, totals.tax],
    ["Total MXN", totals.total],
    ["Anticipo solicitado", cents(q.deposit)],
  ] as const) {
    paragraph(label, 330, y, 150, label === "Total MXN" ? 13 : 10);
    right(quoteMoney(value), 562, y, label === "Total MXN" ? 13 : 10);
    y -= 21;
  }
  for (const [title, value] of [
    ["NOTAS", q.notes],
    ["CONDICIONES", q.terms],
  ]) {
    if (value) {
      y -= 8;
      y = paragraph(title, 42, y, 528, 9, muted) - 4;
      y = paragraph(value, 42, y, 528, 10);
    }
  }
  rule(39);
  page.drawText(
    "Importes en pesos mexicanos. Esta cotización no es un comprobante de pago.",
    { x: 42, y: 24, size: 8, font, color: muted },
  );
  return doc.save();
}
