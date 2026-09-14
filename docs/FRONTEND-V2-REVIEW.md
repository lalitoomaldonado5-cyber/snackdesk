# Revisión frontend v2 — fase 1

Rama: `design/frontend-v2`. Base: `integration/supabase-validation` / `0b73d78`.

## Entrega

Login y registro editorial con carrusel, marca suministrada, controles de contraseña y mensajes existentes; marco autenticado con navegación compacta y drawer móvil; dashboard con métricas existentes, próximos eventos, saldos, gráfica y actividad. Fundamentos y componentes documentados en [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

No se modificaron servicios, autenticación, cálculos financieros, esquemas, RLS, migraciones ni páginas de clientes/eventos/pagos/gastos/configuración.

## Validación local — 14 de septiembre de 2026

- `npm run check`: aprobado. ESLint sin avisos, TypeScript, 14 pruebas unitarias, 12 subpruebas de base de datos PGlite y build de producción Next.js.
- Login, registro y dashboard de ejemplo revisados a 375, 390, 430, 768, 1024, 1440 y 1920 px: sin desbordamiento horizontal; un único h1 por página.
- Drawer: foco inicial, Tab y Shift+Tab circulares, Escape y retorno al botón de apertura comprobados.
- Contraseña: mostrar/ocultar comprobado sin enviar formularios ni crear cuentas.
- Carrusel: navegación manual y pausa comprobadas. Respeto de reduced motion implementado con matchMedia y CSS; sin cambiar preferencias del equipo.
- Capturas guardadas fuera del repositorio en `outputs/frontend-v2-review`: login-desktop.png, register-mobile.png, dashboard-desktop.png y dashboard-mobile.png.

## Límites

Las comprobaciones visuales de dashboard usan exclusivamente `/demo`, que identifica sus datos ficticios. No se repitió una sesión autenticada real ni el ciclo de correo de registro en esta revisión. No se presentan como pruebas aprobadas de Auth o Supabase remoto.

La recuperación de contraseña no existía; sigue pendiente. El logo se adaptó a un PNG horizontal sobre placa crema, a petición del usuario, para reemplazar los recortes que producían parches visibles. El archivo no tiene transparencia; una variante clara y un master transparente pueden sustituirse posteriormente.

La revisión se detiene aquí para aprobación visual antes de extender el sistema a otros módulos.
