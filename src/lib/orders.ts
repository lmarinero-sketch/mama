import { supabase } from './supabase';
import { Order, OrderItem, Customer, Product, ProductPriceHistory, CustomerPayment } from '../types';

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

  const message = `Hola ${customerName}, ¿cómo estás? 👋🏼\n\nTe escribimos de *Fiambrería Mamá* para coordinar el cobro del pedido${fechaTexto} por un total de *$${amount.toLocaleString('es-AR')}*.${detalleTexto}\n\n💳 Si preferís abonar por transferencia, nuestro Alias es: *${ALIAS_TRANSFERENCIA}*\n\n¡Muchas gracias! 🧀🥓`;

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

  const message = `Hola ${customerName}, 👋🏼\nHoy pasamos por tu zona a tomar pedido de *Fiambrería Mamá*.${promoTexto}\n\n¿Te dejamos reservado algo para la entrega? 🥓🧀 quesos, fiambres en barra o embutidos.`;

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

export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
  return data || [];
}

export async function createOrder(
  customerId: string,
  items: Array<{ 
    product_id: string; 
    product_name?: string;
    requested_qty: number; 
    unit_price: number;
    unit_cost?: number;
    unit?: string;
  }>,
  notes?: string
): Promise<Order | null> {
  const estimatedTotal = items.reduce((sum, item) => sum + +(item.requested_qty * item.unit_price).toFixed(2), 0);

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
      paid_amount: 0,
      payment_status: 'PENDIENTE',
      payment_method: 'PENDIENTE',
      notes
    })
    .select(`*, customer:customers(*)`)
    .single();

  if (orderErr || !order) {
    console.error('Error creating order:', orderErr);
    return null;
  }

  // Insertar ítems soportando decimales (kilos y gramos)
  const orderItemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    requested_qty: item.requested_qty,
    actual_qty_weight: item.requested_qty,
    unit_price: item.unit_price,
    unit_cost: item.unit_cost || 0,
    unit: item.unit || 'kg',
    subtotal: +(item.requested_qty * item.unit_price).toFixed(2)
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsData);

  if (itemsErr) {
    console.error('Error inserting order items:', itemsErr);
  }

  // Obtener deuda actual del cliente para sumarle el nuevo pedido
  const { data: customer } = await supabase
    .from('customers')
    .select('debt_amount')
    .eq('id', customerId)
    .single();

  const prevDebt = Number(customer?.debt_amount || 0);
  const newDebt = +(prevDebt + estimatedTotal).toFixed(2);

  const itemSummary = items.map(i => `${i.requested_qty} ${i.unit || 'kg'} ${i.product_name || 'Ítem'}`).slice(0, 3).join(', ');

  await supabase.from('customers').update({
    last_order_details: itemSummary,
    last_order_amount: estimatedTotal,
    last_order_date: orderDateStr,
    cobro_date: dueDateStr,
    debt_amount: newDebt,
    payment_status: 'Con Deuda'
  }).eq('id', customerId);

  // Devolver el pedido completo con sus ítems
  const { data: fullOrder } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq('id', order.id)
    .single();

  return fullOrder || order;
}

