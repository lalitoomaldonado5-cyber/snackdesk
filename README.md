# Snackdesk

Base funcional de un SaaS multiempresa para pequeños negocios de eventos y barras de snacks. Next.js 16.3.4, React 19, TypeScript, Tailwind CSS 4, Lucide y Supabase (Auth + PostgreSQL + Storage privado para logos).

Incluye registro, login/logout, sesión persistente, aislamiento por negocio, dashboard, clientes, eventos y su detalle financiero, pagos, gastos, configuración y paquetes. No incluye integraciones ni funciones de fases posteriores.

## Estado de esta entrega

Integrado y probado contra Supabase real el 9 de septiembre de 2026: datos persistentes, cálculos, configuración, Storage privado y aislamiento entre dos empresas por API. Las dos migraciones ya están aplicadas en el proyecto de esta entrega. **No vuelvas a ejecutarlas allí.** Consulta [VALIDATION.md](docs/VALIDATION.md) para los resultados y límites de la prueba.

Estado de cierre: **PARCIAL**. El registro con envío y confirmación de correo sigue pendiente: Supabase rechazó el envío por límite de correo. Las pruebas operativas usaron dos cuentas temporales confirmadas administrativamente, con autorización. El despliegue en Vercel aún no se ha realizado; sigue [DEPLOY.md](docs/DEPLOY.md) después de validar el correo.

Sin configurar Supabase, las rutas privadas llevan a `/setup`; no hay autenticación simulada. `/demo` es una vista pública de lectura con datos ficticios y no guarda cambios.

## 1. Requisitos

