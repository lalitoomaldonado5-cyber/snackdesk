# Validación de Snackdesk

Fecha: 9 de septiembre de 2026. Windows, Node 24, Next.js 16.3.4. Proyecto Supabase real conectado; pruebas con clave pública y sesiones de dos propietarios temporales.

**Estado: PARCIAL.** La operación con cuentas confirmadas, la persistencia y el aislamiento pasan. Falta validar registro con entrega/confirmación de correo y completar la subida desde el selector del navegador. No se ha desplegado en Vercel.

## Estado inicial e integración

La aplicación ya tenía Auth, CRUD, cálculos, RLS, Storage y build funcionales. Supabase estaba vacío: no existían las tablas, funciones, políticas ni bucket del MVP. Se ejecutaron en orden, sin modificar sus definiciones:

1. `202609020001_core.sql`: siete tablas, índices, restricciones, triggers y políticas.
2. `202609020002_storage.sql`: bucket privado `business-logos` y cuatro políticas de Storage.

Se comprobaron UUID, FKs compuestas, constraints, timestamps, índices, funciones con `search_path` vacío, permisos y triggers. El esquema remoto coincide con las migraciones; no se encontró una corrección estructural que justificara otra migración. Las siete tablas tienen RLS y hay 24 políticas públicas más cuatro de Storage. El bucket admite PNG/JPEG/WebP hasta 2 MB.

Las migraciones se aplicaron por SQL Editor. Su registro en el historial de Supabase CLI está pendiente; no se debe volver a ejecutar el DDL. [DEPLOY.md](DEPLOY.md) indica cómo registrar las dos versiones ya aplicadas.

## Cambios de código

- Validación de la URL base de Supabase: rechaza `/rest/v1/`, credenciales embebidas y HTTP remoto.
- Mensajes de registro para límite de envío, dirección inválida y destinatario no autorizado, sin revelar si una cuenta existe.
- Prueba remota ampliada: CRUD, cálculos, pagos múltiples, paquetes, configuración, sesiones, Storage y ataques en ambos sentidos. Los fallos de red no se aceptan como prueba de denegación.
- Nuevas pruebas de atomicidad de registro y cálculos entre meses, con pagos/gastos múltiples y valores cero. La suite descubre todas las migraciones SQL en orden.
- Lanzador Windows portable: busca Node en PATH, comprueba que exista el build y abre `/login`.

## Comandos ejecutados

