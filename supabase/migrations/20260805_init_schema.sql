-- =================================================================
-- MIGRACIÓN BASE DE DATOS: FIAMBRERÍA Y DELICATESSEN "MAMÁ"
-- Incluye Control de Cuentas Corrientes, Deudas y Fechas de Cobro
-- =================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE CATEGORÍAS DE FIAMBRES Y QUESOS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PRODUCTOS Y PRECIOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(30) NOT NULL DEFAULT '100g',
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    badge_text VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE PROMOCIONES / COMBOS
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    original_price NUMERIC(10, 2),
    promo_price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    valid_until TIMESTAMP WITH TIME ZONE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE CONTENIDO EDITABLE DE LA PÁGINA
CREATE TABLE IF NOT EXISTS public.page_content (
    key VARCHAR(100) PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE CLIENTES CON CUENTA CORRIENTE, DEUDAS Y FECHAS DE COBRO
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    google_maps_url TEXT,
    
    -- CAMPOS DE CONTROL FINANCIERO Y LIBRO DE ANOTACIONES
    last_order_details TEXT,             -- Qué compró en el pedido anterior (ej: 5kg Jamón Crudo + 3kg Gouda)
    last_order_amount NUMERIC(10, 2) DEFAULT 0.00, -- Monto del pedido anterior (ej: $ 29.800)
    last_order_date DATE,                -- Fecha del pedido anterior
    debt_amount NUMERIC(10, 2) DEFAULT 0.00,       -- Cuánto dejó debiendo (ej: $ 15.000)
    cobro_date DATE,                     -- Fecha programada para cobrarle (ej: 2026-08-07)
    cobro_notes VARCHAR(200),            -- Ej: "Pasaron para el Martes en la tarde", "Paga en efectivo"
    payment_status VARCHAR(50) DEFAULT 'Al Día',   -- 'Al Día', 'Con Deuda', 'Cobro Pendiente'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE HISTORIAL DE COMPRAS Y PAGOS DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customer_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'COMPRA' o 'PAGO'
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- CONFIGURACIÓN DE SEGURIDAD RLS (Row Level Security)
-- =================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
DROP POLICY IF EXISTS "Public read available products" ON public.products;
DROP POLICY IF EXISTS "Admin write products" ON public.products;
DROP POLICY IF EXISTS "Public read promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admin write promotions" ON public.promotions;
DROP POLICY IF EXISTS "Public read page_content" ON public.page_content;
DROP POLICY IF EXISTS "Admin write page_content" ON public.page_content;
DROP POLICY IF EXISTS "Admin read customers" ON public.customers;
DROP POLICY IF EXISTS "Admin write customers" ON public.customers;
DROP POLICY IF EXISTS "Admin read customer_transactions" ON public.customer_transactions;
DROP POLICY IF EXISTS "Admin write customer_transactions" ON public.customer_transactions;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read available products" ON public.products FOR SELECT TO public USING (is_available = true OR auth.role() = 'authenticated');
CREATE POLICY "Admin write products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read promotions" ON public.promotions FOR SELECT TO public USING (is_active = true OR auth.role() = 'authenticated');
CREATE POLICY "Admin write promotions" ON public.promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read page_content" ON public.page_content FOR SELECT TO public USING (true);
CREATE POLICY "Admin write page_content" ON public.page_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin read customer_transactions" ON public.customer_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write customer_transactions" ON public.customer_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
