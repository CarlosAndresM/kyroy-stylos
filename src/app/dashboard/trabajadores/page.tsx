import { Metadata } from "next";
import { getTrabajadores, getRoles, getSedes } from "@/features/trabajadores/services";
import { WorkerClient } from "@/app/dashboard/trabajadores/worker-client";
import { getCurrentUserSession } from "@/features/dashboard/services";
import { DashboardBanner } from "@/components/layout/dashboard-banner";

export const metadata: Metadata = {
  title: "Trabajadores | kairos Stylos",
  description: "Gestión de personal y técnicos",
};

export default async function TrabajadoresPage() {
  const sessionRes = await getCurrentUserSession();
  const sessionUser = sessionRes.success ? sessionRes.data : null;
  const sucursalId = sessionUser?.role === 'ADMINISTRADOR_TOTAL' ? undefined : sessionUser?.branchId;

  const [workersRes, rolesRes, sedesRes] = await Promise.all([
    getTrabajadores(sucursalId),
    getRoles(),
    getSedes(),
  ]);

  // Filtrar para NO mostrar administradores totales en esta página
  const workers = (workersRes.success ? workersRes.data : [])?.filter(
    (w: any) => w.RL_NOMBRE !== 'ADMINISTRADOR_TOTAL'
  );

  // Filtrar roles permitidos para TRABAJADORES (Cajero/Admin Punto y Técnico)
  const roles = (rolesRes.success ? rolesRes.data : [])?.filter(
    (r: any) => r.RL_NOMBRE === 'ADMINISTRADOR_PUNTO' || r.RL_NOMBRE === 'TECNICO'
  );

  const sedes = sedesRes.success ? sedesRes.data : [];

  return (
    <div className="space-y-8 pb-12">
      <DashboardBanner 
        title="Gestión de Personal"
        subtitle="Administra técnicos, roles y asignaciones por sucursal."
      />

      <WorkerClient
        initialWorkers={workers || []}
        roles={roles || []}
        sedes={sedes || []}
        currentRole={sessionUser?.role}
        sucursalId={sessionUser?.branchId}
      />
    </div>
  );
}
