import { Metadata } from "next";
import { getTrabajadores, getRoles, getSedes } from "@/features/trabajadores/services";
import AdminClient from "@/app/dashboard/usuarios-admin/admin-client";

export const metadata: Metadata = {
  title: "Administradores | Kyros Stilos",
  description: "Gestión de usuarios administradores",
};

export default async function AdminPage() {
  const [workersRes, rolesRes, sedesRes] = await Promise.all([
    getTrabajadores(),
    getRoles(),
    getSedes(),
  ]);

  // Filtrar para mostrar SOLO administradores en esta página
  const admins = (workersRes.success ? workersRes.data : [])?.filter(
    (w: any) => w.RL_NOMBRE === 'ADMINISTRADOR_TOTAL'
  );

  // Filtrar solo el rol de administrador para la creación en esta página
  const roles = (rolesRes.success ? rolesRes.data : [])?.filter(
    (r: any) => r.RL_NOMBRE === 'ADMINISTRADOR_TOTAL'
  );

  const sedes = sedesRes.success ? sedesRes.data : [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-slate-800 to-emerald-600 dark:from-emerald-400 dark:via-white dark:to-emerald-400">
            Usuarios Administradores
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">
            Gestiona el acceso de nivel administrativo al sistema.
          </p>
        </div>
      </div>

      <AdminClient 
        initialAdmins={admins || []} 
        roles={roles || []} 
        sedes={sedes || []} 
      />
    </div>
  );
}