| Comprobación                                            | Resultado                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run lint`                                          | PASS, sin warnings de ESLint                                                   |
| `npm run typecheck`                                     | PASS                                                                           |
| `npm test`                                              | 14/14 PASS                                                                     |
| `npm run test:db`                                       | 13/13 PASS según el reporte de Node: 12 casos y la prueba contenedora          |
| `npm run build`                                         | PASS, todas las rutas compiladas                                               |
| `npm run check`                                         | PASS de principio a fin después de los cambios de código                       |
| `npm run test:rls:remote` / su comando Node equivalente | PASS contra Supabase real; ejecución final después de endurecer las aserciones |
| `npm audit --omit=dev`                                  | 0 vulnerabilidades reportadas en producción en esta fecha                      |
| `git diff --check`                                      | PASS                                                                           |

La instalación inicial en este entorno usó `npm ci --ignore-scripts` porque el sandbox bloqueó un postinstall con `spawn EPERM`. Los binarios de plataforma disponibles permitieron lint y build. Fuera de este entorno, las instrucciones mantienen `npm ci` estándar; no se afirma haber validado aquí los scripts omitidos.

## Auth y sesión reales

- Se crearon dos usuarios confirmados administrativamente, con autorización explícita. El trigger creó un negocio independiente y un perfil owner para cada uno.
- Login, contraseña incorrecta, dashboard, logout y nuevo login probados en navegador. Los datos persistieron tras volver a entrar y reabrir una pestaña.
- Una ruta privada sin sesión redirigió a `/login`.
- Renovación del token comprobada por API. No se esperó el vencimiento natural de una cookie del navegador.
- Registrar otra vez el email A produjo una respuesta sin sesión ni identidades nuevas; la base siguió con dos usuarios, dos negocios y dos perfiles, sin duplicados.
- La suite PostgreSQL inyectó fallos en la creación del negocio y del perfil: ambos revierten toda el alta, incluido `auth.users`. Estas inyecciones se hicieron en PGlite, no en la base remota.
- **Pendiente:** registro público con correo real. Supabase respondió `over_email_send_rate_limit`; los intentos fallidos no dejaron usuarios, negocios ni perfiles parciales. No se desactivó la confirmación de email. Se necesita resolver envío/cuota y probar el enlace de confirmación antes de aprobar el cierre.

## Flujo funcional por interfaz

Probados en Supabase: crear/editar cliente y evento; anticipo de $1,500 y otro pago de $1,000 sobre total $3,800; gasto relacionado de $650 y general de $100; crear/editar paquete, desactivarlo y reactivarlo; cambiar nombre del negocio; salir y entrar nuevamente.

| Indicador observado              | Resultado |
| -------------------------------- | --------- |
| Total pagado                     | $2,500    |
| Saldo pendiente del evento       | $1,300    |
| Gastos del evento                | $650      |
| Utilidad del evento              | $3,150    |
| Ventas del mes                   | $3,800    |
| Eventos del mes                  | 1         |
| Gastos del mes, incluido general | $750      |
| Ganancia estimada mensual        | $3,050    |

El evento apareció en próximos eventos y pagos pendientes. Los importes y datos siguieron iguales después de logout/login. La eliminación pidió confirmación y rechazó correctamente borrar el evento con pagos/gastos relacionados. Mensajes de éxito/error y estados vacíos observados. En vista móvil, menú operativo y sin desbordamiento horizontal de la página (ancho útil medido: 375 px). No se observaron errores de consola en las pantallas revisadas en Chrome.

## Aislamiento y Storage

La API directa con JWT de A y B comprobó, en ambos sentidos, lectura por lista/UUID, modificación, eliminación y altas con `business_id` ajeno en clientes, eventos, pagos, gastos y paquetes. También rechazó cambios de rol/negocio del perfil, edición del negocio ajeno y referencias cruzadas al insertar y editar clientes/eventos/pagos/gastos.

La prueba de pagos simultáneos permitió únicamente uno de dos pagos que juntos excedían el saldo, con rechazo financiero explícito del otro. El rol anónimo no obtuvo datos. En navegador, B vio indicadores vacíos y recibió 404 al abrir el UUID del evento A.

Storage: upload, reemplazo, descarga y URL firmada del logo propio pasaron por API. La URL pública directa fue rechazada. B no pudo listar, firmar, descargar, reemplazar ni borrar el logo de A; se verificó que sus bytes permanecían intactos, y viceversa.

**Pendiente del navegador:** el selector integrado no adjuntó el archivo. Chrome devolvió `Not allowed` al seleccionar el archivo porque la extensión requiere permiso para URLs de archivo. No se cambió ese permiso. La subida desde el formulario de Configuración queda sin aprobar aunque Storage por API sí pasó. Para habilitar la prueba, consulta [carga de archivos con la extensión](https://developers.openai.com/codex/app/chrome-extension#upload-files).

## Seguridad y limpieza

No se encontraron fugas entre empresas en los casos probados. El asesor de Supabase conserva una advertencia: protección de contraseñas filtradas deshabilitada. Revisa su disponibilidad en el plan y [la configuración recomendada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Los avisos de índices sin uso son informativos para una base nueva; no se eliminaron índices.

Se revocaron las sesiones y se eliminaron únicamente los dos usuarios temporales autorizados y sus negocios/datos. Verificación posterior: cero usuarios, perfiles, negocios, clientes, eventos, pagos, gastos, paquetes y objetos del bucket; el proyecto estaba vacío antes de las pruebas. Las siete tablas con RLS y las 24 políticas públicas siguen presentes.

`.env.local` conserva solamente las tres variables públicas de la aplicación, permanece ignorado y ya no contiene contraseñas `RLS_TEST_*`. No se copiaron ni subieron claves administrativas. El script remoto necesita nuevas cuentas temporales autorizadas para futuras ejecuciones.

## Git y despliegue

Repositorio de entrega: `lalitoomaldonado5-cyber/snackdesk`, rama segura `integration/supabase-validation`. El repositorio fue creado público por su propietario; no se cambió su visibilidad. Solo se publica código, migraciones, lockfile y documentación, sin credenciales ni datos de prueba.

Vercel no está conectado. Las variables, configuración de Auth, importación de la rama y verificación posterior están en [DEPLOY.md](DEPLOY.md). No se hizo deploy ni se modificó DNS. Quedan como deuda la validación del correo, la carga por formulario, el registro del historial CLI y, para crecimiento posterior, consultas paginadas en servidor. No se agregaron módulos fuera del MVP.
