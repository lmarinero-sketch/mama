import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('❌ Falta SUPABASE_DB_URL en el .env');
  process.exit(1);
}

async function runSQL() {
  console.log('🐘 Conectando a Supabase PostgreSQL para crear tablas DDL y RLS...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a Supabase Postgres');

    // 1. Ejecutar DDL init schema
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '20260805_init_schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Tablas y Políticas RLS creadas o verificadas exitosamente');

    // 2. Ejecutar Seed Data
    const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✅ Datos Semilla (Seed) insertados resguardando integridad existente');

  } catch (err) {
    console.error('❌ Error ejecutando migración PostgreSQL:', err);
  } finally {
    await client.end();
  }
}

runSQL();
