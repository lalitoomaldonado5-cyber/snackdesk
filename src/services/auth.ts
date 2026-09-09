"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, siteUrl } from "@/lib/env";
import { loginSchema, registerSchema, formObject } from "@/lib/validation";
import type { ActionState } from "@/types/domain";
import { registrationError } from "@/lib/auth-errors";
export async function login(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!hasSupabaseConfig())
    return { error: "Primero configura Supabase siguiendo el README." };
  const parsed = loginSchema.safeParse(formObject(form));
  if (!parsed.success) return { error: "Revisa tu correo y contraseña." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error:
        "No pudimos iniciar sesión. Revisa tus datos y confirma tu correo si acabas de registrarte.",
    };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
export async function register(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!hasSupabaseConfig())
    return { error: "Primero configura Supabase siguiendo el README." };
  const parsed = registerSchema.safeParse(formObject(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, full_name, business_name } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, business_name },
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
    },
  });
  if (error)
    return {
      error: registrationError(error.code),
    };
  if (!data.session)
    return {
      success:
        "Revisa tu correo para confirmar tu cuenta. Después podrás entrar a tu negocio. Si ya tenías cuenta, inicia sesión.",
    };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
export async function logout() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
