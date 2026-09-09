"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Layers3 } from "lucide-react";
import { login, register } from "@/services/auth";
import { Field, Notice } from "./ui";
export function AuthForm({
  mode,
  configured,
  confirmationError = false,
}: {
  mode: "login" | "register";
  configured: boolean;
  confirmationError?: boolean;
}) {
  const isRegister = mode === "register";
  const [state, action, pending] = useActionState(
    isRegister ? register : login,
    {},
  );
  return (
    <main className="auth-layout">
      <section className="auth-brand">
        <Link href="/login" className="brand">
          <span className="brand-mark">
            <Layers3 size={22} />
          </span>
          snackdesk<span className="brand-dot">.</span>
        </Link>
        <div className="auth-pitch">
          <span className="eyebrow">
            MENOS ADMINISTRACIÓN. MÁS CELEBRACIONES.
          </span>
          <h1>
            Tu próximo gran evento
            <br />
            empieza en orden.
          </h1>
          <p>
            Clientes, eventos y números. Todo lo que necesitas para llevar tu
            barra de snacks, en un solo lugar.
          </p>
          <div className="auth-points">
            {[
              "Cada cliente, bien atendido",
              "Cada evento, bajo control",
              "Tus números, siempre claros",
            ].map((t) => (
              <div key={t}>
                <Check size={17} />
                {t}
              </div>
            ))}
          </div>
        </div>
        <span className="auth-footer">
          Un espacio para hacer crecer lo que te gusta.
        </span>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <span className="eyebrow">BIENVENIDO A SNACKDESK</span>
          <h2>
            {isRegister
              ? "Dale un lugar a tu negocio"
              : "Qué bueno verte de nuevo"}
          </h2>
          <p>
            {isRegister
              ? "Crea tu cuenta y empieza a organizar tus eventos."
              : "Inicia sesión para continuar con tu día."}
          </p>
          {!configured && (
            <Notice>
              Conecta Supabase para usar tu cuenta.{" "}
              <Link href="/setup">Ver instrucciones</Link>.
            </Notice>
          )}
          {confirmationError && (
            <Notice tone="error">
              El enlace de confirmación no es válido o expiró. Intenta iniciar
              sesión o solicita un nuevo registro.
            </Notice>
          )}
          <form action={action} className="form-stack">
            {isRegister && (
              <>
                <Field label="Tu nombre">
                  <input
                    name="full_name"
                    autoComplete="name"
                    maxLength={150}
                    required
                    placeholder="Nombre y apellido"
                  />
                </Field>
                <Field label="Nombre del negocio">
                  <input
                    name="business_name"
                    autoComplete="organization"
                    maxLength={150}
                    required
                    placeholder="Yummy Gummy Snack Bar"
                  />
                </Field>
              </>
            )}
            <Field label="Correo electrónico">
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                placeholder="tu@negocio.com"
              />
            </Field>
            <Field
              label="Contraseña"
              hint={isRegister ? "Al menos 10 caracteres." : undefined}
            >
              <input
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 10 : 1}
                maxLength={128}
                required
                placeholder="Escribe tu contraseña"
              />
            </Field>
            {state.error && <Notice tone="error">{state.error}</Notice>}
            {state.success && <Notice tone="success">{state.success}</Notice>}
            <button
              className="button primary full-width"
              disabled={pending || !configured}
            >
              {pending
                ? "Un momento…"
                : isRegister
                  ? "Crear mi cuenta"
                  : "Iniciar sesión"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {isRegister
              ? "¿Ya tienes cuenta?"
              : "¿Tu negocio es nuevo por aquí?"}{" "}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Inicia sesión" : "Crea tu cuenta"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
