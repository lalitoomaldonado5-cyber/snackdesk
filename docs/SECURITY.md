# Seguridad multiempresa y cómo verificarla

## Modelo de acceso

La aplicación usa exclusivamente la URL y la clave pública publishable/anon. El JWT de cada sesión identifica al usuario. No necesita `service_role`, contraseña de PostgreSQL ni claves privadas.

Las siete tablas tienen RLS habilitado y privilegios explícitos. No se concede acceso a `anon`. Las funciones auxiliares están en `private`, sin argumentos que permitan suplantar al usuario; usan `auth.uid()` y un `search_path` vacío. El trigger de registro ignora cualquier `business_id` o `role` que un atacante agregue a sus metadatos.

| Entidad                          | Lectura            | Crear                    | Editar                                         | Eliminar                 |
| -------------------------------- | ------------------ | ------------------------ | ---------------------------------------------- | ------------------------ |
| businesses                       | Mi negocio         | Solo trigger de registro | Owner de mi negocio; solo nombre/teléfono/logo | No permitido por API     |
| profiles                         | Mi negocio         | Solo trigger de registro | Solo mi nombre; no rol, UUID ni negocio        | No permitido por API     |
| clients/events/payments/expenses | Mi negocio         | Mi negocio               | Mi negocio; `USING` + `WITH CHECK`             | Mi negocio; sujeto a FKs |
| service_packages                 | Mi negocio         | Owner de mi negocio      | Owner de mi negocio                            | Owner de mi negocio      |
| business-logos                   | Ruta de mi negocio | Owner en su ruta exacta  | Owner en su ruta exacta                        | Owner en su ruta exacta  |

Modificar un ID en una petición no concede acceso. `SELECT`, `UPDATE` y `DELETE` sobre un UUID ajeno no devuelven filas. Un `INSERT` con `business_id` ajeno falla. Usar el `business_id` propio con un cliente o evento ajeno también falla por las FKs compuestas. No se depende de filtros visuales ni de IDs difíciles de adivinar.

Los propietarios de PostgreSQL y las claves privilegiadas pueden eludir RLS por diseño de Supabase. Nunca se usan para peticiones de la aplicación. El SQL Editor sirve para migraciones administrativas; no es una prueba válida de aislamiento si consultas como administrador sin cambiar de rol.

## Prueba local reproducible

```bash
npm run test:db
```

Ejecuta las dos migraciones reales en **PGlite, un motor PostgreSQL**, con roles `authenticated` y `anon`, y reproduce los esquemas administrados `auth` y `storage` mínimos. Crea dos empresas y un miembro. Comprueba ambos sentidos del aislamiento, falsificación del negocio, referencias cruzadas, cambios de rol, logo privado, operaciones válidas y reglas financieras.

Esta prueba ejecuta RLS de PostgreSQL; **no valida el servicio remoto de Auth, PostgREST, correos, cookies o la API binaria de Storage**. Esos componentes deben comprobarse con un proyecto real.

## Prueba contra Supabase real

1. Aplica ambas migraciones en un proyecto de prueba.
2. Crea dos cuentas desde `/register`, con correos diferentes y nombres de negocio distintos. Confírmalas si está activada la confirmación de correo.
3. En `.env.local`, añade las cuatro variables `RLS_TEST_EMAIL_A`, `RLS_TEST_PASSWORD_A`, `RLS_TEST_EMAIL_B` y `RLS_TEST_PASSWORD_B`. Usa cuentas dedicadas a pruebas. No las subas a Git.
4. Ejecuta:

```bash
npm run test:rls:remote
```

El script inicia sesión como cada usuario, crea registros temporales en ambos negocios, ataca por API pública todos los módulos y prueba dos pagos concurrentes que superarían el saldo. Después elimina solo los UUID que creó. No borra cuentas ni negocios. Si informa un problema de limpieza, revisa los registros llamados `Prueba RLS …`.

Debe mostrar `RLS remoto y flujo API verificados; datos temporales limpiados...` y terminar con código 0. Un error es una señal para detener el despliegue hasta resolverlo. Los rechazos deben ser errores de permisos o integridad; un fallo de red no cuenta como aislamiento probado. El script no requiere claves service-role. Usa exclusivamente la clave pública indicada y dos negocios dedicados a pruebas sin logos existentes.

El 9 de septiembre de 2026 esta prueba pasó contra Supabase real: lectura y escrituras ajenas, referencias cruzadas al insertar y editar, cambios de rol/negocio, acceso anónimo, logos privados y sobrepagos concurrentes. La prueba PostgreSQL también verifica que un fallo al insertar el negocio o el perfil revierte el alta completa, sin usuarios ni negocios huérfanos.

El asesor de seguridad de Supabase señaló una advertencia de configuración: protección de contraseñas filtradas deshabilitada. Revisa su disponibilidad en tu plan y actívala antes de producción siguiendo [la guía de protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se cambiaron el plan ni las políticas de Auth durante estas pruebas.

## Verificación en navegador

1. En una ventana, crea A, un cliente, un evento de $3,800, un anticipo de $1,500 y un gasto de $650.
2. El detalle debe mostrar: total $3,800; pagado $1,500; saldo $2,300; gastos $650; utilidad $3,150.
3. En otra sesión de navegador, entra como B. Sus listas deben estar vacías si aún no creaste datos.
4. Copia `/events/UUID_DE_A` e intenta abrirlo como B: debe mostrar que no existe. Lo mismo con las rutas de edición de cliente, pago, gasto y paquete.
5. Prueba la API directa con el script anterior; así no dependes del filtro del servidor Next.js.
6. Sube un logo como A. El bucket debe continuar privado. B no puede listar, firmar, reemplazar ni borrar la ruta de A usando su JWT. La URL firmada, si se comparte deliberadamente, funciona hasta expirar (una hora).
7. Cierra sesión. Volver a una ruta privada debe llevar a `/login`; refrescar nunca debe devolver datos sin una sesión válida.

Antes de exponer registros reales, completa la prueba remota y la revisión manual de alta/confirmación, persistencia de sesión y logos. No se simula una aprobación de esos pasos si no hay un proyecto configurado.
