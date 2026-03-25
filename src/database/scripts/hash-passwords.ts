import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

function isHashed(password: string): boolean {
  if (!password) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    console.log('--- Iniciando migración de contraseñas ---');

    // Usamos minúsculas para los nombres de las tablas según la observación del usuario
    const [rows]: any = await connection.execute('SELECT tr_idtrabajador_pk, tr_nombre, tr_password FROM ks_trabajadores');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const password = row.tr_password;
      const id = row.tr_idtrabajador_pk;
      const name = row.tr_nombre;

      if (!password) {
        console.log(`Skipping ${name} (no password set)`);
        skippedCount++;
        continue;
      }

      if (isHashed(password)) {
        console.log(`Skipping ${name} (already hashed)`);
        skippedCount++;
        continue;
      }

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      await connection.execute(
        'UPDATE ks_trabajadores SET tr_password = ? WHERE tr_idtrabajador_pk = ?',
        [hash, id]
      );

      console.log(`Updated password for: ${name}`);
      updatedCount++;
    }

    console.log(`--- Migración finalizada ---`);
    console.log(`Actualizados: ${updatedCount}`);
    console.log(`Omitidos: ${skippedCount}`);

  } catch (error: any) {
    console.error('Error durante la migración:', error.message);
  } finally {
    await connection.end();
  }
}

run();
