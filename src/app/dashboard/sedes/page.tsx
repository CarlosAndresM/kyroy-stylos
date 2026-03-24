import { Metadata } from "next";
import { getSedes } from "@/features/trabajadores/services";
import { SedesClient } from "./sedes-client";
import { DashboardBanner } from "@/components/layout/dashboard-banner";

export const metadata: Metadata = {
  title: "Sucursales | Kyroy Stilos",
  description: "Administración de sedes y sucursales",
};

export default async function SedesPage() {
  const res = await getSedes();
  const sedes = res.success ? (res.data as any[]) : [];

  return (
    <div className="space-y-6 pb-6">
      <DashboardBanner 
        title="Sucursales"
        subtitle="Gestión de puntos de venta y locales físicos."
      />

      <SedesClient initialSedes={sedes} />
    </div>
  );
}
