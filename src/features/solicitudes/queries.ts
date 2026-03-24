import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function getSolicitudes(sucursalId?: number) {
  let query = `
    SELECT 
      sp.*, 
      p.PR_NOMBRE as producto_nombre,
      s.SC_NOMBRE as sucursal_nombre,
      t.TR_NOMBRE as trabajador_solicita
    FROM KS_SOLICITUDES_PRODUCTOS sp
    JOIN KS_PRODUCTOS p ON sp.PR_IDPRODUCTO_FK = p.PR_IDPRODUCTO_PK
    JOIN KS_SUCURSALES s ON sp.SC_IDSUCURSAL_FK = s.SC_IDSUCURSAL_PK
    LEFT JOIN KS_TRABAJADORES t ON sp.TR_IDTRABAJADOR_FK = t.TR_IDTRABAJADOR_PK
    WHERE 1=1
  `;
  const params: any[] = [];

  if (sucursalId) {
    query += ` AND sp.SC_IDSUCURSAL_FK = ?`;
    params.push(sucursalId);
  }

  query += ` ORDER BY sp.SP_FECHA_SOLICITUD DESC`;

  const [rows] = await db.query<RowDataPacket[]>(query, params);
  return rows;
}

export async function getSolicitudById(id: number) {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT 
      sp.*, 
      p.PR_NOMBRE as producto_nombre,
      s.SC_NOMBRE as sucursal_nombre,
      t.TR_NOMBRE as trabajador_solicita
    FROM KS_SOLICITUDES_PRODUCTOS sp
    JOIN KS_PRODUCTOS p ON sp.PR_IDPRODUCTO_FK = p.PR_IDPRODUCTO_PK
    JOIN KS_SUCURSALES s ON sp.SC_IDSUCURSAL_FK = s.SC_IDSUCURSAL_PK
    LEFT JOIN KS_TRABAJADORES t ON sp.TR_IDTRABAJADOR_FK = t.TR_IDTRABAJADOR_PK
    WHERE sp.SP_IDSOLICITUD_PK = ?
  `, [id]);
  return rows[0] || null;
}
