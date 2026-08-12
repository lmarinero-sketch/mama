import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('🚀 Inicializando datos de Supabase para Fiambrería Mamá...');

  // 1. Crear buckets de almacenamiento
  try {
    const { data: bucket, error: bErr } = await supabase.storage.createBucket('product-images', {
      public: true
    });
    if (bErr && !bErr.message.includes('already exists')) {
      console.log('⚠️ Aviso Storage Bucket:', bErr.message);
    } else {
      console.log('✅ Bucket "product-images" verificado en Supabase Storage');
    }
  } catch (e) {
    console.log('⚠️ Error al crear bucket:', e);
  }

  // 2. Insertar Categorías Iniciales
  const categories = [
    { name: 'Fiambres Cocidos', slug: 'fiambres-cocidos', sort_order: 1 },
    { name: 'Curados y Embutidos', slug: 'curados-embutidos', sort_order: 2 },
    { name: 'Quesos Blandos y Cremosos', slug: 'quesos-blandos', sort_order: 3 },
    { name: 'Quesos Estacionados', slug: 'quesos-estacionados', sort_order: 4 },
    { name: 'Combos y Picadas', slug: 'combos-picadas', sort_order: 5 }
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) console.log(`⚠️ Aviso al insertar categoría ${cat.name}:`, error.message);
  }
  console.log('✅ Categorías sincronizadas en Supabase DB');

  // 3. Insertar Contenido del Editor Visual (page_content)
  const heroContent = {
    title: "Sabores Artesanales en Tu Mesa",
    subtitle: "Los mejores fiambres, embutidos y quesos seleccionados con la frescura que tu familia merece.",
    banner_image: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=1200&q=80",
    cta_text: "Ver Ofertas de Hoy",
    whatsapp_number: "5492641234567"
  };

  const storeInfo = {
    business_name: "Fiambrería y Delicatessen Mamá",
    schedule: "Lunes a Sábado de 09:00 a 13:30 hs y de 17:30 a 21:30 hs",
    address: "Av. Libertador 1234, San Juan",
    delivery_note: "¡Hacemos envíos gratis en compras superiores a $15.000!",
    whatsapp_number: "5492641234567"
  };

  await supabase.from('page_content').upsert({ key: 'hero_section', content: heroContent }, { onConflict: 'key' });
  await supabase.from('page_content').upsert({ key: 'store_info', content: storeInfo }, { onConflict: 'key' });

  console.log('✅ Contenido inicial del Editor Visual (page_content) listo en Supabase DB');
  console.log('✨ ¡Configuración finalizada con éxito!');
}

main().catch(console.error);
