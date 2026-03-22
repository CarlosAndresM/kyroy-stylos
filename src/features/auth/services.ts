'use server'
import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";
import { LoginFormData } from "@/features/auth/schema";
import { cookies } from "next/headers";

export async function login(data: LoginFormData): Promise<ApiResponse> {
  try {
    console.log("Login attempt with:", data.username);

    const [rows] = await db.execute(
      `SELECT T.*, R.RL_NOMBRE 
       FROM KS_TRABAJADORES T
       JOIN KS_ROLES R ON T.RL_IDROL_FK = R.RL_IDROL_PK
       WHERE T.TR_NOMBRE = ? AND T.TR_PASSWORD = ? AND T.TR_ACTIVO = 1`,
      [data.username, data.password]
    );

    const workers = rows as any[];

    if (workers.length === 0) {
      return {
        success: false,
        data: null,
        error: "Usuario o contraseña incorrectos",
      };
    }

    const worker = workers[0];
    const user = {
      id: worker.TR_IDTRABAJADOR_PK,
      username: worker.TR_NOMBRE,
      role: worker.RL_NOMBRE,
      branchId: worker.SC_IDSUCURSAL_FK,
    };

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return {
      success: true,
      data: {
        user,
      },
      error: null,
    };
  } catch (error) {
    console.error("Auth Service Error:", error);
    return {
      success: false,
      data: null,
      error: "Error en el servidor de autenticación",
    };
  }
}

export async function logout() {
  console.log("Logout attempt");
  const cookieStore = await cookies();
  cookieStore.delete("session_user");
  return { success: true };
}

