// src/db.ts
// ⚠️ asegúrate de tener: "esModuleInterop": true, "allowSyntheticDefaultImports": true en tsconfig
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Ruta de la BD (en /data, relativo al proyecto)
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'todo.db');

// Intentar schema.sql en la misma carpeta del archivo compilado (dist/)
let SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Si no existe (caso común porque schema.sql está en src/), probamos en src/
if (!fs.existsSync(SCHEMA_PATH)) {
  SCHEMA_PATH = path.join(__dirname, '..', 'src', 'schema.sql');
}

// Asegurar carpeta data
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Ejecutar migración simple
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// Helpers
export function run(query: string, params: Record<string, unknown> = {}) {
  const stmt = db.prepare(query);
  return stmt.run(params); // { changes, lastInsertRowid }
}

export function get<T = unknown>(query: string, params: Record<string, unknown> = {}): T | undefined {
  const stmt = db.prepare(query);
  return stmt.get(params) as T | undefined;
}

export function all<T = unknown>(query: string, params: Record<string, unknown> = {}): T[] {
  const stmt = db.prepare(query);
  return stmt.all(params) as T[];
}
