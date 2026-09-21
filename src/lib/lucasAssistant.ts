import { supabase } from './supabase';
import { Customer, Product, Order } from '../types';
import { formatCurrency } from './utils';
import { MANUAL_SECTIONS } from './manualContent';

export interface LucasMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  dataHighlights?: {
    type?: 'customer' | 'order' | 'product' | 'financial' | 'guide';
    items?: Array<{ label: string; value: string; extra?: string }>;
  };
  suggestedActions?: string[];
}

export interface LucasContext {
  currentPath: string;
  activeCustomer?: Customer | null;
  activeOrder?: Order | null;
}

// Helper: Normalizar texto para búsqueda
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function askLucas(prompt: string, context: LucasContext): Promise<LucasMessage> {
  const norm = normalizeText(prompt);
  const now = new Date();
  const daysEs = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const todayName = daysEs[now.getDay()] === 'domingo' ? 'lunes' : daysEs[now.getDay()];

  // Cargar datos frescos de Supabase
  const [
    { data: customersData },
    { data: productsData },
    { data: ordersData },
    { data: paymentsData }
  ] = await Promise.all([
    supabase.from('customers').select('*'),
    supabase.from('products').select('*'),
    supabase.from('orders').select('*, customer:customers(name, phone)'),
    supabase.from('customer_payments').select('*, customer:customers(name)')
  ]);

  const customers: Customer[] = customersData || [];
  const products: Product[] = productsData || [];
  const orders: Order[] = ordersData || [];
  const payments = paymentsData || [];

  // 1. CONSULTA: CLIENTES DEUDORES / QUIÉN DEBE / CUENTAS CORRIENTES
  if (norm.includes('deud') || norm.includes('debe') || norm.includes('cobrar') || norm.includes('cuenta corriente') || norm.includes('saldo')) {
    const debtors = customers
      .filter(c => (c.debt_amount || 0) > 0)
      .sort((a, b) => (b.debt_amount || 0) - (a.debt_amount || 0));

    const totalDebt = debtors.reduce((sum, c) => sum + (c.debt_amount || 0), 0);

    if (debtors.length === 0) {
      return {
        id: 'lucas-' + Date.now(),
        role: 'assistant',
        content: `¡Excelentes noticias! 🎉 No hay clientes con deuda pendiente en la calle. Todas las cuentas corrientes están al día.`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: ['Ver clientes de la ruta de hoy', '¿Cuánto se vendió hoy?']
      };
    }

    const topDebtors = debtors.slice(0, 5);
    const lines = topDebtors.map((c, i) => `${i + 1}. **${c.name}**: debe **${formatCurrency(c.debt_amount || 0)}** (Visita: ${c.visit_day || 'A coordinar'})`).join('\n');

    return {
      id: 'lucas-' + Date.now(),
      role: 'assistant',
      content: `Tenés **${debtors.length} clientes** con saldo pendiente en cuenta corriente por un total de **${formatCurrency(totalDebt)}**.\n\nLos principales saldos a cobrar son:\n${lines}\n\n💡 *Tip: Podés enviarles el recordatorio de cobro tocando el botón de WhatsApp en la ficha del cliente.*`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      dataHighlights: {
        type: 'financial',
        items: [
          { label: 'Deuda Total en la Calle', value: formatCurrency(totalDebt) },
          { label: 'Clientes con Deuda', value: `${debtors.length} comercios` },
          { label: 'Mayor Deudor', value: `${debtors[0]?.name} (${formatCurrency(debtors[0]?.debt_amount || 0)})` }
        ]
      },
      suggestedActions: ['¿Cómo registrar un cobro?', 'Ver ruta de cobranza de hoy', 'Buscar un cliente específico']
    };
  }

  // 2. CONSULTA: RUTA DE HOY / DÍAS DE VISITA / REPARTO
  if (norm.includes('ruta') || norm.includes('visita') || norm.includes('hoy') || norm.includes('lunes') || norm.includes('martes') || norm.includes('miercoles') || norm.includes('jueves') || norm.includes('viernes') || norm.includes('sabado')) {
    let targetDay = todayName;
    if (norm.includes('lunes')) targetDay = 'lunes';
    else if (norm.includes('martes')) targetDay = 'martes';
    else if (norm.includes('miercoles') || norm.includes('miércoles')) targetDay = 'miercoles';
    else if (norm.includes('jueves')) targetDay = 'jueves';
    else if (norm.includes('viernes')) targetDay = 'viernes';
    else if (norm.includes('sabado') || norm.includes('sábado')) targetDay = 'sabado';

    const dayNameCapitalized = targetDay.charAt(0).toUpperCase() + targetDay.slice(1);

    const routeCustomers = customers.filter(c => {
      const vDay = normalizeText(c.visit_day || c.preferred_day || '');
      return vDay.includes(targetDay);
    });

    const routeDebt = routeCustomers.reduce((sum, c) => sum + (c.debt_amount || 0), 0);

    if (routeCustomers.length === 0) {
      return {
        id: 'lucas-' + Date.now(),
        role: 'assistant',
        content: `Para el día **${dayNameCapitalized}** no hay clientes agendados todavía en la hoja de ruta. Podés asignar clientes a este día desde la sección Clientes.`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: ['Ver todos los clientes', '¿Quiénes tienen más deuda?']
      };
    }

    const list = routeCustomers.map(c => `• **${c.name}** - ${c.address || 'Sin dirección'} ${(c.debt_amount || 0) > 0 ? `(Debe ${formatCurrency(c.debt_amount || 0)})` : '✅ Al Día'}`).join('\n');

    return {
      id: 'lucas-' + Date.now(),
      role: 'assistant',
      content: `La ruta de los **${dayNameCapitalized}** cuenta con **${routeCustomers.length} clientes** agendados.\n\n📋 **Comercios a visitar:**\n${list}\n\n💰 **Saldo pendiente en esta ruta:** ${formatCurrency(routeDebt)}.\n\nRecuerda que desde la pantalla **Ruta Hoy** tenés navegación directa por GPS hacia cada local con un toque.`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      dataHighlights: {
        type: 'customer',
        items: [
          { label: `Clientes de ${dayNameCapitalized}`, value: `${routeCustomers.length}` },
          { label: 'Deuda en esta ruta', value: formatCurrency(routeDebt) }
        ]
      },
      suggestedActions: ['¿Cómo funciona la navegación GPS?', 'Ver pedidos pendientes']
    };
  }

  // 3. CONSULTA: PEDIDOS / VENTAS / FACTURACIÓN
  if (norm.includes('pedido') || norm.includes('venta') || norm.includes('vend') || norm.includes('boleta') || norm.includes('factur')) {
    const pendingOrders = orders.filter(o => o.status === 'PENDIENTE');
    const totalPending = pendingOrders.reduce((sum, o) => sum + (o.actual_total || o.estimated_total || 0), 0);
    const totalOrdersAmount = orders.reduce((sum, o) => sum + (o.actual_total || o.estimated_total || 0), 0);

    return {
      id: 'lucas-' + Date.now(),
      role: 'assistant',
      content: `Actualmente hay registrados **${orders.length} pedidos** en el sistema por un total histórico de **${formatCurrency(totalOrdersAmount)}**.\n\n• **Pedidos Pendientes:** ${pendingOrders.length} boletas (${formatCurrency(totalPending)})\n• **Cobranzas Registradas:** ${payments.length} recibos.\n\nCada pedido cuenta con su **Remito Oficial en PDF** descargable y botón para enviar por WhatsApp con el alias bancario de la fiambrería.`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      dataHighlights: {
        type: 'order',
        items: [
          { label: 'Pedidos Pendientes', value: `${pendingOrders.length}` },
          { label: 'Monto Pendiente', value: formatCurrency(totalPending) },
          { label: 'Total Pedidos Registrados', value: `${orders.length}` }
        ]
      },
      suggestedActions: ['¿Cómo cargar un pedido con decimales?', '¿Quiénes deben más?', '¿Cómo generar el PDF?']
    };
  }

  // 4. CONSULTA: PRODUCTOS / PRECIOS / COSTOS / FIAMBRES / QUESOS
  if (norm.includes('precio') || norm.includes('producto') || norm.includes('costo') || norm.includes('fiambre') || norm.includes('queso') || norm.includes('margen')) {
    // Si menciona un producto específico
    const matchProd = products.find(p => norm.includes(normalizeText(p.name)));
    if (matchProd) {
      const markup = matchProd.cost_price && matchProd.cost_price > 0 
        ? (((matchProd.price - matchProd.cost_price) / matchProd.cost_price) * 100).toFixed(1)
        : null;

      return {
        id: 'lucas-' + Date.now(),
        role: 'assistant',
        content: `Información de **${matchProd.name}**:\n\n• **Precio de Venta:** ${formatCurrency(matchProd.price)} por ${matchProd.unit}\n• **Precio de Costo:** ${matchProd.cost_price ? formatCurrency(matchProd.cost_price) : 'No registrado'}\n${markup ? `• **Margen de Ganancia:** +${markup}%\n` : ''}• **Venta Decimal:** ${matchProd.allows_decimals ? 'Habilitada (ej. 1.250 kg)' : 'Solo enteros'}\n• **Estado:** ${matchProd.is_available ? 'Disponible en catálogo' : 'Pausado'}`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        dataHighlights: {
          type: 'product',
          items: [
            { label: 'Precio', value: `${formatCurrency(matchProd.price)}/${matchProd.unit}` },
            { label: 'Costo', value: matchProd.cost_price ? formatCurrency(matchProd.cost_price) : '-' },
            { label: 'Margen', value: markup ? `+${markup}%` : '-' }
          ]
        },
        suggestedActions: ['Ver historial de precios', '¿Cómo cambiar un precio?', 'Ver otros productos']
      };
    }

    const availableCount = products.filter(p => p.is_available).length;
    const decimalCount = products.filter(p => p.allows_decimals).length;

    return {
      id: 'lucas-' + Date.now(),
      role: 'assistant',
      content: `El catálogo cuenta con **${products.length} productos** registrados (${availableCount} disponibles para la venta):\n\n• Todos los fiambres y quesos permiten **venta fraccionada por balanza decimal** (ej. 0.450 kg o 1.500 kg).\n• Podés cargar el costo de compra y el precio de venta; el sistema calcula tu margen en tiempo real.\n• Cualquier cambio de precio queda asentado en el **Historial de Variaciones** con su porcentaje de aumento.`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: ['¿Cómo actualizar precios de fiambres?', '¿Cuáles son los más vendidos?']
    };
  }

  // 5. CONSULTA: MANUAL / AYUDA / CÓMO HACER ALGO
  const matchedManual = MANUAL_SECTIONS.find(m => {
    const normTitle = normalizeText(m.title);
    const normSumm = normalizeText(m.summary);
    return normTitle.split(' ').some(w => w.length > 3 && norm.includes(w)) ||
           normSumm.split(' ').some(w => w.length > 4 && norm.includes(w));
  });

  if (matchedManual || norm.includes('como') || norm.includes('ayuda') || norm.includes('manual') || norm.includes('instrucc')) {
    const sec = matchedManual || MANUAL_SECTIONS[0];
    const stepsFormatted = sec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

    return {
      id: 'lucas-' + Date.now(),
      role: 'assistant',
      content: `📖 **Manual Operativo: ${sec.title}**\n\n${sec.summary}\n\n**Paso a paso:**\n${stepsFormatted}\n\n${sec.tips ? `💡 **Tips prácticos:**\n${sec.tips.map(t => `• ${t}`).join('\n')}` : ''}`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      dataHighlights: {
        type: 'guide',
        items: [
          { label: 'Guía', value: sec.title },
          { label: 'Categoría', value: sec.category }
        ]
      },
      suggestedActions: ['Ver manual completo', '¿Cómo cobrar a 7 días?', '¿Cómo generar el PDF?']
    };
  }

  // 6. CONSULTA ESPECÍFICA DE CLIENTE (por nombre)
  const matchedCustomer = customers.find(c => norm.includes(normalizeText(c.name)) || (c.name.split(' ').some(part => part.length > 3 && norm.includes(normalizeText(part)))));
  if (matchedCustomer) {
    return {
      id: 'lucas-' + Date.now(),
      role: 'assistant',
      content: `Ficha de **${matchedCustomer.name}**:\n\n• **Día de Visita:** ${matchedCustomer.visit_day || matchedCustomer.preferred_day || 'A coordinar'}\n• **Dirección:** ${matchedCustomer.address || 'Sin registrar'}\n• **Teléfono:** ${matchedCustomer.phone || 'Sin teléfono'}\n• **Cuenta Corriente:** ${matchedCustomer.debt_amount && matchedCustomer.debt_amount > 0 ? `Debe **${formatCurrency(matchedCustomer.debt_amount)}**` : '✅ Al Día ($0)'}\n• **Último Pedido / Habitual:** ${matchedCustomer.last_order_details || 'Sin registro previo'}\n• **Notas de Reparto:** ${matchedCustomer.cobro_notes || 'Sin notas'}`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      dataHighlights: {
        type: 'customer',
        items: [
          { label: 'Cliente', value: matchedCustomer.name },
          { label: 'Día Visita', value: matchedCustomer.visit_day || 'Lunes' },
          { label: 'Deuda', value: formatCurrency(matchedCustomer.debt_amount || 0) }
        ]
      },
      suggestedActions: [`Crear pedido para ${matchedCustomer.name}`, '¿Cómo registrar cobro?', 'Ver ruta de hoy']
    };
  }

  // RESPUESTA GENERAL / BIENVENIDA INTELIGENTE
  return {
    id: 'lucas-' + Date.now(),
    role: 'assistant',
    content: `¡Hola! Soy **Lucas**, tu copiloto inteligente de Fiambrería Mamá. 🧀\n\nTengo acceso a toda la base de datos en tiempo real y al manual operativo del negocio. Podés preguntarme con lenguaje natural lo que necesites, por ejemplo:\n\n• *"¿Quiénes son los clientes que más deben en cuenta corriente?"*\n• *"¿Qué comercios tengo que visitar en la ruta de hoy?"*\n• *"¿Cómo cargo un pedido con decimales en balanza?"*\n• *"¿Cuál es el precio y costo del jamón cocido?"*\n• *"¿Cuánto se vendió y cobró este mes?"*\n\n¿En qué te ayudo ahora?`,
    timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    suggestedActions: [
      '¿Quiénes son los mayores deudores?',
      'Ver clientes de la ruta de hoy',
      '¿Cómo emitir un remito PDF?',
      'Resumen de pedidos'
    ]
  };
}
