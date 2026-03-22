import { Metadata } from "next";
import { getSedes } from "@/features/trabajadores/services";
import { SedesClient } from "./sedes-client";

export const metadata: Metadata = {
  title: "Sucursales | Kyroy Stilos",
  description: "Administración de sedes y sucursales",
};

export default async function SedesPage() {
  const res = await getSedes();
  const sedes = res.success ? (res.data as any[]) : [];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
          Sucursales
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase italic">
          Gestión de puntos de venta y locales.
        </p>
      </div>

      <SedesClient initialSedes={sedes} />
    </div>
  );
}
