import fs from "fs";
import path from "path";
import Database, { type RunResult } from "better-sqlite3";
import type { Pool, QueryResultRow, QueryResult } from "pg";
import { fileURLToPath } from "url";

type QueryResultShim<T extends QueryResultRow = QueryResultRow> = {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: unknown[];
};

type Driver =
  | { kind: "sqlite"; db: Database.Database }
  | { kind: "pg"; pool: Pool };

let driver: Driver | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const defaultSqlitePath = process.env.SQLITE_PATH
  ? path.isAbsolute(process.env.SQLITE_PATH)
    ? process.env.SQLITE_PATH
    : path.resolve(projectRoot, process.env.SQLITE_PATH)
  : path.join(projectRoot, "gisselle.sqlite");

const DATABASE_URL = process.env.DATABASE_URL;
const forceSqlite = process.env.DB_DRIVER?.toLowerCase() === "sqlite";
const forcePg = process.env.DB_DRIVER?.toLowerCase() === "pg";
const shouldUsePg =
  forcePg || (!forceSqlite && Boolean(DATABASE_URL));

function buildPgPool(connectionString: string): Pool {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require("pg") as typeof import("pg");
  const shouldUseSsl =
    Boolean(process.env.RENDER) ||
    connectionString.includes("sslmode=require") ||
    process.env.PGSSL === "true";
  return new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

function buildSqlite(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  return db;
}

try {
  if (shouldUsePg) {
    const pool = buildPgPool(DATABASE_URL!);
    pool.on("error", (err: Error) => {
      console.error("[ERROR] PostgreSQL pool error (no fatal):", err.message);
    });
    pool.on("connect", () => {
      console.log("[INFO] PostgreSQL client connected");
    });
    driver = { kind: "pg", pool };
    console.log(`[INFO] Database driver: PostgreSQL (DATABASE_URL set)`);
  } else {
    const db = buildSqlite(defaultSqlitePath);
    db.on("error", (err: Error) => {
      console.error("[ERROR] SQLite error (no fatal):", err.message);
    });
    driver = { kind: "sqlite", db };
    console.log(`[INFO] Database driver: SQLite (${defaultSqlitePath})`);
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[ERROR] No se pudo inicializar capa de base de datos: ${msg}`);
  console.warn(`[WARN] Fallback a SQLite en memoria...`);
  const inMem = new Database(":memory:");
  inMem.pragma("journal_mode = MEMORY");
  inMem.pragma("foreign_keys = ON");
  driver = { kind: "sqlite", db: inMem };
}

export const isDatabaseConfigured = () => Boolean(driver);

function normalizeParams(params: unknown[] | undefined): unknown[] {
  const arr = params ?? [];
  return arr.map((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "bigint") return String(v);
    if (typeof v === "object" && v instanceof Date) return v.toISOString();
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  });
}

function shimResult<T extends QueryResultRow = QueryResultRow>(
  rows: T[],
  changes: number = 0,
): QueryResultShim<T> {
  return {
    rows,
    rowCount: rows.length || changes,
    command: "",
    oid: 0,
    fields: [],
  };
}

function convertPlaceholder(text: string): { sql: string; paramCount: number } {
  let paramCount = 0;
  let j = 0;
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "$") {
      // read digits after $
      let k = i + 1;
      while (k < text.length && /\d/.test(text[k])) k++;
      if (k > i + 1) {
        paramCount++;
        j++;
        out.push("?");
        i = k - 1;
        continue;
      }
    }
    out.push(c);
  }
  return { sql: out.join(""), paramCount: Math.max(paramCount, j) };
}

function splitSqlStatements(multiSql: string): string[] {
  // simple split by semicolons while respecting strings/comments
  const statements: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < multiSql.length; i++) {
    const ch = multiSql[i];
    const next = multiSql[i + 1];
    buf += ch;
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        buf += next;
        i++;
      }
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = !inSingle;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = !inDouble;
      continue;
    }
    if (ch === "-" && next === "-") {
      inLineComment = true;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      continue;
    }
    if (ch === "'") inSingle = true;
    else if (ch === '"') inDouble = true;
    else if (ch === ";") {
      statements.push(buf);
      buf = "";
    }
  }
  if (buf.trim().length > 0) statements.push(buf);
  return statements.filter((s) => s.trim().length > 0);
}

function prepareValuesForSqliteInsert(
  rowsLike: unknown[],
  paramCount: number,
): unknown[] {
  if (rowsLike.length === 0) return rowsLike;
  // If params length matches paramCount directly, use as is
  if (rowsLike.length === paramCount) return rowsLike;
  // Otherwise treat as a flat list that needs to match placeholders
  return rowsLike;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  if (!driver) {
    throw new Error("Database driver no inicializado");
  }

  if (driver.kind === "pg") {
    try {
      return (await driver.pool.query<T>(text, params)) as QueryResult<T>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] pg query fallida: ${msg}. SQL: ${text.slice(0, 120)}`);
      throw err;
    }
  }

  const { sql: sqliteSql } = convertPlaceholder(text);
  const normParams = normalizeParams(params);

  try {
    const isMulti = /;/.test(sqliteSql) && sqliteSql.trim().toUpperCase().includes("CREATE TABLE");
    if (isMulti) {
      const statements = splitSqlStatements(sqliteSql);
      for (const stmt of statements) {
        driver.db.prepare(stmt).run();
      }
      return shimResult<T>([], 0) as unknown as QueryResult<T>;
    }

    const stmt = driver.db.prepare(sqliteSql);
    const trimmed = sqliteSql.trim().toUpperCase();
    const startsWith = (p: string) => trimmed.startsWith(p);

    if (
      startsWith("INSERT") ||
      startsWith("UPDATE") ||
      startsWith("DELETE") ||
      startsWith("CREATE") ||
      startsWith("DROP") ||
      startsWith("ALTER")
    ) {
      const runParams = prepareValuesForSqliteInsert(normParams, sqliteSql.split("?").length - 1);
      const info: RunResult =
        runParams.length > 0 ? stmt.run(...runParams) : stmt.run();
      return shimResult<T>([], info.changes ?? 0) as unknown as QueryResult<T>;
    }

    const readParams = prepareValuesForSqliteInsert(normParams, sqliteSql.split("?").length - 1);
    const rows = (
      readParams.length > 0 ? stmt.all(...readParams) : stmt.all()
    ) as T[];
    return shimResult<T>(rows, rows.length) as unknown as QueryResult<T>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[ERROR] sqlite query fallida: ${msg}. SQL: ${sqliteSql.slice(0, 120)}`,
    );
    throw err;
  }
}

export async function initializeDatabase(): Promise<void> {
  if (!driver) return;

  const driverKind = driver.kind;
  console.log(`[INFO] Inicializando tablas para ${driverKind}...`);

  if (driverKind === "pg") {
    await query(`
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
    console.log("[INFO] Tablas PostgreSQL verificadas/creadas correctamente.");
    return;
  }

  // SQLite (columna TEXT para JSON y sin BOOLEAN/NUMERIC específicos, compatibles)
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (date('now')),
      delivery_date TEXT NOT NULL,
      status TEXT NOT NULL,
      advance REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      items TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      city TEXT NOT NULL,
      date TEXT NOT NULL,
      reference TEXT NOT NULL,
      validity_days INTEGER NOT NULL DEFAULT 15,
      status TEXT NOT NULL,
      advance_percentage INTEGER NOT NULL DEFAULT 60,
      balance_percentage INTEGER NOT NULL DEFAULT 40,
      notes TEXT NOT NULL DEFAULT '',
      intro TEXT NOT NULL DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
      items TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      city TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      logo_letters TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      footer_note TEXT NOT NULL,
      signatures TEXT NOT NULL DEFAULT '[]'
    );
  `);

  console.log(`[INFO] Tablas SQLite verificadas/creadas correctamente.`);
}
