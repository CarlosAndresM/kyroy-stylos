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
// Creamos un objeto que imita al pool pero intercepta el SQL y normaliza los resultados
const poolProxy = {
  ...pool,
  execute: async (sql: any, params?: any): Promise<[any, any]> => {
    // 1. Normalizar SQL para nombres de tabla en minúsculas (compatibilidad Linux)
    if (typeof sql === 'string') {
      const fixedSql = sql.replace(/(FROM|JOIN|UPDATE|INTO|TABLE)\s+([A-Z0-9_]+)/gi, (match, op, table) => {
        if (['SET', 'SELECT', 'WHERE', 'AND', 'DESC', 'ASC', 'VALUES'].includes(table.toUpperCase())) return match;
        return `${op} ${table.toLowerCase()}`;
      });
      sql = fixedSql;
    }

    const [rows, fields] = await pool.execute(sql, params);

    // 2. Normalizar las keys de los resultados a minúsculas MANTENIENDO las originales para compatibilidad
    if (Array.isArray(rows)) {
      const normalizedRows = rows.map((row: any) => {
        if (typeof row !== 'object' || row === null) return row;
        const normalized: any = {};
        for (const key in row) {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          normalized[key] = row[key];         // Mantener original
          normalized[lowerKey] = row[key];    // Forzar minúscula (para auth/services)
          normalized[upperKey] = row[key];    // Forzar mayúscula (para frontend/zod)
        }
        return normalized;
      });
      return [normalizedRows, fields];
    }

    return [rows, fields];
  },
  query: async (sql: any, params?: any): Promise<[any, any]> => {
    if (typeof sql === 'string') {
      const fixedSql = sql.replace(/(FROM|JOIN|UPDATE|INTO|TABLE)\s+([A-Z0-9_]+)/gi, (match, op, table) => {
        if (['SET', 'SELECT', 'WHERE', 'AND', 'DESC', 'ASC', 'VALUES'].includes(table.toUpperCase())) return match;
        return `${op} ${table.toLowerCase()}`;
      });
      sql = fixedSql;
    }

    const [rows, fields] = await pool.query(sql, params);

    if (Array.isArray(rows)) {
      const normalizedRows = rows.map((row: any) => {
        if (typeof row !== 'object' || row === null) return row;
        const normalized: any = {};
        for (const key in row) {
          const lowerKey = key.toLowerCase();
          const upperKey = key.toUpperCase();
          normalized[key] = row[key];
          normalized[lowerKey] = row[key];
          normalized[upperKey] = row[key];
        }
        return normalized;
      });
      return [normalizedRows, fields];
    }

    return [rows, fields];
  }
};

export const db = poolProxy as unknown as mysql.Pool;