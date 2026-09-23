# Publicar Snackdesk en Vercel

El proyecto `snackdesk` ya está conectado a Vercel. La rama de producción es `integration/supabase-validation`, publicada en `https://project-di6kz.vercel.app`. Las ramas de trabajo generan previews; la publicación de cambios en producción ocurre al integrar en esa rama. No se usa un dominio personalizado.

1. Verifica el envío transaccional de Supabase Auth. Mantén la confirmación activada y prueba `/register` → correo → `/auth/confirm` → dashboard con una cuenta de prueba. El proveedor predeterminado devolvió `over_email_send_rate_limit` en la validación inicial; el registro completo requiere una nueva prueba con correo recibido o configurar SMTP propio si persiste el límite.
2. Antes de integrar cambios en `integration/supabase-validation`, ejecuta `npm run check` y valida el preview. Vercel compila automáticamente los cambios de esa rama con Next.js, Node 24.x, `npm ci` y `npm run build` desde la raíz del repositorio.
3. Estas variables están configuradas para Production y Preview. Comprueba sus nombres y destinos sin publicar la clave:

| Variable                               | Valor                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://yllgcdwbtvsouftcjqbb.supabase.co` (sin `/rest/v1/`)                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública publishable del proyecto; nunca `service_role` ni `sb_secret_…` |
| `NEXT_PUBLIC_SITE_URL`                 | URL HTTPS estable asignada al proyecto Vercel, sin barra final                |

4. En Supabase **Authentication → URL Configuration**, usa `https://project-di6kz.vercel.app` como Site URL y permite `https://project-di6kz.vercel.app/auth/confirm` en Redirect URLs. La plantilla de confirmación SSR está en el README. Los redirects locales configurados son `http://127.0.0.1:3000/auth/confirm` y `http://localhost:3000/auth/confirm`.
5. Tras publicar, prueba registro, confirmación, login/logout, rutas protegidas, cotizaciones PDF y carga de logos desde la URL de producción. Si cambia `NEXT_PUBLIC_SITE_URL`, vuelve a desplegar: las variables públicas se incorporan al build. Para previews independientes usa una URL explícita permitida; no abras un comodín global en Auth.

No añadas `RLS_TEST_*` a Vercel. Las cuentas temporales sirven únicamente para validar y deben limpiarse después. No uses datos reales hasta cerrar los pendientes de [VALIDATION.md](VALIDATION.md).

## Historial de migraciones

Las migraciones `202609020001_core.sql` y `202609020002_storage.sql` ya se ejecutaron en SQL Editor y el esquema remoto se comprobó contra sus definiciones. SQL Editor no registró entradas en el historial de Supabase CLI. **No vuelvas a ejecutar el DDL ni uses `db reset`.** Antes del siguiente despliegue de base desde CLI, autentícate y registra lo que ya está aplicado:

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref yllgcdwbtvsouftcjqbb
npx supabase migration repair --status applied 202609020001
npx supabase migration repair --status applied 202609020002
npx supabase migration list
```

Si ya existe `supabase/config.toml`, omite `init`. Estos pasos pendientes requieren la sesión CLI del propietario; no se almacenaron tokens administrativos en el proyecto. Las futuras correcciones estructurales deben ser nuevas migraciones.
