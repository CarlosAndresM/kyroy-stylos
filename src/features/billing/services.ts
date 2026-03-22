'use server'

import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";
import { InvoiceFormData } from "@/features/billing/schema";
import { revalidatePath } from "next/cache";
import { finalizeUpload } from "@/lib/file-utils";

/**
 * Obtener técnicos disponibles
 */
export async function getTechnicians(): Promise<ApiResponse> {
  try {
    const [rows] = await db.execute(
      "SELECT TR_IDTRABAJADOR_PK, TR_NOMBRE FROM KS_TRABAJADORES WHERE RL_IDROL_FK = (SELECT RL_IDROL_PK FROM KS_ROLES WHERE RL_NOMBRE = 'TECNICO') AND TR_ACTIVO = TRUE"
    );
    return { success: true, data: rows, error: null };
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return { success: false, data: null, error: "Error al obtener técnicos" };
  }
}

/**
 * Obtener una factura completa por su ID (incluyendo detalles y pagos)
 */
export async function getInvoiceById(id: number): Promise<ApiResponse> {
  try {
    const [invoices]: any = await (db as any).execute(
      `SELECT f.*, 
       COALESCE(f.FC_CLIENTE_NOMBRE, t.TR_NOMBRE) as cliente_display,
       t.TR_IDTRABAJADOR_PK as TR_IDCLIENTE_FK
       FROM KS_FACTURAS f 
       LEFT JOIN KS_TRABAJADORES t ON f.TR_IDCLIENTE_FK = t.TR_IDTRABAJADOR_PK
       WHERE f.FC_IDFACTURA_PK = ?`,
      [id]
    );

    if (invoices.length === 0) {
      return { success: false, data: null, error: "Factura no encontrada" };
    }

    const invoice = invoices[0];

    // Fetch details
    const [services]: any = await (db as any).execute(
      "SELECT FD_VALOR, SV_IDSERVICIO_FK, TR_IDTECNICO_FK FROM KS_FACTURA_DETALLES WHERE FC_IDFACTURA_FK = ?",
      [id]
    );

    const [products]: any = await (db as any).execute(
      "SELECT FP_VALOR, PR_IDPRODUCTO_FK, TR_IDTECNICO_FK FROM KS_FACTURA_PRODUCTOS WHERE FC_IDFACTURA_FK = ?",
      [id]
    );

    const [payments]: any = await (db as any).execute(
      "SELECT PF_VALOR, PF_EVIDENCIA_URL, MP_IDMETODO_FK FROM KS_PAGOS_FACTURA WHERE FC_IDFACTURA_FK = ?",
      [id]
    );

    // Check if it's a vale
    const [vales]: any = await (db as any).execute(
      "SELECT 1 FROM KS_VALES WHERE FC_IDFACTURA_FK = ?",
      [id]
    );

    return {
      success: true,
      data: {
        ...invoice,
        services,
        products,
        payments,
        isVale: vales.length > 0
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return { success: false, data: null, error: "Error al obtener detalles de la factura" };
  }
}

/**
 * Guardar o Actualizar Factura
 */
export async function saveInvoice(data: InvoiceFormData): Promise<ApiResponse> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const isUpdate = !!data.FC_IDFACTURA_PK;
    let invoiceId = data.FC_IDFACTURA_PK;

    // 0. Si hay evidencia física, mover de temp
    let fizUrl = data.FC_EVIDENCIA_FISICA_URL;
    if (fizUrl && fizUrl.includes('/temp/')) {
      fizUrl = await finalizeUpload(fizUrl, data.FC_NUMERO_FACTURA || `FAC-${Date.now()}`);
    }

    if (isUpdate) {
      // ACTUALIZAR FACTURA BASE
      await (connection as any).execute(
        `UPDATE KS_FACTURAS SET 
          FC_NUMERO_FACTURA = ?, FC_FECHA = ?, FC_CLIENTE_NOMBRE = ?, 
          FC_CLIENTE_TELEFONO = ?, FC_TOTAL = ?, FC_ESTADO = ?, 
          SC_IDSUCURSAL_FK = ?, TR_IDCAJERO_FK = ?, FC_TIPO_CLIENTE = ?, 
          TR_IDCLIENTE_FK = ?, FC_EVIDENCIA_FISICA_URL = ?
         WHERE FC_IDFACTURA_PK = ?`,
        [
          data.FC_NUMERO_FACTURA,
          data.FC_FECHA,
          data.FC_TIPO_CLIENTE === 'CLIENTE' ? data.FC_CLIENTE_NOMBRE : null,
          data.FC_TIPO_CLIENTE === 'CLIENTE' ? data.FC_CLIENTE_TELEFONO : null,
          data.FC_TOTAL,
          data.FC_ESTADO,
          data.SC_IDSUCURSAL_FK,
          data.TR_IDCAJERO_FK,
          data.FC_TIPO_CLIENTE || 'CLIENTE',
          data.FC_TIPO_CLIENTE === 'TECNICO' ? data.TR_IDCLIENTE_FK : null,
          fizUrl || null,
          invoiceId
        ]
      );

      // Limpiar detalles previos para re-insertar
      await (connection as any).execute("DELETE FROM KS_FACTURA_DETALLES WHERE FC_IDFACTURA_FK = ?", [invoiceId]);
      await (connection as any).execute("DELETE FROM KS_FACTURA_PRODUCTOS WHERE FC_IDFACTURA_FK = ?", [invoiceId]);
      await (connection as any).execute("DELETE FROM KS_PAGOS_FACTURA WHERE FC_IDFACTURA_FK = ?", [invoiceId]);
      // Limpiar vale si existía (se recreará si sigue siendo vale)
      await (connection as any).execute("DELETE FROM KS_VALES WHERE FC_IDFACTURA_FK = ?", [invoiceId]);

    } else {
      // INSERTAR NUEVA FACTURA
      const [invoiceResult]: any = await (connection as any).execute(
        `INSERT INTO KS_FACTURAS (
          FC_NUMERO_FACTURA, FC_FECHA, FC_CLIENTE_NOMBRE, FC_CLIENTE_TELEFONO, 
          FC_TOTAL, FC_ESTADO, SC_IDSUCURSAL_FK, TR_IDCAJERO_FK,
          FC_TIPO_CLIENTE, TR_IDCLIENTE_FK, FC_EVIDENCIA_FISICA_URL
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.FC_NUMERO_FACTURA || `FAC-${Date.now()}`,
          data.FC_FECHA,
          data.FC_TIPO_CLIENTE === 'CLIENTE' ? data.FC_CLIENTE_NOMBRE : null,
          data.FC_TIPO_CLIENTE === 'CLIENTE' ? data.FC_CLIENTE_TELEFONO : null,
          data.FC_TOTAL,
          data.FC_ESTADO,
          data.SC_IDSUCURSAL_FK,
          data.TR_IDCAJERO_FK,
          data.FC_TIPO_CLIENTE || 'CLIENTE',
          data.FC_TIPO_CLIENTE === 'TECNICO' ? data.TR_IDCLIENTE_FK : null,
          fizUrl || null
        ]
      );
      invoiceId = invoiceResult.insertId;
    }

    // 1.1 Si es Vale de técnico, registrar en KS_VALES
    if (data.FC_TIPO_CLIENTE === 'TECNICO' && data.isVale && data.TR_IDCLIENTE_FK) {
      await (connection as any).execute(
        `INSERT INTO KS_VALES (VL_VALOR_TOTAL, VL_NUMERO_CUOTAS, VL_VALOR_CUOTA, VL_ESTADO, FC_IDFACTURA_FK, TR_IDTRABAJADOR_FK)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.FC_TOTAL, 1, data.FC_TOTAL, 'PENDIENTE', invoiceId, data.TR_IDCLIENTE_FK]
      );
    }

    // 2. Insertar Detalles de Servicios
    for (const service of data.services) {
      await (connection as any).execute(
        `INSERT INTO KS_FACTURA_DETALLES (FD_VALOR, FC_IDFACTURA_FK, SV_IDSERVICIO_FK, TR_IDTECNICO_FK) 
         VALUES (?, ?, ?, ?)`,
        [service.FD_VALOR, invoiceId, service.SV_IDSERVICIO_FK, service.TR_IDTECNICO_FK]
      );
    }

    // 3. Insertar Detalles de Productos
    if (data.products && data.products.length > 0) {
      for (const product of data.products) {
        await (connection as any).execute(
          `INSERT INTO KS_FACTURA_PRODUCTOS (FP_VALOR, FC_IDFACTURA_FK, PR_IDPRODUCTO_FK, TR_IDTECNICO_FK) 
           VALUES (?, ?, ?, ?)`,
          [product.FP_VALOR, invoiceId, product.PR_IDPRODUCTO_FK, product.TR_IDTECNICO_FK]
        );
      }
    }

    // 4. Insertar Pagos
    for (const payment of data.payments) {
      if (payment.PF_VALOR > 0) {
        let finalUrl = payment.PF_EVIDENCIA_URL;
        if (finalUrl && finalUrl.includes('/temp/')) {
          finalUrl = await finalizeUpload(finalUrl, data.FC_NUMERO_FACTURA || `FAC-${invoiceId}`);
        }

        await (connection as any).execute(
          `INSERT INTO KS_PAGOS_FACTURA (PF_VALOR, PF_EVIDENCIA_URL, FC_IDFACTURA_FK, MP_IDMETODO_FK) 
           VALUES (?, ?, ?, ?)`,
          [payment.PF_VALOR, finalUrl || null, invoiceId, payment.MP_IDMETODO_FK]
        );
      }
    }

    await connection.commit();
    revalidatePath("/dashboard/ventas");
    return { success: true, data: { id: invoiceId }, error: null };

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error saving invoice:", error);
    return { success: false, data: null, error: "Error al guardar la factura" };
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Verificar si una contraseña corresponde a un administrador
 */
export async function verifyAdminPassword(password: string): Promise<ApiResponse> {
  try {
    const [users]: any = await db.execute(
      `SELECT T.TR_IDTRABAJADOR_PK, R.RL_NOMBRE 
       FROM KS_TRABAJADORES T
       JOIN KS_ROLES R ON T.RL_IDROL_FK = R.RL_IDROL_PK
       WHERE T.TR_PASSWORD = ? AND R.RL_NOMBRE = 'ADMINISTRADOR_TOTAL'
       LIMIT 1`,
      [password]
    );

    if (users.length > 0) {
      return { success: true };
    }

    return { success: false, error: 'Contraseña de administrador incorrecta o privilegios insuficientes' };
  } catch (error) {
    console.error('Error verificando password:', error);
    return { success: false, error: 'Error del servidor al verificar' };
  }
}

export async function deleteInvoice(invoiceId: number): Promise<ApiResponse> {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Eliminar pagos
    await connection.execute(`DELETE FROM KS_PAGOS_FACTURA WHERE FC_IDFACTURA_FK = ?`, [invoiceId]);

    // 2. Eliminar vales
    await connection.execute(`DELETE FROM KS_VALES WHERE FC_IDFACTURA_FK = ?`, [invoiceId]);

    // 3. Eliminar créditos
    await connection.execute(`DELETE FROM KS_CREDITOS WHERE FC_IDFACTURA_FK = ?`, [invoiceId]);

    // 4. Eliminar detalles (servicios)
    await connection.execute(`DELETE FROM KS_FACTURA_DETALLES WHERE FC_IDFACTURA_FK = ?`, [invoiceId]);

    // 5. Eliminar productos
    await connection.execute(`DELETE FROM KS_FACTURA_PRODUCTOS WHERE FC_IDFACTURA_FK = ?`, [invoiceId]);

    // 6. Eliminar la factura
    await connection.execute(`DELETE FROM KS_FACTURAS WHERE FC_IDFACTURA_PK = ?`, [invoiceId]);

    await connection.commit();
    revalidatePath('/dashboard/ventas');
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar factura:', error);
    return { success: false, error: 'No se pudo eliminar la factura' };
  } finally {
    connection.release();
  }
}

