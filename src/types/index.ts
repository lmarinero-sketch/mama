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
  unit: string;
  image_url?: string;
  is_featured: boolean;
  is_available: boolean;
  badge_text?: string;
  sort_order: number;
  stock_quantity?: number;
  min_stock_alert?: number;
  category?: Category;
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
  preferred_day?: string;
  
  // CAMPOS DE CONTROL DIARIO EXTRAÍDOS DE LAS FOTOS DEL CUADERNO
  last_order_details?: string;
  last_order_amount: number;
  last_order_date: string; // YYYY-MM-DD
  debt_amount: number;     // Deuda pendiente
  cobro_date: string;      // Fecha de cobro agendada (7 días)
  cobro_notes?: string;    // ej: "Pasaron para el Martes Rendido"
  payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'PENDIENTE';
  payment_status: 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL' | 'POSPUESTO';
  
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  requested_qty: number;
  actual_qty_weight?: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  due_date: string; // Fecha de cobro a 7 días
  status: 'PENDIENTE' | 'DESPACHADO' | 'COBRADO' | 'CANCELADO';
  estimated_total: number;
  actual_total: number;
  payment_status: 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL';
  payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'PENDIENTE';
  notes?: string;
  created_at?: string;
  customer?: Customer;
  items?: OrderItem[];
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
