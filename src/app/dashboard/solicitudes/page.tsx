import { Metadata } from "next";
import { getSolicitudes } from "@/features/solicitudes/queries";
import { getProducts } from "@/features/catalog/services";
import { getSedes } from "@/features/trabajadores/services";
import { getCurrentUserSession } from "@/features/dashboard/services";
import { SolicitudesClient } from "@/app/dashboard/solicitudes/solicitudes-client";
import { DashboardBanner } from "@/components/layout/dashboard-banner";

export const metadata: Metadata = {
  title: "Solicitudes de Productos | kairos Stylos",
  description: "Gestión de pedidos de productos entre sucursales",
};

export default async function SolicitudesPage() {
  const sessionRes = await getCurrentUserSession();
  const sessionUser = sessionRes.success ? sessionRes.data : null;

  // Filtrar por sucursal si no es administrador total
  const sucursalId = sessionUser?.role === 'ADMINISTRADOR_TOTAL' ? undefined : sessionUser?.branchId;

  const [solicitudesRes, productsRes, sedesRes] = await Promise.all([
    getSolicitudes(sucursalId),
    getProducts(),
    getSedes()
  ]);

  const initialSolicitudes = solicitudesRes || [];
  const products = productsRes.success ? productsRes.data : [];
  const sedes = sedesRes.success ? sedesRes.data : [];

  return (
    <div className="space-y-8 pb-12">
      <DashboardBanner
        title="Solicitudes de Productos"
        subtitle="Realiza y gestiona pedidos de productos para tu sucursal."
      />

      <SolicitudesClient
        initialSolicitudes={initialSolicitudes as any[]}
        products={products as any[]}
        sedes={sedes as any[]}
        sessionUser={sessionUser}
      />
    </div>
  );
}
