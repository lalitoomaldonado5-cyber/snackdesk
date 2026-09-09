import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { hasSupabaseConfig } from "./env";
export const requireSession = cache(async () => {
  if (!hasSupabaseConfig()) redirect("/setup");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError || !profile)
    throw new Error(
      "No se pudo cargar el perfil del negocio. Verifica la migración de Supabase.",
    );
  return { supabase, user, profile, businessId: profile.business_id };
});
