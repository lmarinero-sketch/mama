import { supabase } from './supabase';
import { Order, OrderItem } from '../types';

export const ALIAS_TRANSFERENCIA = 'MAMA.FIAMBRES.SJ';

export function formatWhatsAppPhone(phone: string | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // Estandarizar San Juan (264) o Argentina
  if (cleaned.startsWith('549')) return cleaned;
  if (cleaned.startsWith('54')) return `549${cleaned.slice(2)}`;
  if (cleaned.startsWith('15')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('264')) return `549${cleaned}`;
  if (cleaned.length === 10) return `549${cleaned}`;
  
  return `549264${cleaned}`;
}

export function generateWhatsAppCobroUrl(
  customerName: string,
  phone: string | undefined,
  amount: number,
  orderDate?: string,
  details?: string
): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return '#';

  const fechaTexto = orderDate ? ` realizado el ${orderDate}` : ' de la semana pasada';
  const detalleTexto = details ? `\n📦 *Detalle:* ${details}` : '';

  const message = `Hola ${customerName}, ¿cómo estás? 👋🏼\n\nTe escribimos de *Fiambrería Mamá* para recordarte que hoy pasamos por tu domicilio a cobrar el pedido${fechaTexto} por un total de *$${amount.toLocaleString('es-AR')}*.${detalleTexto}\n\n💳 Si preferís abonar por transferencia, nuestro Alias es: *${ALIAS_TRANSFERENCIA}*\n\n¡Muchas gracias! 🧀🥓`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function generateWhatsAppPedidoUrl(
  customerName: string,
  phone: string | undefined,
  promos?: string
): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return '#';

  const promoTexto = promos ? `\n🔥 *Promos de hoy:* ${promos}` : '';

  const message = `Hola ${customerName}, 👋🏼\nHoy pasamos por tu zona a tomar pedido de *Fiambrería Mamá*.${promoTexto}\n\n¿Te dejamos reservado algo para la entrega? 🥓🧀 pan, queso, jamón o picadas.`;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data || [];
}

export async function createOrder(
  customerId: string,
  items: Array<{ product_id: string; requested_qty: number; unit_price: number }>,
  notes?: string
): Promise<Order | null> {
  const estimatedTotal = items.reduce((sum, item) => sum + item.requested_qty * item.unit_price, 0);

  // Fecha actual y fecha de cobro agendada a 7 días (próxima semana)
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 7);

  const orderDateStr = today.toISOString().split('T')[0];
  const dueDateStr = dueDate.toISOString().split('T')[0];

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      order_date: orderDateStr,
      due_date: dueDateStr,
      status: 'PENDIENTE',
      estimated_total: estimatedTotal,
      actual_total: estimatedTotal,
      payment_status: 'PENDIENTE',
      payment_method: 'PENDIENTE',
      notes
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('Error creating order:', orderErr);
    return null;
  }

  // Insertar ítems
  const orderItemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    requested_qty: item.requested_qty,
    actual_qty_weight: item.requested_qty,
    unit_price: item.unit_price,
    subtotal: item.requested_qty * item.unit_price
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsData);

  if (itemsErr) {
    console.error('Error inserting order items:', itemsErr);
  }

  // Actualizar también la deuda y último pedido del cliente
  await supabase.from('customers').update({
    last_order_amount: estimatedTotal,
    last_order_date: orderDateStr,
    cobro_date: dueDateStr,
    debt_amount: estimatedTotal,
    payment_status: 'COBRADO_PARCIAL'
  }).eq('id', customerId);

  return order;
}

export async function updateOrderActualWeight(
  orderId: string,
  updatedItems: Array<{ id: string; product_id: string; actual_qty_weight: number; unit_price: number }>
): Promise<boolean> {
  let actualTotal = 0;

  for (const item of updatedItems) {
    const subtotal = item.actual_qty_weight * item.unit_price;
    actualTotal += subtotal;

    await supabase
      .from('order_items')
      .update({
        actual_qty_weight: item.actual_qty_weight,
        subtotal: subtotal
      })
      .eq('id', item.id);
  }

  const { error } = await supabase
    .from('orders')
    .update({
      actual_total: actualTotal,
      status: 'DESPACHADO',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  return !error;
}

export async function markOrderAsPaid(
  orderId: string,
  customerId: string,
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA',
  amountPaid: number
): Promise<boolean> {
  const { error: orderErr } = await supabase
    .from('orders')
    .update({
      payment_status: 'COBRADO_TOTAL',
      payment_method: paymentMethod,
      status: 'COBRADO',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (orderErr) return false;

  // Actualizar cliente
  await supabase
    .from('customers')
    .update({
      debt_amount: 0,
      payment_status: 'COBRADO_TOTAL',
      cobro_notes: `Cobrado $${amountPaid} vía ${paymentMethod}`
    })
    .eq('id', customerId);

  return true;
}
