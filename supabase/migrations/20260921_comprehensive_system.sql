-- =================================================================
-- MIGRACIÓN INTEGRAL: FIAMBRERÍA MAMÁ
-- Pedidos con decimales, Cta. Cte., Cobranzas, Historial de Precios y Rutas
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Actualizar tabla de CLIENTES con columnas de control financiero y ruta
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS visit_day VARCHAR(20) DEFAULT 'Lunes',
ADD COLUMN IF NOT EXISTS debt_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_order_details TEXT,
ADD COLUMN IF NOT EXISTS last_order_amount NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_order_date DATE,
ADD COLUMN IF NOT EXISTS cobro_date DATE,
ADD COLUMN IF NOT EXISTS cobro_notes VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Al Día',
ADD COLUMN IF NOT EXISTS is_referred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_day VARCHAR(20) DEFAULT 'Lunes';

-- 2. Actualizar tabla de PRODUCTOS con costos, stock y venta fraccionada
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(12, 3) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC(12, 3) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS allows_decimals BOOLEAN DEFAULT TRUE;

-- 3. Tabla de HISTORIAL DE VARIACIONES DE PRECIO DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    old_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    new_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    old_cost_price NUMERIC(12, 2) DEFAULT 0.00,
    new_cost_price NUMERIC(12, 2) DEFAULT 0.00,
    variation_percentage NUMERIC(8, 2) DEFAULT 0.00,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de PEDIDOS / ÓRDENES DE VENTA
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    order_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE + INTERVAL '7 days',
    status VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'DESPACHADO', 'COBRADO', 'CANCELADO'
    estimated_total NUMERIC(12, 2) DEFAULT 0.00,
    actual_total NUMERIC(12, 2) DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'COBRADO_PARCIAL', 'COBRADO_TOTAL'
    payment_method VARCHAR(50) DEFAULT 'PENDIENTE', -- 'EFECTIVO', 'TRANSFERENCIA', 'PENDIENTE'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de ÍTEMS DEL PEDIDO (soporta pesos fraccionados ej: 1.500 kg)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    requested_qty NUMERIC(12, 3) NOT NULL DEFAULT 1.000,
    actual_qty_weight NUMERIC(12, 3) DEFAULT 1.000,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    unit VARCHAR(30) DEFAULT 'kg',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de PAGOS Y COBRANZAS (relacionados al cliente y al pedido o a cuenta)
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO', -- 'EFECTIVO', 'TRANSFERENCIA'
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tablas de Proveedores y Compras (para módulo de stock)
CREATE TABLE IF NOT EXISTS public.supplier_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(150) NOT NULL DEFAULT 'Distribuidora',
    invoice_number VARCHAR(100),
    purchase_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES public.supplier_purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- HABILITAR RLS Y POLÍTICAS PERMISIVAS
-- =================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchase_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read customers" ON public.customers;
    DROP POLICY IF EXISTS "Public write customers" ON public.customers;
    CREATE POLICY "Public read customers" ON public.customers FOR SELECT TO public USING (true);
    CREATE POLICY "Public write customers" ON public.customers FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read products" ON public.products;
    DROP POLICY IF EXISTS "Public write products" ON public.products;
    CREATE POLICY "Public read products" ON public.products FOR SELECT TO public USING (true);
    CREATE POLICY "Public write products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read orders" ON public.orders;
    DROP POLICY IF EXISTS "Public write orders" ON public.orders;
    CREATE POLICY "Public read orders" ON public.orders FOR SELECT TO public USING (true);
    CREATE POLICY "Public write orders" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
    DROP POLICY IF EXISTS "Public write order_items" ON public.order_items;
    CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT TO public USING (true);
    CREATE POLICY "Public write order_items" ON public.order_items FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read customer_payments" ON public.customer_payments;
    DROP POLICY IF EXISTS "Public write customer_payments" ON public.customer_payments;
    CREATE POLICY "Public read customer_payments" ON public.customer_payments FOR SELECT TO public USING (true);
    CREATE POLICY "Public write customer_payments" ON public.customer_payments FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read product_price_history" ON public.product_price_history;
    DROP POLICY IF EXISTS "Public write product_price_history" ON public.product_price_history;
    CREATE POLICY "Public read product_price_history" ON public.product_price_history FOR SELECT TO public USING (true);
    CREATE POLICY "Public write product_price_history" ON public.product_price_history FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read supplier_purchases" ON public.supplier_purchases;
    DROP POLICY IF EXISTS "Public write supplier_purchases" ON public.supplier_purchases;
    CREATE POLICY "Public read supplier_purchases" ON public.supplier_purchases FOR SELECT TO public USING (true);
    CREATE POLICY "Public write supplier_purchases" ON public.supplier_purchases FOR ALL TO public USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read supplier_purchase_items" ON public.supplier_purchase_items;
    DROP POLICY IF EXISTS "Public write supplier_purchase_items" ON public.supplier_purchase_items;
    CREATE POLICY "Public read supplier_purchase_items" ON public.supplier_purchase_items FOR SELECT TO public USING (true);
    CREATE POLICY "Public write supplier_purchase_items" ON public.supplier_purchase_items FOR ALL TO public USING (true) WITH CHECK (true);
END $$;
