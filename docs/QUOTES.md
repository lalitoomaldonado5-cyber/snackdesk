# Cotizaciones y alta rápida de clientes

La pantalla Inicio incluye Nueva cotización. `/quotes/new` requiere una sesión y usa el negocio de esa sesión como emisor. La acción del servidor vuelve a obtener nombre, teléfono y logo privado desde Supabase; no admite un negocio ni una URL de logo enviados por el navegador.

El PDF se descarga directamente, sin crear un evento, pago o registro persistente de cotización. No se añade un historial de cotizaciones ni se cambia el esquema de datos. Puede tomar datos de clientes, eventos y paquetes existentes, o recibir un destinatario y conceptos escritos libremente.

Formato Carta, una página; hasta ocho conceptos, cantidad y precio unitario, IVA opcional de 16%, anticipo solicitado, vigencia, notas y condiciones. Cálculo en centavos. Si el contenido no cabe, se solicita acortarlo sin truncarlo ni generar otra página. Los caracteres que la fuente no admite producen un mensaje para corregir el texto.

Fuentes seleccionables: Lato, Instrument Serif y DM Serif Display. Los archivos WOFF se distribuyen con sus licencias en `assets/pdf`, se incluyen explícitamente en el bundle del servidor y se incrustan como subconjuntos en cada PDF. No se descarga una fuente externa al generar la cotización. Los logos PNG/JPEG/WebP existentes se convierten a PNG para el PDF y se ajustan conservando sus proporciones.

Nuevo evento permite agregar un cliente en un diálogo. El cliente se guarda inmediatamente en el negocio de la sesión y queda seleccionado; el formulario del evento conserva sus datos. Cancelar el evento después no elimina al cliente. Funciona también cuando todavía no hay clientes.

Validación automática: `npm run check`. Las pruebas de cotización verifican los cálculos, fechas, anticipo, límites, metadatos no confiables, una página, fuentes incrustadas, logo y errores de desbordamiento. La suite de base verifica RLS, referencias entre empresas y aislamiento del almacenamiento.

Validación manual: abrir Inicio → Nueva cotización; elegir un evento o cliente, agregar conceptos y descargar con cada fuente. Revisar el logo, acentos, importes y una página. En Nuevo evento, escribir datos, abrir/cancelar Nuevo cliente y comprobar que se conservan; guardar un cliente de prueba y verificar la selección. Revisar escritorio y móvil.
