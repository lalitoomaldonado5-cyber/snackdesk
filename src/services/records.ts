"use server";
import {
  clientSchema,
  eventSchema,
  paymentSchema,
  expenseSchema,
  packageSchema,
  uuid,
} from "@/lib/validation";
import { validated, safeDbError, finish } from "@/lib/action-helpers";
import { requireSession } from "@/lib/session";
import type { ActionState, Client } from "@/types/domain";
import { revalidatePath } from "next/cache";

export async function createClientInline(
  form: FormData,
): Promise<{ client?: Client; error?: string }> {
  const v = await validated(form, clientSchema);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...v.values, business_id: businessId })
    .select("*")
    .single();
  if (error) return { error: safeDbError(error) };
  revalidatePath("/clients");
  return { client: data };
}
export async function saveClient(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const v = await validated(form, clientSchema);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const query = v.id
    ? supabase
        .from("clients")
        .update(v.values)
        .eq("id", v.id)
        .eq("business_id", businessId)
    : supabase.from("clients").insert({ ...v.values, business_id: businessId });
  const { error } = await query.select("id").single();
  if (error) return { error: safeDbError(error) };
  finish("/clients");
}
export async function saveEvent(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const v = await validated(form, eventSchema);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const query = v.id
    ? supabase
        .from("events")
        .update(v.values)
        .eq("id", v.id)
        .eq("business_id", businessId)
    : supabase.from("events").insert({ ...v.values, business_id: businessId });
  const { data, error } = await query.select("id").single();
  if (error) return { error: safeDbError(error) };
  finish(`/events/${data.id}`);
}
export async function savePayment(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const v = await validated(form, paymentSchema);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const query = v.id
    ? supabase
        .from("payments")
        .update(v.values)
        .eq("id", v.id)
        .eq("business_id", businessId)
    : supabase
        .from("payments")
        .insert({ ...v.values, business_id: businessId });
  const { error } = await query.select("id").single();
  if (error) return { error: safeDbError(error) };
  finish(`/events/${v.values.event_id}`);
}
export async function saveExpense(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const v = await validated(form, expenseSchema);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const query = v.id
    ? supabase
        .from("expenses")
        .update(v.values)
        .eq("id", v.id)
        .eq("business_id", businessId)
    : supabase
        .from("expenses")
        .insert({ ...v.values, business_id: businessId });
  const { error } = await query.select("id").single();
  if (error) return { error: safeDbError(error) };
  finish(v.values.event_id ? `/events/${v.values.event_id}` : "/expenses");
}
export async function savePackage(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const v = await validated(form, packageSchema, true);
  if (!v.ok) return { error: v.error };
  const { supabase, businessId } = v.session;
  const query = v.id
    ? supabase
        .from("service_packages")
        .update(v.values)
        .eq("id", v.id)
        .eq("business_id", businessId)
    : supabase
        .from("service_packages")
        .insert({ ...v.values, business_id: businessId });
  const { error } = await query.select("id").single();
  if (error) return { error: safeDbError(error) };
  finish("/settings");
}
export async function deleteRecord(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, businessId } = await requireSession();
  const id = uuid.safeParse(form.get("id"));
  const table = form.get("table");
  if (
    !id.success ||
    (table !== "clients" &&
      table !== "events" &&
      table !== "payments" &&
      table !== "expenses")
  )
    return { error: "Solicitud inválida." };
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id.data)
    .eq("business_id", businessId)
    .select("id")
    .single();
  if (error) return { error: safeDbError(error) };
  finish(`/${table}`);
}
