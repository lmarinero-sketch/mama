export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  unit: string;
  image_url?: string;
  is_featured: boolean;
  is_available: boolean;
  badge_text?: string;
  sort_order: number;
  stock_quantity?: number;
  min_stock_alert?: number;
  allows_decimals?: boolean;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  old_cost_price: number;
  new_cost_price: number;
  variation_percentage: number;
  notes?: string;
  changed_at: string;
  product?: Product;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  original_price?: number;
  promo_price: number;
  image_url?: string;
  is_active: boolean;
  valid_until?: string;
  sort_order: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  is_referred?: boolean;
  visit_day?: string; // 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'
  preferred_day?: string;
  
  // CAMPOS DE CONTROL FINANCIERO Y CUENTA CORRIENTE
  last_order_details?: string;
  last_order_amount: number;
  last_order_date?: string; // YYYY-MM-DD
  debt_amount: number;     // Deuda acumulada de cuenta corriente
  cobro_date?: string;      // Fecha programada de cobro
  cobro_notes?: string;
  payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'PENDIENTE';
  payment_status: 'Al Día' | 'Con Deuda' | 'Cobro Pendiente' | 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL';
  
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name?: string;
  requested_qty: number; // Soporta decimales: 1.5 kg, 0.45 kg, etc.
  actual_qty_weight?: number;
  unit_price: number;
  unit_cost?: number;
  unit?: string;
  subtotal: number;
  product?: Product;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number?: number;
  customer_id: string;
  order_date: string;
  due_date: string; // Fecha de cobro programada
  status: 'PENDIENTE' | 'DESPACHADO' | 'COBRADO' | 'CANCELADO';
  estimated_total: number;
  actual_total: number;
  paid_amount: number;
  payment_status: 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL';
  payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'PENDIENTE';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface CustomerPayment {
  id: string;
  customer_id: string;
  order_id?: string;
  amount: number;
  payment_method: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';
  payment_date: string;
  notes?: string;
  created_at?: string;
  customer?: Customer;
  order?: Order;
}

export interface SupplierPurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  product?: Product;
}

export interface SupplierPurchase {
  id: string;
  supplier_name: string;
  invoice_number?: string;
  purchase_date: string;
  total_amount: number;
  notes?: string;
  created_at?: string;
  items?: SupplierPurchaseItem[];
}

export interface DailyExpense {
  id: string;
  date: string;
  concept: string;
  amount: number;
}

export interface HeroSectionContent {
  title: string;
  subtitle: string;
  banner_image: string;
  cta_text: string;
  whatsapp_number: string;
}

export interface StoreInfoContent {
  business_name: string;
  schedule: string;
  address: string;
  delivery_note: string;
  whatsapp_number: string;
}

export interface PageContent<T = Record<string, any>> {
  key: string;
  content: T;
  updated_at?: string;
}
