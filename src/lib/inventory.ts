import { supabase } from './supabase';
import { Product, SupplierPurchase, SupplierPurchaseItem } from '../types';

export async function fetchInventoryProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching inventory products:', error);
    return [];
  }
  return data || [];
}

export async function updateProductStock(productId: string, newStock: number): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) {
    console.error('Error updating stock:', error);
    return false;
  }
  return true;
}

export async function fetchSupplierPurchases(): Promise<SupplierPurchase[]> {
  const { data, error } = await supabase
    .from('supplier_purchases')
    .select(`
      *,
      items:supplier_purchase_items(
        *,
        product:products(*)
      )
    `)
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error('Error fetching supplier purchases:', error);
    return [];
  }
  return data || [];
}

export async function recordSupplierPurchase(
  supplierName: string,
  invoiceNumber: string,
  purchaseDate: string,
  items: Array<{ product_id: string; quantity: number; unit_cost: number }>,
  notes?: string
): Promise<boolean> {
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0);

  const { data: purchase, error: pErr } = await supabase
    .from('supplier_purchases')
    .insert({
      supplier_name: supplierName || 'Chileno',
      invoice_number: invoiceNumber,
      purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
      total_amount: totalAmount,
      notes
    })
    .select()
    .single();

  if (pErr || !purchase) {
    console.error('Error inserting supplier purchase:', pErr);
    return false;
  }

  // Insertar ítems y aumentar stock
  for (const item of items) {
    const subtotal = item.quantity * item.unit_cost;
    await supabase.from('supplier_purchase_items').insert({
      purchase_id: purchase.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      subtotal
    });

    // Incrementar stock en productos
    const { data: prod } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single();

    const currentStock = prod?.stock_quantity || 0;
    await supabase
      .from('products')
      .update({ stock_quantity: currentStock + item.quantity })
      .eq('id', item.product_id);
  }

  return true;
}