export async function updateOrderActualWeight(
  orderId: string,
  updatedItems: Array<{ id: string; product_id: string; actual_qty_weight: number; unit_price: number }>
): Promise<boolean> {
  let actualTotal = 0;

  for (const item of updatedItems) {
    const subtotal = +(item.actual_qty_weight * item.unit_price).toFixed(2);
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

export async function registerPayment(params: {
  customerId: string;
  orderId?: string;
  amount: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';
  notes?: string;
}): Promise<boolean> {
  const { customerId, orderId, amount, paymentMethod, notes } = params;

  // 1. Insertar registro en customer_payments
  const { error: payErr } = await supabase.from('customer_payments').insert({
    customer_id: customerId,
    order_id: orderId || null,
    amount,
    payment_method: paymentMethod,
    notes
  });

  if (payErr) {
    console.error('Error inserting customer payment:', payErr);
    return false;
  }

  // 2. Si está asociado a un pedido, actualizar el pedido
  if (orderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('actual_total, estimated_total, paid_amount')
      .eq('id', orderId)
      .single();

    if (order) {
      const orderTotal = Number(order.actual_total || order.estimated_total || 0);
      const prevPaid = Number(order.paid_amount || 0);
      const newPaid = +(prevPaid + amount).toFixed(2);

      let newStatus: 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL' = 'COBRADO_PARCIAL';
      let mainStatus: 'PENDIENTE' | 'DESPACHADO' | 'COBRADO' = 'DESPACHADO';

      if (newPaid >= orderTotal) {
        newStatus = 'COBRADO_TOTAL';
        mainStatus = 'COBRADO';
      }

      await supabase.from('orders').update({
        paid_amount: newPaid,
        payment_status: newStatus,
        payment_method: paymentMethod,
        status: mainStatus,
        updated_at: new Date().toISOString()
      }).eq('id', orderId);
    }
  }

  // 3. Descontar de la deuda acumulada del cliente en cuenta corriente
  const { data: customer } = await supabase
    .from('customers')
    .select('debt_amount')
    .eq('id', customerId)
    .single();

  if (customer) {
    const prevDebt = Number(customer.debt_amount || 0);
    const newDebt = Math.max(0, +(prevDebt - amount).toFixed(2));
    const newPayStatus = newDebt === 0 ? 'Al Día' : 'Con Deuda';

    await supabase.from('customers').update({
      debt_amount: newDebt,
      payment_status: newPayStatus,
      cobro_notes: `Pago registrado: $${amount.toLocaleString('es-AR')} (${paymentMethod})`
    }).eq('id', customerId);
  }

  return true;
}

export async function fetchCustomerPayments(customerId: string): Promise<CustomerPayment[]> {
  const { data, error } = await supabase
    .from('customer_payments')
    .select(`
      *,
      order:orders(*)
    `)
    .eq('customer_id', customerId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
  return data || [];
}

export async function fetchCustomerFavoriteProducts(customerId: string): Promise<Array<{
  productId: string;
  name: string;
  unit: string;
  totalQty: number;
  totalSpent: number;
  orderCount: number;
}>> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      items:order_items(
        product_id,
        product_name,
        unit,
        actual_qty_weight,
        requested_qty,
        subtotal
      )
    `)
    .eq('customer_id', customerId);

  if (error || !data) return [];

  const map: Record<string, {
    productId: string;
    name: string;
    unit: string;
    totalQty: number;
    totalSpent: number;
    orderCount: number;
  }> = {};

  data.forEach(order => {
    (order.items || []).forEach((item: any) => {
      const pId = item.product_id || item.product_name;
      const qty = Number(item.actual_qty_weight || item.requested_qty || 0);
      const spent = Number(item.subtotal || 0);

      if (!map[pId]) {
        map[pId] = {
          productId: pId,
          name: item.product_name || 'Fiambre',
          unit: item.unit || 'kg',
          totalQty: 0,
          totalSpent: 0,
          orderCount: 0
        };
      }
      map[pId].totalQty += qty;
      map[pId].totalSpent += spent;
      map[pId].orderCount += 1;
    });
  });

  return Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
}

// Historial de precios de producto
export async function fetchPriceHistory(productId: string): Promise<ProductPriceHistory[]> {
  const { data, error } = await supabase
    .from('product_price_history')
    .select('*')
    .eq('product_id', productId)
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
  return data || [];
}

export async function recordPriceChange(params: {
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldCostPrice?: number;
  newCostPrice?: number;
  notes?: string;
}): Promise<boolean> {
  const { productId, oldPrice, newPrice, oldCostPrice = 0, newCostPrice = 0, notes } = params;

  let variation = 0;
  if (oldPrice > 0) {
    variation = +(((newPrice - oldPrice) / oldPrice) * 100).toFixed(2);
  }

  const { error } = await supabase.from('product_price_history').insert({
    product_id: productId,
    old_price: oldPrice,
    new_price: newPrice,
    old_cost_price: oldCostPrice,
    new_cost_price: newCostPrice,
    variation_percentage: variation,
    notes: notes || `Variación de precio: ${variation >= 0 ? '+' : ''}${variation}%`
  });

  return !error;
}
