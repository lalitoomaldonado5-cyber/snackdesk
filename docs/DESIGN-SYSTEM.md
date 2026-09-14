# Snackdesk · Frontend v2 / fase 1

Ámbito: login, registro, marco autenticado, navegación y dashboard. CSS con prefijo `sd-`; los módulos de clientes, eventos, pagos, gastos y configuración conservan sus componentes y estilos. Sin modificaciones a servicios, Auth, RLS, datos o cálculos financieros.

## Fundamentos

| Token                | Valor / uso                                      |
| -------------------- | ------------------------------------------------ |
| Verde                | `#1F3D2E`: texto, navegación activa, CTA         |
| Crema                | `#FFF9F2`: fondo principal                       |
| Matcha               | `#DFF0E1`: ganancia y confirmación               |
| Durazno              | `#FFE4D6`: avatar y estados puntuales            |
| Mango                | `#FFF1C7`: apartado                              |
| Rosa                 | `#FDE2E4`: cancelado                             |
| Línea                | `#E3E6DC`: divisores y bordes                    |
| Texto secundario     | `#637168`                                        |
| Superficie           | `#FFFDFA`                                        |
| Tipografía editorial | Instrument Serif 400, normal / cursiva           |
| Interfaz             | Manrope variable, 400–700                        |
| Espaciado            | 4, 8, 12, 16, 24, 32, 48 px                      |
| Radios               | 6, 12, 20 px                                     |
| Sombra               | `0 8px 24px #1F3D2E0A` (solo capas)              |
| Anchos               | Contenido 1400, formulario 380, sidebar 240 px   |
| Movimiento           | Controles 180 ms, carrusel 650 ms, intervalo 7 s |

Fuentes alojadas con la app mediante paquetes Fontsource; no requieren conexión a Google Fonts en ejecución o build. [Instrument Serif](https://fontsource.org/fonts/instrument-serif/install), [Manrope](https://fontsource.org/fonts/manrope).

## Primitivas

`components/design/primitives.tsx`: Button (primary/secondary/quiet), Card, Alert (info/success/error), EmptyState con CTA, Skeleton, Tooltip, Modal y Dropdown. Controles de formulario nativos con `.sd-field`; tablas `.sd-table`; estados `.sd-badge`. No se propagan estos estilos a formularios de módulos fuera de fase 1.

Modal usa `dialog.showModal()` para foco modal, Escape y retorno de foco. Dropdown usa disclosure nativo con Escape/click exterior, sin roles de menú falsos. Focus visible; controles táctiles de 44 px; reduced motion elimina animación y autorrotación. El carrusel se pausa al hover/foco y después de navegación manual hasta reanudarlo.

## Marca y fotografía

`components/design/brand.tsx` admite asset horizontal, isotipo y versión clara. Se incluye `public/brand/snackdesk-horizontal-cream.png`, una adaptación horizontal de la marca suministrada, preparada con edición de imagen. Por solicitud del usuario se presenta como una sola placa crema integrada con la interfaz; reemplaza los dos recortes anteriores. El archivo no tiene transparencia. Se conservan las rutas configurables para futuros assets horizontal, isotipo y variante clara.

Fotografías almacenadas en `public/images/editorial` para evitar depender de terceros al cargar la app:

- `celebration.jpg`: [servicio de postres, Pexels / Mad Knoxx Deluxe](https://www.pexels.com/photo/34593744/).
- `fruit-cups.jpg`: [Kold Shots / Pexels](https://www.pexels.com/photo/colorful-fruit-salad-served-at-catering-event-34891879/).
- `gathering.jpg`: [Jose Marroquin / Unsplash](https://unsplash.com/photos/a-platter-of-fresh-fruit-and-vegetables-with-dip-hoHAgMdVxI8).

El slide de cotizaciones usa los textos solicitados y explicita «Próximamente». No contiene CTA, simulaciones de documentos ni funciones inexistentes.

## Decisiones y límites

- Las cifras usan `dashboardMetrics` / `eventFinance` existentes, sin cambiar su significado. Ventas son contratos confirmados, no cobros recibidos. La gráfica etiqueta ventas, gastos y ganancia estimada de forma consistente.
- Actividad reciente deriva de `created_at` de eventos, pagos y gastos ya cargados. No es un historial de auditoría ni supone cambios de estado.
- La demo sigue siendo la ruta pública existente, rotulada con datos de ejemplo. No se introducen fixtures en la aplicación autenticada.
- Recuperación de contraseña no existía. No se añade un enlace falso ni se implementa un flujo Auth fuera del alcance; queda pendiente de decisión para otra fase.
- No se cambian las páginas de otros módulos ni se añaden cotizaciones.
