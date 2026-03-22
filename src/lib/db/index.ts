import mysql from 'mysql2/promise';
import { env } from '@/lib/env';

// Singleton para el pool de conexiones para evitar fugas en desarrollo
const globalForDb = global as unknown as {
  db: mysql.Pool | undefined;
}

export const db = globalForDb.db ?? mysql.createPool({
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

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