/**
 * Obtener facturas filtradas por fecha y/o sucursal
 */
export async function getInvoicesByFilter(filters: { sucursalId?: number, date?: string }): Promise<ApiResponse> {
  try {
    let query = `
      SELECT f.*, s.SC_NOMBRE as sucursal_nombre,
      COALESCE(f.FC_CLIENTE_NOMBRE, t.TR_NOMBRE) as cliente_display,
      (SELECT GROUP_CONCAT(DISTINCT sv.SV_NOMBRE SEPARATOR ', ') 
       FROM KS_FACTURA_DETALLES fd 
       JOIN KS_SERVICIOS sv ON fd.SV_IDSERVICIO_FK = sv.SV_IDSERVICIO_PK 
       WHERE fd.FC_IDFACTURA_FK = f.FC_IDFACTURA_PK) as servicios
      FROM KS_FACTURAS f 
      JOIN KS_SUCURSALES s ON f.SC_IDSUCURSAL_FK = s.SC_IDSUCURSAL_PK
      LEFT JOIN KS_TRABAJADORES t ON f.TR_IDCLIENTE_FK = t.TR_IDTRABAJADOR_PK
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.sucursalId) {
      query += ` AND f.SC_IDSUCURSAL_FK = ?`;
      params.push(filters.sucursalId);
    }

    if (filters.date) {
      query += ` AND DATE(f.FC_FECHA) = ?`;
      params.push(filters.date);
    }

    query += ` ORDER BY f.FC_FECHA DESC`;

    const [rows] = await (db as any).execute(query, params);
    return { success: true, data: rows, error: null };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return { success: false, data: null, error: "Error al obtener facturas" };
  }
}

// Retro-compatibilidad opcional o actualización de usos
export async function getRecentInvoices(sucursalId: number): Promise<ApiResponse> {
  return getInvoicesByFilter({ sucursalId, date: new Date().toISOString().split('T')[0] });
}

/**
 * Obtener métodos de pago
 */
export async function getPaymentMethods(): Promise<ApiResponse> {
  try {
    const [rows] = await (db as any).execute("SELECT MP_IDMETODO_PK, MP_NOMBRE FROM KS_METODOS_PAGO");
    return { success: true, data: rows, error: null };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return { success: false, data: [], error: "Error al obtener métodos de pago" };
  }
}

/**
 * Obtener el siguiente número de factura (consecutivo)
 */
export async function getNextInvoiceNumber(): Promise<ApiResponse> {
  try {
    const [rows]: any = await (db as any).execute(
      "SELECT COALESCE(MAX(CAST(FC_NUMERO_FACTURA AS UNSIGNED)), 0) + 1 AS next FROM KS_FACTURAS WHERE FC_NUMERO_FACTURA REGEXP '^[0-9]+$'"
    );
    return { success: true, data: rows[0]?.next || 1, error: null };
  } catch (error) {
    console.error("Error fetching next invoice number:", error);
    const [rows]: any = await (db as any).execute("SELECT COUNT(*) + 1 AS next FROM KS_FACTURAS");
    return { success: true, data: rows[0]?.next || 1, error: null };
  }
}

