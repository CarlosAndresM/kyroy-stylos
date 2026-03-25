import mysql from 'mysql2/promise';
import { env } from '@/lib/env';

const globalForDb = global as unknown as {
  db: mysql.Pool | undefined;
}

const pool = globalForDb.db ?? mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: parseInt(env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

if (process.env.NODE_ENV !== 'production') globalForDb.db = pool;

// --- AQUÍ ESTÁ EL TRUCO ---
// Creamos un objeto que imita al pool pero intercepta el SQL
export const db = {
  ...pool,
  execute: async (sql: string, params?: any) => {
    // Esta regex busca nombres de tablas en MAYÚSCULAS y los pasa a minúsculas
    const fixedSql = sql.replace(/(FROM|JOIN|UPDATE|INTO|TABLE)\s+([A-Z0-9_]+)/gi, (match, op, table) => {
      return `${op} ${table.toLowerCase()}`;
    });
    return pool.execute(fixedSql, params);
  },
  query: async (sql: string, params?: any) => {
    const fixedSql = sql.replace(/(FROM|JOIN|UPDATE|INTO|TABLE)\s+([A-Z0-9_]+)/gi, (match, op, table) => {
      return `${op} ${table.toLowerCase()}`;
    });
    return pool.query(fixedSql, params);
  }
} as mysql.Pool;