'use server'

import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";
import { ValeFormData, valeSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

/**
 * Crear un vale y generar su plan de cuotas semanales
 */
export async function crearValeCompletado(data: ValeFormData): Promise<ApiResponse> {
  const connection = await db.getConnection();
  try {
    const validated = valeSchema.parse(data);
    await connection.beginTransaction();

    const valorCuota = validated.VL_VALOR_TOTAL / validated.VL_NUMERO_CUOTAS;

    // 1. Insertar Servicio principal
    const [valeResult]: any = await (connection as any).execute(
      `INSERT INTO KS_SERVICIOS_TRABAJADOR (ST_VALOR_TOTAL, ST_NUMERO_CUOTAS, ST_VALOR_CUOTA, ST_ESTADO, ST_FECHA_INICIO_COBRO, TR_IDTRABAJADOR_FK, FC_IDFACTURA_FK)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validated.VL_VALOR_TOTAL,
        validated.VL_NUMERO_CUOTAS,
        valorCuota,
        'PENDIENTE',
        validated.VL_FECHA_INICIO_COBRO,
        validated.TR_IDTRABAJADOR_FK,
        validated.FC_IDFACTURA_FK || null
      ]
    );

    const valeId = valeResult.insertId;

    // 2. Generar Plan de Cuotas Semanales
    for (let i = 0; i < validated.VL_NUMERO_CUOTAS; i++) {
      const fechaCobro = addDays(validated.VL_FECHA_INICIO_COBRO, i * 7);
      await (connection as any).execute(
        `INSERT INTO KS_SERVICIO_TRABAJADOR_CUOTAS (STC_NUMERO_CUOTA, STC_VALOR_CUOTA, STC_ESTADO, STC_FECHA_COBRO, ST_IDSERVICIO_TRABAJADOR_FK)
           VALUES (?, ?, ?, ?, ?)`,
        [i + 1, valorCuota, 'PENDIENTE', fechaCobro, valeId]
      );
    }

    await connection.commit();
    revalidatePath("/dashboard/trabajadores");
    return { success: true, message: `Vale creado con ${validated.VL_NUMERO_CUOTAS} cuotas semanales.` };

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al crear vale:", error);
    return { success: false, error: "Error al crear el vale" };
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Obtener cuotas pendientes para una nómina (dentro de un rango de fechas)
 */
export async function getCuotasPendientes(workerId: number, startDate: Date, endDate: Date): Promise<ApiResponse> {
  try {
    const [rows] = await db.query(
      `SELECT stc.*, st.ST_VALOR_TOTAL 
           FROM KS_SERVICIO_TRABAJADOR_CUOTAS stc 
           JOIN KS_SERVICIOS_TRABAJADOR st ON stc.ST_IDSERVICIO_TRABAJADOR_FK = st.ST_IDSERVICIO_TRABAJADOR_PK
           WHERE st.TR_IDTRABAJADOR_FK = ? 
           AND stc.STC_ESTADO = 'PENDIENTE'
           AND stc.STC_FECHA_COBRO BETWEEN ? AND ?`,
      [workerId, startDate, endDate]
    ) as any;
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: "Error al obtener cuotas" };
  }
}

/**
 * Obtener todas las cuotas asociadas a un servicio específico
 */
export async function getCuotasByService(serviceId: number): Promise<ApiResponse> {
  try {
    const [rows] = await db.query(
      `SELECT * FROM KS_SERVICIO_TRABAJADOR_CUOTAS 
       WHERE ST_IDSERVICIO_TRABAJADOR_FK = ? 
       ORDER BY STC_NUMERO_CUOTA ASC`,
      [serviceId]
    );
    return { success: true, data: rows };
  } catch (error) {
    console.error("Error al obtener cuotas por servicio:", error);
    return { success: false, error: "Error al obtener el plan de cuotas" };
  }
}

