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
  
  // CAMPOS DE CONTROL DIARIO EXTRAÍDOS DE LAS FOTOS DEL CUADERNO
  last_order_details?: string;
  last_order_amount: number;
  last_order_date: string; // YYYY-MM-DD (2026-07-28, 2026-07-29, 2026-07-30, 2026-07-31)
  debt_amount: number;     // Deuda pendiente
  cobro_date: string;      // Fecha de cobro agendada
  cobro_notes?: string;    // ej: "Pasaron para el Martes Rendido"
  payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'PENDIENTE';
  payment_status: 'PENDIENTE' | 'COBRADO_PARCIAL' | 'COBRADO_TOTAL' | 'POSPUESTO';
  
  created_at?: string;
  updated_at?: string;
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
