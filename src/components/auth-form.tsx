"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { login, register } from "@/services/auth";
import { AuthCarousel } from "./auth-carousel";
import { Brand } from "./design/brand";
import { Alert, Button } from "./design/primitives";

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
  const [visible, setVisible] = useState(false);
  return (
    <main className="sd-v2 sd-auth">
      <AuthCarousel />
      <div className="sd-mobile-brand">
        <Brand />
        <span>Tu negocio, en orden.</span>
      </div>
      <section className="sd-auth-side" aria-labelledby="auth-heading">
        <div className="sd-auth-card">
          <span className="sd-eyebrow">
            {isRegister ? "Un nuevo comienzo" : "Bienvenido a tu espacio"}
          </span>
          <h1 id="auth-heading">
            {isRegister ? (
              "Dale un lugar a tu negocio."
            ) : (
              <>
                Qué bueno
                <br />
                verte de nuevo.
              </>
            )}
          </h1>
          <p>
            {isRegister
              ? "Crea tu cuenta y empieza a organizar tus eventos, a tu manera."
              : "Tus eventos, tus clientes y tus próximos grandes momentos. Todo está aquí."}
          </p>
          <form action={action} className="sd-auth-form" aria-busy={pending}>
            {isRegister && (
              <>
                <div className="sd-field">
                  <label htmlFor="full_name">Tu nombre</label>
                  <input
                    id="full_name"
                    name="full_name"
                    autoComplete="name"
                    maxLength={150}
                    required
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div className="sd-field">
                  <label htmlFor="business_name">Nombre del negocio</label>
                  <input
                    id="business_name"
                    name="business_name"
                    autoComplete="organization"
                    maxLength={150}
                    required
                    placeholder="Así se llama tu barra"
                  />
                </div>
              </>
            )}
            <div className="sd-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                placeholder="tu@negocio.com"
              />
            </div>
            <div className="sd-field">
              <label htmlFor="password">Contraseña</label>
              <div className="sd-password">
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  minLength={isRegister ? 10 : 1}
                  maxLength={128}
                  required
                  placeholder={
                    isRegister
                      ? "Crea una contraseña segura"
                      : "Escribe tu contraseña"
                  }
                  aria-describedby={isRegister ? "password-hint" : undefined}
                />
                <button
                  type="button"
                  aria-label={
                    visible ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={visible}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isRegister && (
                <small id="password-hint">Al menos 10 caracteres.</small>
              )}
            </div>
            {!configured && (
              <Alert>
                Conecta Supabase para usar tu cuenta.{" "}
                <Link href="/setup">Ver instrucciones</Link>.
              </Alert>
            )}
            {confirmationError && (
              <Alert tone="error">
                El enlace de confirmación no es válido o expiró. Intenta iniciar
                sesión o solicita un nuevo registro.
              </Alert>
            )}
            {state.error && <Alert tone="error">{state.error}</Alert>}
            {state.success && <Alert tone="success">{state.success}</Alert>}
            <Button disabled={pending || !configured} type="submit">
              <span>
                {pending
                  ? "Un momento…"
                  : isRegister
                    ? "Crear mi cuenta"
                    : "Iniciar sesión"}
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </form>
          <p className="sd-auth-switch">
            {isRegister
              ? "¿Ya eres parte de Snackdesk?"
              : "¿Tu negocio es nuevo por aquí?"}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Inicia sesión" : "Crea tu cuenta"}
            </Link>
          </p>
        </div>
        <div className="sd-auth-foot">
          <span>Hecho para quienes crean momentos.</span>
          <span>Snackdesk</span>
        </div>
      </section>
    </main>
  );
}
