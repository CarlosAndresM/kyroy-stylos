import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

function isHashed(password: string): boolean {
  if (!password) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}

export async function hashPasswords(existingConnection?: mysql.Connection) {
  const connection = existingConnection || await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    console.log('--- Iniciando migración de contraseñas ---');

    // Usamos MAYÚSCULAS para cumplir con el estándar de la guía de estilo
    const [rows]: any = await connection.execute('SELECT TR_IDTRABAJADOR_PK, TR_NOMBRE, TR_PASSWORD FROM KS_TRABAJADORES');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const password = row.TR_PASSWORD;
      const id = row.TR_IDTRABAJADOR_PK;
      const name = row.TR_NOMBRE;

      if (!password) {
        console.log(`Skipping ${name} (no password set)`);
        skippedCount++;
        continue;
      }

      if (isHashed(password)) {
        skippedCount++;
        continue;
      }

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      await connection.execute(
        'UPDATE KS_TRABAJADORES SET TR_PASSWORD = ? WHERE TR_IDTRABAJADOR_PK = ?',
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
    if (!existingConnection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  hashPasswords();
}
