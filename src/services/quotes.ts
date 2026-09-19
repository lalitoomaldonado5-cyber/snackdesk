"use server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { requireSession } from "@/lib/session";
import { quoteSchema } from "@/lib/quote";
import { QuoteLayoutError, renderQuote } from "@/lib/quote-pdf";

export async function generateQuote(
  input: unknown,
): Promise<{ pdf?: string; filename?: string; error?: string }> {
  const { supabase, businessId } = await requireSession();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data: business, error } = await supabase
    .from("businesses")
    .select("name,phone,logo_url")
    .eq("id", businessId)
    .single();
  if (error || !business)
    return {
      error: "No pudimos cargar los datos de tu negocio. Inténtalo de nuevo.",
    };
  try {
    let logo: Uint8Array | undefined;
    if (business.logo_url) {
      const { data, error: logoError } = await supabase.storage
        .from("business-logos")
        .download(business.logo_url);
      if (logoError || !data)
        return {
          error:
            "No pudimos cargar el logo de tu negocio. Revisa el logo en Configuración e inténtalo de nuevo.",
        };
      logo = await sharp(Buffer.from(await data.arrayBuffer()), {
        limitInputPixels: 40_000_000,
      })
        .rotate()
        .resize(600, 600, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
    }
    const fontBytes = await readFile(
      path.join(process.cwd(), "assets", "pdf", `${parsed.data.font}.woff`),
    );
    const pdf = await renderQuote(parsed.data, business, fontBytes, logo);
    const reference = parsed.data.reference
      .replace(/[^\p{L}\p{N}_-]/gu, "-")
      .slice(0, 30);
    return {
      pdf: Buffer.from(pdf).toString("base64"),
      filename: `Cotizacion-${reference}.pdf`,
    };
  } catch (error) {
    if (error instanceof QuoteLayoutError) return { error: error.message };
    return {
      error:
        "No pudimos generar el PDF. Verifica el logo de tu negocio y vuelve a intentarlo.",
    };
  }
}
