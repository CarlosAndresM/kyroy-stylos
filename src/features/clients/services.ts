'use server'

import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";
import { ClientFormData } from "@/features/clients/schema";
import { revalidatePath } from "next/cache";

export async function getClients(search?: string): Promise<ApiResponse> {
  try {
    let query = "SELECT * FROM KS_CLIENTES";
    const params: any[] = [];

    if (search) {
      query += " WHERE CL_NOMBRE LIKE ? OR CL_TELEFONO LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY CL_NOMBRE ASC LIMIT 100";
    
    const [rows] = await db.execute(query, params);
    return { success: true, data: rows, error: null };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, data: null, error: "Error al obtener los clientes" };
  }
}

export async function saveClient(data: ClientFormData): Promise<ApiResponse> {
  try {
    if (data.CL_IDCLIENTE_PK) {
      await db.execute(
        `UPDATE KS_CLIENTES SET 
          CL_NOMBRE = ?, 
          CL_TELEFONO = ?, 
          CL_EMAIL = ?, 
          CL_DIRECCION = ?, 
          CL_FECHA_NACIMIENTO = ?, 
          CL_FRECUENTE = ? 
        WHERE CL_IDCLIENTE_PK = ?`,
        [
          data.CL_NOMBRE, 
          data.CL_TELEFONO, 
          data.CL_EMAIL || null, 
          data.CL_DIRECCION || null, 
          data.CL_FECHA_NACIMIENTO || null, 
          data.CL_FRECUENTE, 
          data.CL_IDCLIENTE_PK
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO KS_CLIENTES (
          CL_NOMBRE, 
          CL_TELEFONO, 
          CL_EMAIL, 
          CL_DIRECCION, 
          CL_FECHA_NACIMIENTO, 
          CL_FRECUENTE
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.CL_NOMBRE, 
          data.CL_TELEFONO, 
          data.CL_EMAIL || null, 
          data.CL_DIRECCION || null, 
          data.CL_FECHA_NACIMIENTO || null, 
          data.CL_FRECUENTE
        ]
      );
    }
    revalidatePath("/dashboard/clientes");
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error("Error saving client:", error);
    return { success: false, data: null, error: "Error al guardar el cliente" };
  }
}

export async function deleteClient(id: number): Promise<ApiResponse> {
  try {
    await db.execute("DELETE FROM KS_CLIENTES WHERE CL_IDCLIENTE_PK = ?", [id]);
    revalidatePath("/dashboard/clientes");
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, data: null, error: "No se puede eliminar el cliente (podría tener facturas asociadas)" };
  }
}
