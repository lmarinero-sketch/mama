-- =================================================================
-- MIGRACIÓN DE TABLAS DE PEDIDOS A 7 DÍAS, STOCK Y COMPRAS DE PROVEEDORES
-- =================================================================

-- 1. Actualizar tabla de productos con columnas de stock
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC(10, 2) DEFAULT 5.00;

-- 2. Actualizar tabla de clientes con preferencia de día y tipo de cliente
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS is_referred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preferred_day VARCHAR(20) DEFAULT 'Miércoles';

-- 3. Tabla de Compras / Ingreso de Mercadería a Proveedores (ej: Chileno)
CREATE TABLE IF NOT EXISTS public.supplier_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(150) NOT NULL DEFAULT 'Chileno',
    invoice_number VARCHAR(100),
    purchase_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ítems de la Compra a Proveedor
CREATE TABLE IF NOT EXISTS public.supplier_purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES public.supplier_purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Pedidos / Boletas de Venta (Ruta Semanal y Cobro a 7 días)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    order_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE + INTERVAL '7 days',
    status VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'DESPACHADO', 'COBRADO', 'CANCELADO'
    estimated_total NUMERIC(10, 2) DEFAULT 0.00,
    actual_total NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'COBRADO_PARCIAL', 'COBRADO_TOTAL'
    payment_method VARCHAR(50) DEFAULT 'PENDIENTE', -- 'EFECTIVO', 'TRANSFERENCIA', 'PENDIENTE'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Ítems de la Boleta de Pedido (con Peso Estimado y Pesaje Real en Balanza)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    requested_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_qty_weight NUMERIC(10, 2) DEFAULT 0.00,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- SEGURIDAD RLS
-- =================================================================
ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read supplier_purchases" ON public.supplier_purchases;
DROP POLICY IF EXISTS "Admin write supplier_purchases" ON public.supplier_purchases;
DROP POLICY IF EXISTS "Admin read supplier_purchase_items" ON public.supplier_purchase_items;
DROP POLICY IF EXISTS "Admin write supplier_purchase_items" ON public.supplier_purchase_items;
DROP POLICY IF EXISTS "Admin read orders" ON public.orders;
DROP POLICY IF EXISTS "Admin write orders" ON public.orders;
DROP POLICY IF EXISTS "Admin read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admin write order_items" ON public.order_items;

CREATE POLICY "Admin read supplier_purchases" ON public.supplier_purchases FOR SELECT TO public USING (true);
CREATE POLICY "Admin write supplier_purchases" ON public.supplier_purchases FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Admin read supplier_purchase_items" ON public.supplier_purchase_items FOR SELECT TO public USING (true);
CREATE POLICY "Admin write supplier_purchase_items" ON public.supplier_purchase_items FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Admin read orders" ON public.orders FOR SELECT TO public USING (true);
CREATE POLICY "Admin write orders" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Admin read order_items" ON public.order_items FOR SELECT TO public USING (true);
CREATE POLICY "Admin write order_items" ON public.order_items FOR ALL TO public USING (true) WITH CHECK (true);
