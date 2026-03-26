import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { hashPasswords } from './hash-passwords';

// Cargar variables de entorno
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function seed() {
  console.log('🌱 Iniciando carga de datos de prueba...');

  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    const seedsDir = path.join(process.cwd(), 'src/database/seeds');

    if (!fs.existsSync(seedsDir)) {
      console.log('❌ No existe el directorio de seeds.');
      return;
    }

    const files = fs.readdirSync(seedsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      console.log(`- Aplicando seed: ${file}...`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');

      // Separar por ; pero ignorar si está dentro de comillas (simplificado)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await connection.query(statement);
      }
      console.log(`✅ Seed ${file} aplicado satisfactoriamente.`);
    }

    console.log('✨ Proceso de seeding completado.');

    // Ejecutar hashing de contraseñas automáticamente
    await hashPasswords(connection);

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
