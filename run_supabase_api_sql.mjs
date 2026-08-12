import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const projectRef = 'pxvhovctyewwppwkldaq';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ Falta SUPABASE_ACCESS_TOKEN en .env');
  process.exit(1);
}

async function runSQLViaApi(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`❌ Error en consulta API (${res.status}):`, txt);
    return false;
  }
  return true;
}

async function main() {
  console.log('⚡ Ejecutando SQL DDL y RLS a través de Supabase Management API...');
  
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '20260805_init_schema.sql'), 'utf-8');
  const ok1 = await runSQLViaApi(schemaSql);

  if (ok1) {
    console.log('✅ Esquema DDL y Políticas RLS aplicadas en la base de datos de Supabase!');
    const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf-8');
    const ok2 = await runSQLViaApi(seedSql);
    if (ok2) {
      console.log('✅ Datos semilla cargados con éxito resguardando integridad.');
    }
  }
}

main().catch(console.error);
