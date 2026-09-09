"use server";
import { validated, safeDbError, finish } from "@/lib/action-helpers";
import { businessSchema } from "@/lib/validation";
import type { ActionState } from "@/types/domain";
function detectImage(bytes: Uint8Array) {
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    Buffer.from(bytes.slice(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.slice(8, 12)).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function saveBusiness(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const v = await validated(form, businessSchema, true);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const file = form.get("logo");
  let logoPath: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024)
      return { error: "El logo debe pesar menos de 2 MB." };
    const buffer = new Uint8Array(await file.arrayBuffer());
    const mime = detectImage(buffer);
    if (!mime || mime !== file.type)
      return { error: "Usa un archivo PNG, JPG o WebP válido." };
    logoPath = `${businessId}/logo`;
    const { error } = await supabase.storage
      .from("business-logos")
      .upload(logoPath, buffer, {
        contentType: mime,
        upsert: true,
        cacheControl: "0",
      });
    if (error)
      return {
        error:
          "No se pudo subir el logo. Revisa el tamaño y la migración de Storage.",
      };
  }
  const { error } = await supabase
    .from("businesses")
    .update({ ...v.values, ...(logoPath ? { logo_url: logoPath } : {}) })
    .eq("id", businessId)
    .select("id")
    .single();
  if (error) return { error: safeDbError(error) };
  finish("/settings?saved=1");
}
