export interface ManualSection {
  id: string;
  title: string;
  iconName: string;
  category: 'operaciones' | 'cobranzas' | 'productos' | 'rutas' | 'faq';
  summary: string;
  steps: string[];
  tips?: string[];
  kpis?: string[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'pedidos-decimales',
    title: 'Toma de Pedidos con Pesaje Decimal (Balanza)',
    iconName: 'Scale',
    category: 'operaciones',
    summary: 'Procedimiento para registrar pedidos fraccionados por peso exacto (ej. 1.500 kg, 0.450 kg) y calcular automáticamente el subtotal.',
    steps: [
      'Ingresá a la sección "Pedidos" desde la barra inferior o desde la pantalla principal.',
      'Tocá el botón "+ Pedido" para abrir la ventana de Nueva Orden.',
      'Buscá y seleccioná el cliente utilizando el buscador en tiempo real por nombre, dirección o día de visita.',
      'Buscá el fiambre, queso o embutido deseado con el buscador de productos.',
      'Tocá "+0.5kg" o "+1kg" para sumarlo al carrito, o escribí el peso exacto registrado en la balanza (ej. 1.250 kg) en el casillero numérico con decimales.',
      'El sistema multiplica automáticamente el peso en kg por el precio unitario del producto y calcula el subtotal.',
      'Opcionalmente agregá notas de entrega (ej: "Tybo en barra entera, jamón feteado fino").',
      'Hacé clic en "Confirmar Pedido & Generar PDF" para registrar la orden.'
    ],
    tips: [
      'Podés usar los botones rápidos (+0.25, +0.5, +1kg) para agilizar la carga.',
      'Si el cliente pide un peso aproximado, podés reajustar el pesaje real luego cuando lo pesás en balanza.'
    ],
    kpis: ['Total del pedido en ARS', 'Kilos netos despachados', 'Margen de ganancia estimado']
  },
  {
    id: 'pdf-whatsapp',
    title: 'Generación de Remitos PDF y Envío por WhatsApp',
    iconName: 'FileText',
    category: 'operaciones',
    summary: 'Cómo emitir el remito oficial de entrega con membrete de Fiambrería Mamá y enviárselo directamente al cliente por WhatsApp.',
    steps: [
      'Al confirmar un nuevo pedido, el sistema genera automáticamente el documento PDF oficial.',
      'El remito incluye: Datos de Fiambrería Mamá, datos completos del cliente, fecha del pedido, fecha de vencimiento a 7 días, detalle de cada fiambre con peso y subtotal, total a abonar, y el Alias de Transferencia (MAMA.FIAMBRES.SJ).',
      'Para descargar el PDF en cualquier momento, tocá el ícono de "Descargar PDF" en la tarjeta del pedido.',
      'Para enviarlo por WhatsApp, tocá el botón verde de "WhatsApp" en el pedido: se abrirá WhatsApp con el mensaje prearmado listo para enviar.'
    ],
    tips: [
      'El cliente recibe el remito detallado de inmediato, evitando reclamos sobre pesos o precios.',
      'El comprobante ya lleva impreso el alias bancario para que puedan transferir sin pedir datos.'
    ]
  },
  {
    id: 'cta-cte-cobranzas',
    title: 'Gestión de Cuentas Corrientes y Cobranzas a 7 Días',
    iconName: 'Wallet',
    category: 'cobranzas',
    summary: 'Circuito de crédito comercial: control de deuda de clientes, vencimiento semanal y registro de cobranzas en efectivo o transferencia.',
    steps: [
      'Cada pedido entregado impacta en la cuenta corriente del cliente como saldo deudor.',
      'El plazo habitual de pago es de 7 días corridos a partir de la fecha de entrega.',
      'Para ver el saldo deudor de un cliente, ingresá a "Clientes" o "Ruta Hoy": el saldo se muestra destacado en color rojo si debe.',
      'Para registrar una cobranza, tocá el botón "Cobrar" en el cliente o pedido.',
      'Elegí el medio de pago: Efectivo o Transferencia bancaria.',
      'Ingresá el monto cobrado (puede ser el total o una entrega parcial a cuenta).',
      'Al confirmar, el sistema descuenta automáticamente la deuda de la cuenta corriente y registra el pago en el historial.'
    ],
    tips: [
      'Podés enviar un recordatorio automático por WhatsApp tocando el botón de cobro en la tarjeta del cliente.',
      'En la pantalla principal "Ruta Hoy" disponés de botones de 1 tap (EFECTIVO y TRANSF.) para cobrar en segundos durante el reparto.'
    ],
    kpis: ['Deuda total de la calle', 'Efectivo recaudado', 'Transferencias acreditadas', 'Clientes al día vs con deuda']
  },
  {
    id: 'rutas-visita',
    title: 'Organización y Recorrido de Rutas Semanales',
    iconName: 'MapPin',
    category: 'rutas',
    summary: 'Cómo planificar y recorrer las visitas de clientes asignadas para cada día de la semana (Lunes a Sábado) en San Juan.',
    steps: [
      'A cada cliente se le asigna un "Día de Visita" habitual (Lunes, Martes, Miércoles, Jueves, Viernes o Sábado).',
      'Al ingresar a "Ruta Hoy" (/admin), el sistema detecta el día actual y filtra automáticamente los clientes correspondientes.',
      'Para ver la ruta de otro día (ej: preparar el reparto de mañana), tocá el botón del día correspondiente en el selector superior.',
      'Para navegar hacia el cliente, tocá el botón "GPS": se abrirá Google Maps con la ubicación exacta o dirección del cliente.',
      'Podés registrar anotaciones del reparto (ej: "Pasaron para el próximo martes") que quedan guardadas en la ficha del cliente.'
    ],
    tips: [
      'Asignar bien el día de visita permite recorrer la ciudad por zonas optimizando combustible y tiempo.',
      'En el detalle de cada cliente podés ver "📦 Detalle habitual / Último pedido" para ofrecerle lo que suele pedir.'
    ]
  },
  {
    id: 'productos-costos-precios',
    title: 'Administración de Fiambres, Costos y Precios',
    iconName: 'Package',
    category: 'productos',
    summary: 'Carga de fiambres y quesos, precio de costo de compra, precio de venta al público, cálculo de margen % y registro histórico de aumentos.',
    steps: [
      'Ingresá a la sección "Fiambres" (/admin/productos).',
      'Para crear un nuevo producto, hacé clic en "+ Producto".',
      'Ingresá el Nombre (ej. "Queso Tybo Danbo"), Categoría, Unidad (kg o 100g) y Foto.',
      'Ingresá el Precio de Costo (lo que pagás al distribuidor/proveedor) y el Precio de Venta (al que vendés).',
      'El sistema calcula en tiempo real el Margen Bruto de Ganancia (Markup %) y la Ganancia neta por kg.',
      'Marcá "Venta Fraccionada" para permitir decimales en los pedidos.',
      'Cada vez que modificás el precio de venta o costo, el sistema registra automáticamente el historial de variación con el % de incremento y fecha exacta.'
    ],
    tips: [
      'Podés consultar el historial completo de aumentos tocando el botón "Historial de Precios" en cualquier producto.',
      'Esto te permite saber cuándo y cuánto aumentó cada fiambre a lo largo del tiempo.'
    ],
    kpis: ['Margen promedio de fiambrería', 'Rentabilidad por kg', 'Variación intermensual de costos']
  },
  {
    id: 'faq-reparto',
    title: 'Preguntas Frecuentes y Buenas Prácticas',
    iconName: 'HelpCircle',
    category: 'faq',
    summary: 'Respuestas a situaciones operativas habituales durante el reparto y la administración.',
    steps: [
      '¿Qué hago si el cliente entrega un pago parcial? En la ventana de cobro podés ingresar el monto parcial que entregó (ej. $10.000 de una boleta de $25.000). El sistema registrará el pago y mantendrá los $15.000 restantes como saldo deudor.',
      '¿Cómo consulto qué es lo que más pide un cliente? En "Clientes", hacé clic sobre el cliente y abrí "Historial & Consumo": verás el ranking exacto de los fiambres y quesos que más compró en kilos y pesos.',
      '¿Dónde veo el ranking general del negocio? En la pestaña "Rankings" tenés las tablas de clientes que más compran, mayores deudores y los fiambres más vendidos en kilos y facturación.',
      '¿Cómo comparto la lista de precios a clientes por WhatsApp? En "Fiambres" podés generar el enlace directo al Catálogo Digital público para que tus clientes lo vean desde su celular.'
    ]
  }
];

export const MANUAL_CATEGORIES = [
  { id: 'todos', label: 'Todo el Manual' },
  { id: 'operaciones', label: 'Toma de Pedidos' },
  { id: 'cobranzas', label: 'Cuentas Corrientes' },
  { id: 'rutas', label: 'Rutas & GPS' },
  { id: 'productos', label: 'Fiambres & Costos' },
  { id: 'faq', label: 'Preguntas Frecuentes' }
];
