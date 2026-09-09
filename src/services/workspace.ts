import "server-only";
import { cache } from "react";
import { requireSession } from "@/lib/session";
import type { Workspace } from "@/types/domain";
// Explicit paging avoids Supabase's default 1,000-row response truncation.
async function allRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const { data, error } = await fetchPage(rows.length, rows.length + 999);
    if (error)
      throw new Error("No se pudo consultar la información del negocio.");
    if (!data?.length) return rows;
    rows.push(...data);
  }
}
export const getWorkspace = cache(async (): Promise<Workspace> => {
  const { supabase, businessId, user, profile } = await requireSession();
  const [businessResult, clients, events, payments, expenses, packages] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).single(),
      allRows((from, to) =>
        supabase
          .from("clients")
          .select("*")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("events")
          .select("*")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("payments")
          .select("*")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("expenses")
          .select("*")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      ),
      allRows((from, to) =>
        supabase
          .from("service_packages")
          .select("*")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      ),
    ]);
  if (businessResult.error || !businessResult.data)
    throw new Error("No se pudo consultar el negocio.");
  const business = businessResult.data;
  let logoSrc: string | null = null;
  if (business.logo_url) {
    const { data } = await supabase.storage
      .from("business-logos")
      .createSignedUrl(business.logo_url, 3600);
    logoSrc = data?.signedUrl || null;
  }
  return {
    business,
    profile,
    email: user.email || "",
    logoSrc,
    clients,
    events,
    payments,
    expenses,
    packages,
  };
});
