import { Pool, type QueryResultRow } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const shouldUseSsl =
  Boolean(process.env.RENDER) ||
  DATABASE_URL?.includes("sslmode=require") ||
  process.env.PGSSL === "true";

let pool: Pool | null = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  });
}

export const isDatabaseConfigured = () => Boolean(pool);

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  if (!pool) {
    throw new Error("DATABASE_URL no esta configurada");
  }

  return pool.query<T>(text, params);
}

export async function initializeDatabase(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE,
      delivery_date DATE NOT NULL,
      status TEXT NOT NULL,
      advance NUMERIC(12,2) NOT NULL DEFAULT 0,
      balance NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      items JSONB NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      city TEXT NOT NULL,
      date DATE NOT NULL,
      reference TEXT NOT NULL,
      validity_days INTEGER NOT NULL DEFAULT 15,
      status TEXT NOT NULL,
      advance_percentage INTEGER NOT NULL DEFAULT 60,
      balance_percentage INTEGER NOT NULL DEFAULT 40,
      notes TEXT NOT NULL DEFAULT '',
      intro TEXT NOT NULL DEFAULT '',
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      items JSONB NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      city TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      logo_letters TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      footer_note TEXT NOT NULL,
      signatures JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);
}