- Node.js **24 LTS** con npm (instalación estándar de [Node.js](https://nodejs.org/)). Comprueba `node --version` y `npm --version` en una terminal nueva.
- [Git](https://git-scm.com/) para versionar y subir el proyecto.
- Cuenta de [Supabase](https://supabase.com/) para guardar datos.
- Más adelante, cuentas de GitHub y Vercel si quieres publicarlo.

No necesitas instalar PostgreSQL, Docker ni Supabase CLI para la ruta sencilla de esta guía. Las pruebas de base de datos incluidas corren localmente en PostgreSQL embebido.

## 2. Abrir el proyecto y verlo localmente

Abre una terminal en la carpeta que contiene este README y `package.json`:

```bash
npm ci
npm run dev
```

Abre [localhost:3000](http://localhost:3000). Mientras no haya configuración, verás los primeros pasos. En [localhost:3000/demo](http://localhost:3000/demo) puedes revisar el dashboard y las listas de ejemplo. Es solo una vista de lectura: sirve para conocer la interfaz, no para probar autenticación ni persistencia.

En Windows también puedes abrir `ABRIR_SNACKDESK.cmd` con doble clic después de compilar. Inicia el servidor y abre el login en el navegador. Mantén esa ventana abierta mientras uses la aplicación. `127.0.0.1` corresponde a tu computadora: si detienes el servidor, ese enlace deja de responder.

Para detener el servidor, pulsa `Ctrl+C` en esa terminal.

## 3. Crear el proyecto de Supabase

1. Entra a Supabase, crea una organización si la solicita y selecciona **New project**.
2. Ponle un nombre, por ejemplo `snackdesk-dev`.
3. Elige una contraseña fuerte para la base y guárdala. **No la pegues en el código ni en `.env.local`**: la aplicación no la necesita.
4. Escoge una región cercana y espera a que termine la creación.
5. En **Project Settings / API** (o el diálogo **Connect**), copia la **Project URL** y la **Publishable key**. Si tu proyecto usa las claves anteriores, puedes usar la clave pública `anon` en la misma variable.

Nunca uses `service_role` ni `sb_secret_…` como clave pública. Las políticas RLS se prueban con la clave pública y el JWT del usuario.

## 4. Crear tablas y políticas con migraciones

En el proyecto de Supabase, abre **SQL Editor → New query**:

1. Abre `supabase/migrations/202609020001_core.sql`, copia todo su contenido y ejecútalo. Crea las siete tablas, restricciones, índices, triggers y políticas RLS.
2. En otra consulta, ejecuta `supabase/migrations/202609020002_storage.sql`. Crea el bucket privado `business-logos` y sus políticas.

Ejecuta cada archivo **una sola vez, en ese orden**, sobre un proyecto nuevo. Ambos usan transacciones: si hay un error, esa migración se revierte. No tienes que crear tablas manualmente. La segunda migración también es necesaria si inicialmente no vas a subir un logo.

Opcionalmente, si después quieres administrar migraciones desde terminal con Supabase CLI:

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase migration repair --status applied 202609020001
npx supabase migration repair --status applied 202609020002
```

Los dos comandos `repair` se usan **solo si ya ejecutaste ambos archivos en SQL Editor**, para registrar ese hecho. Si el proyecto está vacío y prefieres aplicar todo por CLI, omite los `repair` y ejecuta `npx supabase db push`. No uses `db reset` sobre una base con datos que quieras conservar.

## 5. Configurar las variables de entorno

En Windows / PowerShell:

```powershell
Copy-Item .env.example .env.local
```

En macOS / Linux:

```bash
cp .env.example .env.local
```

Abre `.env.local` y reemplaza los ejemplos:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable                             | Qué contiene                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL             | URL de tu proyecto Supabase.                                                          |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Clave pública publishable o anon. Se puede exponer al cliente; RLS protege los datos. |
| NEXT_PUBLIC_SITE_URL                 | Origen de esta aplicación; se usa para confirmar correos. Sin barra final.            |

Usa la URL base del proyecto, **sin `/rest/v1/`**. La configuración rechaza rutas API, credenciales dentro de la URL y HTTP fuera de localhost. No hay variables privadas obligatorias. `.env.local` está excluido de Git. Cada vez que cambies estas variables, detén y vuelve a ejecutar `npm run dev`. En producción también debes volver a compilar/desplegar. No reemplaces un `.env.local` existente con el archivo de ejemplo.

## 6. Configurar Auth y crear la primera cuenta

En Supabase:

1. En **Authentication → Providers / Sign In**, habilita email y contraseña, y permite registros.
2. En **Authentication → URL Configuration**, configura **Site URL** como `http://localhost:3000`. Añade `http://localhost:3000/auth/confirm` a **Redirect URLs**.
3. Decide si usarás confirmación de correo:

   - **Pruebas locales rápidas:** puedes desactivar **Confirm email** en tu proyecto de desarrollo. Al registrarte se crea la sesión y entras directamente al dashboard.
   - **Con confirmación:** deja la opción activada. En **Authentication → Email Templates → Confirm signup**, usa este enlace para la confirmación SSR:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
     >Confirmar mi cuenta</a
   >
   ```

   El registro mostrará un aviso para revisar el correo. Al abrir el enlace se valida la cuenta y se crea la sesión. Si tu proyecto requiere configurar el envío de correos para direcciones reales, completa esa configuración de Supabase antes de probarla; no se incorpora ningún proveedor de correo al código del MVP.

4. Abre [localhost:3000/register](http://localhost:3000/register). Escribe tu nombre, nombre del negocio, email y contraseña de al menos 10 caracteres.
5. El trigger de la primera migración crea **un negocio nuevo y un perfil owner** automáticamente. Si algo falla en ese proceso, no se deja una alta parcial.
6. Entra a `/dashboard`. El negocio empezará vacío, sin datos de otras empresas.

No hay contraseñas predeterminadas ni usuarios de prueba creados automáticamente. El rol `member` está previsto en la base, pero las invitaciones y la gestión de empleados se construirán en otra fase.

## 7. Probar el flujo de operación

1. En **Clientes**, crea a Ana Rodríguez con un teléfono.
2. En **Eventos**, crea un evento para Ana por **$3,800**, con fecha en el mes que estés revisando y estado **Apartado**.
3. Abre su detalle y registra un anticipo de **$1,500**.
4. Registra un gasto relacionado de **$650**.
5. El detalle debe mostrar: total **$3,800**, pagado **$1,500**, saldo **$2,300**, gastos **$650** y utilidad estimada **$3,150**.
6. Si es el único evento/gasto del mes, el dashboard mostrará ventas **$3,800**, **1 evento**, pendiente **$2,300** y ganancia **$3,150**.
7. Edita cliente, evento, pago o gasto. Los valores deben recalcularse al guardar. Para cambiar el estado, usa **Editar evento / estado**.
8. Registra la liquidación de **$2,300**: el estado pasa a **Pagado** y el saldo queda en cero.
9. En **Configuración**, cambia el nombre/teléfono, sube un logo y crea o edita paquetes. Solo el propietario puede hacerlo.
10. Refresca o cierra y abre la pestaña: la sesión debe persistir. Usa **Cerrar sesión** en la barra superior para salir.

La eliminación solicita confirmación. Clientes con eventos y eventos con pagos/gastos no se borran en cascada. Las reglas completas de importes y estados están en [Arquitectura](docs/ARCHITECTURE.md).

## 8. Cargar datos demo opcionales

Puedes explorar `/demo` sin instalar datos. Para probar ediciones sobre datos guardados:

1. Crea una cuenta dedicada a pruebas con un negocio vacío.
2. Abre `supabase/seed_demo.sql`.
3. Cambia `owner_email` por el correo de esa cuenta y ejecuta el archivo en SQL Editor.

Solo modifica ese negocio. Se niega a ejecutarse si ya tiene clientes, gastos o paquetes, para no duplicar ni mezclar información. Incluye a Ana Rodríguez, Ximena Torres y Fernanda Ruiz, tres eventos de septiembre de 2026, sus pagos/gastos y dos paquetes. Selecciona **septiembre de 2026** en el dashboard si pruebas en otra fecha. Resultado de ese mes: ventas **$12,700**, **3 eventos**, pendiente **$2,300**, gastos **$2,800**, ganancia estimada **$9,900**. La cotización de $6,800 no suma a ventas.

## 9. Comprobar RLS y calidad

```bash
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

También puedes ejecutar todo con `npm run check`.

`test:db` ejecuta las migraciones reales en PostgreSQL embebido y comprueba ataques entre empresas. Para verificar además tu Supabase real, crea dos cuentas de negocios distintos y añade esto a `.env.local`:

```dotenv
RLS_TEST_EMAIL_A=cuenta-a@tu-dominio.com
RLS_TEST_PASSWORD_A=contraseña_de_prueba_a
RLS_TEST_EMAIL_B=cuenta-b@tu-dominio.com
RLS_TEST_PASSWORD_B=contraseña_de_prueba_b
```

Después ejecuta:

```bash
npm run test:rls:remote
```

El script usa solo claves públicas y sesiones de usuario. Prueba CRUD, pagos múltiples, cálculos, paquetes, configuración, renovación de sesión y Storage binario. Intenta leer, crear, editar y borrar registros ajenos, modificar perfiles y crear relaciones cruzadas en ambos sentidos. También comprueba sobrepagos concurrentes. Crea y limpia sus propios datos temporales y restaura la configuración; conserva tus cuentas y otros registros. Usa negocios de prueba sin logo: el script se niega a reemplazar un logo existente.

La estrategia y los permisos de cada tabla están en [Seguridad](docs/SECURITY.md). El script no comprueba la entrega de correo ni sustituye las pruebas de cookies y formularios en navegador. Los resultados reales de esta entrega están en [VALIDATION.md](docs/VALIDATION.md).

## 10. Subir a GitHub

1. Crea una cuenta de GitHub si no tienes.
2. Crea un repositorio **privado y vacío**, por ejemplo `snackdesk`. No lo inicialices con otro README.
3. En la terminal de este proyecto, usa tu URL real:

```bash
git remote add origin https://github.com/TU_USUARIO/snackdesk.git
git push -u origin main
```

GitHub puede pedirte iniciar sesión. Nunca pegues tokens en el README ni los agregues al repositorio. Si descargaste una copia sin historial Git, primero ejecuta `git init -b main`, `git add .` y `git commit -m "Base inicial de Snackdesk"`.

## 11. Desplegar después en Vercel

1. En Vercel, importa el repositorio de GitHub.
2. Selecciona el framework **Next.js** y Node.js **24.x**.
3. Si subiste esta carpeta como raíz del repositorio, deja **Root Directory** en su valor por defecto. Build: `npm run build`; instalación: `npm ci`.
4. Configura las tres variables de entorno con tu URL/clave pública Supabase y la URL final de la aplicación. Despliega.
5. En Supabase Auth, cambia **Site URL** al dominio HTTPS y añade `https://TU_DOMINIO/auth/confirm` a **Redirect URLs**. Mantén localhost solo si vas a seguir usándolo para desarrollo. En la plantilla de confirmación, `SiteURL` apunta al sitio principal; para separar desarrollo y producción se recomiendan proyectos Supabase distintos.
6. Comprueba el flujo de registro/login, RLS, sesiones, formularios y logos con dos negocios antes de usar datos reales.

Para probar localmente el build de producción:

```bash
npm run build
npm start
```

## Archivos principales y próxima fase

Consulta [la verificación de esta entrega](docs/VALIDATION.md) para distinguir lo comprobado localmente de las pruebas que requieren tu proyecto Supabase.

- `src/proxy.ts`, `src/lib/session.ts`: sesión y protección de rutas.
- `src/services/auth.ts`: registro, login y logout.
- `src/services/records.ts`: validación y operaciones por negocio.
- `src/services/workspace.ts`: lectura de datos bajo RLS.
- `src/lib/finance.ts`: reglas de cálculo sin valores duplicados en la base.
- `src/components/forms/`: formularios reutilizables por entidad.
- `supabase/migrations/`: esquema y seguridad reproducibles.
- `tests/database/isolation.test.ts`: ataques a RLS y restricciones financieras.

El detalle del modelo, estructura y decisiones deliberadas está en [Arquitectura](docs/ARCHITECTURE.md). La siguiente fase puede abordar recuperación de contraseña, invitaciones de empleados o consultas paginadas en servidor, según lo que decidas. No se construyeron WhatsApp, Stripe, inventario, facturación, IA, automatizaciones ni otros módulos posteriores.
