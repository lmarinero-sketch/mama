-- =================================================================
-- DATOS DE DEMOSTRACIÓN (SEED DATA) - FIAMBRERÍA MAMÁ
-- Utiliza ON CONFLICT para resguardar la integridad sin sobrescribir
-- =================================================================

-- 1. Insertar Categorías
INSERT INTO public.categories (name, slug, sort_order) VALUES
('Fiambres Cocidos', 'fiambres-cocidos', 1),
('Curados y Embutidos', 'curados-embutidos', 2),
('Quesos Blandos y Cremosos', 'quesos-blandos', 3),
('Quesos Estacionados', 'quesos-estacionados', 4),
('Combos y Picadas', 'combos-picadas', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insertar Contenido Inicial del Editor Visual Wix-Style
INSERT INTO public.page_content (key, content) VALUES
('hero_section', '{
  "title": "Sabores Artesanales en Tu Mesa",
  "subtitle": "Los mejores fiambres, embutidos y quesos seleccionados con la frescura que tu familia merece.",
  "banner_image": "https://images.unsplash.com/photo-1541529086526-db283c563270?w=1200&q=80",
  "cta_text": "Ver Ofertas de Hoy",
  "whatsapp_number": "5492641234567"
}'),
('store_info', '{
  "business_name": "Fiambrería y Delicatessen Mamá",
  "schedule": "Lunes a Sábado de 09:00 a 13:30 hs y de 17:30 a 21:30 hs",
  "address": "Av. Libertador 1234, San Juan",
  "delivery_note": "¡Hacemos envíos gratis en compras superiores a $15.000!",
  "whatsapp_number": "5492641234567"
}')
ON CONFLICT (key) DO NOTHING;
