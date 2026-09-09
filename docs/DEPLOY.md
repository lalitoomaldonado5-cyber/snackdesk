# Publicar Snackdesk en Vercel

Estado: preparado para importar, sin despliegue ni cambios de DNS. Primero completa el registro con correo de confirmación en Supabase; las pruebas de esta entrega usaron cuentas confirmadas administrativamente.

1. Configura el envío transaccional de Supabase Auth (SMTP propio si el proveedor predeterminado limita tus destinatarios o cuota). Mantén la confirmación activada y verifica `/register` → correo → `/auth/confirm` → dashboard con una cuenta de prueba. El último intento devolvió `over_email_send_rate_limit`; el registro completo sigue sin aprobarse.
2. En Vercel, importa `lalitoomaldonado5-cyber/snackdesk` y elige la rama `integration/supabase-validation`. Framework **Next.js**, Node **24.x**, Root Directory en la raíz del repositorio, instalación `npm ci`, build `npm run build`. No necesitas `vercel.json` ni claves administrativas.
3. Configura estas variables antes de compilar. Usa valores del entorno de producción, sin comillas:

| Variable                               | Valor                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://yllgcdwbtvsouftcjqbb.supabase.co` (sin `/rest/v1/`)                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública publishable del proyecto; nunca `service_role` ni `sb_secret_…` |
| `NEXT_PUBLIC_SITE_URL`                 | URL HTTPS estable asignada al proyecto Vercel, sin barra final                |

4. En Supabase **Authentication → URL Configuration**, establece Site URL en esa misma URL HTTPS y añade `https://TU_DOMINIO/auth/confirm` a Redirect URLs. La plantilla de confirmación SSR está en el README. Los redirects locales configurados son `http://127.0.0.1:3000/auth/confirm` y `http://localhost:3000/auth/confirm`.
5. Despliega y prueba registro, confirmación, login/logout, persistencia y carga de logo desde un navegador normal. Si cambia `NEXT_PUBLIC_SITE_URL`, vuelve a desplegar: las variables públicas se incorporan al build. Para previews independientes usa una URL explícita permitida; no abras un comodín global en Auth.

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
