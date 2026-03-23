import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function getAdelantos() {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT 
      a.*,
      t.TR_NOMBRES,
      t.TR_APELLIDOS
    FROM KS_ADELANTOS a
    JOIN KS_TRABAJADORES t ON a.TR_IDTRABAJADOR_FK = t.TR_IDTRABAJADOR_PK
    ORDER BY a.AD_FECHA DESC, a.AD_FECHA_CREACION DESC
  `);
  return rows;
}

export async function getAdelantosPendientes() {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT 
      a.*,
      t.TR_NOMBRES,
      t.TR_APELLIDOS
    FROM KS_ADELANTOS a
    JOIN KS_TRABAJADORES t ON a.TR_IDTRABAJADOR_FK = t.TR_IDTRABAJADOR_PK
    WHERE a.AD_ESTADO = 'PENDIENTE'
    ORDER BY a.AD_FECHA DESC
  `);
  return rows;
}

export async function getAdelantosByTrabajador(trabajadorId: number) {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT *
    FROM KS_ADELANTOS
    WHERE TR_IDTRABAJADOR_FK = ?
    ORDER BY AD_FECHA DESC
  `, [trabajadorId]);
  return rows;
}
