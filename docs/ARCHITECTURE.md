# Arquitectura y reglas del MVP

Una aplicación Next.js con App Router. Supabase aporta Auth, PostgreSQL y un bucket privado para logos. No hay servidor adicional, ORM, integraciones ni claves privilegiadas en la aplicación.

## Flujo de una petición

1. `src/proxy.ts` verifica el JWT y renueva cookies de Supabase SSR.
2. `lib/session.ts` consulta `auth.getUser()` y obtiene el perfil real desde PostgreSQL. Nunca usa `business_id` o `role` de formularios ni de metadata del usuario para autorizar.
3. Las páginas leen los datos mediante `services/workspace.ts`, usando el JWT del usuario y filtros explícitos por negocio. Los datos no se comparten mediante caché global; `React.cache` deduplica solo dentro de una petición. Rutas privadas dinámicas y respuestas `private, no-store`.
4. Los formularios llaman Server Actions; Zod valida y descarta campos no declarados. Next.js comprueba el origen de las acciones. Cada acción vuelve a verificar la sesión.
5. PostgreSQL aplica privilegios, RLS, claves foráneas compuestas y reglas financieras a TODAS las peticiones, incluso si alguien usa directamente la API REST de Supabase.

## Directorios

```text
src/app/                 Rutas públicas y privadas, estados de carga/error
src/components/          Layout, tablas, formularios y piezas de interfaz
src/hooks/               Paginación de las listas
src/lib/                 Sesión, clientes Supabase, validación y cálculos
src/services/            Consultas, autenticación y acciones de escritura
src/types/               Tipos de dominio y contrato de base de datos
supabase/migrations/     Esquema, seguridad, triggers y Storage
supabase/seed_demo.sql   Datos opcionales, para un negocio vacío
tests/                   Cálculos, validaciones y pruebas PostgreSQL
scripts/                 Prueba opcional contra Supabase real
docs/                    Arquitectura, seguridad y validación
```

## Modelo de datos

| Tabla            | Relación y uso                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| businesses       | Negocio principal. UUID, nombre, teléfono y referencia privada al logo. |
| profiles         | UUID de Auth, un `business_id`, nombre y rol `owner/member`.            |
| clients          | Cliente de un negocio. Un cliente puede tener muchos eventos.           |
| events           | Evento del negocio. FK `(business_id, client_id)` al cliente.           |
| payments         | Movimientos positivos de un evento. FK `(business_id, event_id)`.       |
| expenses         | Gastos positivos. Evento opcional mediante FK compuesta.                |
| service_packages | Catálogo independiente por negocio, precio y disponibilidad.            |

Todos los identificadores son UUID. Fechas operativas: `date`; hora del evento: `time`; auditoría: `timestamptz`; importes: `numeric(10,2)`. Índices por negocio, fecha, estado y referencias. `updated_at` se actualiza mediante triggers en tablas que lo incluyen. El trigger de Auth crea negocio y propietario dentro de la misma transacción del registro.

`logo_url` conserva el nombre solicitado, pero guarda una **ruta privada** (`business_uuid/logo`), nunca un URL público arbitrario. El servidor firma temporalmente esa ruta. El propietario puede reemplazar el logo, PNG/JPG/WebP de hasta 2 MB; se comprueba su firma de archivo. No se aceptan SVG ni URLs de terceros.

## Definiciones de los números

- Moneda única: MXN. Calendario operativo: America/Mexico_City. No se convierten fechas del evento a UTC para presentarlas; se conserva su día calendario.
- **Ventas del mes:** total de eventos con fecha en el mes y estado `reserved`, `paid` o `completed`. Las cotizaciones y cancelaciones no cuentan como ventas.
- **Eventos del mes:** eventos del mes, incluidos cotizados, excluidos cancelados.
- **Pendiente por cobrar:** total menos todos los pagos de cada evento confirmado, incluyendo eventos pasados/futuros. Excluye cotizados y cancelados.
- **Ganancia estimada mensual:** ventas del mes menos gastos con `expense_date` en ese mes, incluidos gastos generales y gastos asociados a cualquier evento. Es una aproximación operativa, no contabilidad devengada ni flujo de caja.
- **Utilidad de un evento:** total del evento menos sus gastos vinculados, independientemente del mes. No reparte gastos generales. En cotizaciones/cancelaciones se muestra como estimado, sin sumarlo a ventas.
- **Saldo del evento:** total menos todos sus pagos, cualquiera que sea la fecha del pago. No se persisten columnas de saldo, pagado o utilidad.
- JavaScript suma importes en centavos para evitar diferencias de coma flotante.

## Estados y edición

Al registrar un pago, una cotización pasa a apartado; al cubrir el total, pasa a pagado. Completado y cancelado se conservan. Si se corrige/elimina un pago de un evento pagado y reaparece saldo, vuelve a apartado. Las transiciones ocurren en PostgreSQL, incluso fuera de la interfaz.

No se permite marcar como pagado sin cubrir el total, cobrar de más, bajar el total por debajo de lo cobrado ni registrar/modificar pagos en eventos cancelados. Para corregir un pago de un evento cancelado, primero reactiva el evento. El tipo `final` describe el movimiento; por sí mismo no fuerza un estado si no cubre el total.

Un pago no cambia de evento: si se asignó mal, se elimina con confirmación y se registra de nuevo. Los pagos y gastos pueden editarse y eliminarse. No se borran en cascada clientes con eventos ni eventos con pagos/gastos; resuelve las referencias o conserva el evento cancelado. No se implementan reembolsos ni historial de auditoría en esta fase.

## Decisiones deliberadas

- Un usuario pertenece a un negocio. Los empleados futuros encajan en `profiles`; no hay invitaciones ni gestión de equipo todavía.
- Lecturas paginadas a la API para no cortar a 1,000 filas; filtros y paginación visible en el cliente. Para volúmenes grandes, mover consultas y agregaciones a SQL por página será la siguiente optimización. Esta base está pensada para negocios pequeños.
- Las distintas consultas del dashboard no son una fotografía transaccional única: una escritura simultánea de otro miembro puede requerir refrescar para ver todos los números alineados.
- Tipos de base de datos explícitos, mantenidos junto con las migraciones. Se pueden regenerar con Supabase CLI más adelante.
- No hay librería de gráficas: dos barras accesibles bastan para comparar ventas y gastos.
- `next.config.ts` usa dos workers en threads y el verificador TypeScript por API para compilar en este entorno Windows restringido. No se omiten verificaciones de tipos. Se puede volver a los valores por defecto al cambiar de entorno.
- ESLint 9.39.5 y TypeScript 5.9.3 están fijados por compatibilidad con el plugin React incluido en Next 16.3.4. ESLint 10 y TypeScript 7 rompían el lint en esta combinación; revisar el soporte antes de actualizarlos.
- No se implementó recuperación de contraseña, MFA, auditoría, borrado de negocio, reembolsos ni gestión de empleados. No eran parte del flujo solicitado.
- Cambiar el logo y actualizar el negocio son dos operaciones (Storage y PostgreSQL). Si la segunda falla, se puede reintentar; no hay una transacción distribuida. La ruta fija evita acumular archivos huérfanos.

## Referencias del stack

- [Instalación de Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase Auth para renderizado en servidor](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Control de acceso de Storage](https://supabase.com/docs/guides/storage/security/access-control)
