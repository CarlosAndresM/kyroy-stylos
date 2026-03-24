import { Metadata } from "next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeftRight, History, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardBanner } from "@/components/layout/dashboard-banner";
import { ServicioTrabajadorClient } from "./servicio-trabajador-client";

export const metadata: Metadata = {
  title: "Servicios de Trabajador | Kyroy Stilos",
  description: "Gestión de deudas y créditos de personal",
};

async function getServiciosTrabajador() {
  try {
    const [rows]: any = await db.execute(`
      SELECT st.*, t.TR_NOMBRE as trabajador_nombre, f.FC_NUMERO_FACTURA
      FROM KS_SERVICIOS_TRABAJADOR st
      JOIN KS_TRABAJADORES t ON st.TR_IDTRABAJADOR_FK = t.TR_IDTRABAJADOR_PK
      LEFT JOIN KS_FACTURAS f ON st.FC_IDFACTURA_FK = f.FC_IDFACTURA_PK
      ORDER BY st.ST_FECHA DESC
    `);
    return rows;
  } catch (error) {
    console.error("Error fetching servicios trabajador:", error);
    return [];
  }
}

export default async function ServicioTrabajadorPage() {
  const rawServicios = await getServiciosTrabajador();
  const servicios = JSON.parse(JSON.stringify(rawServicios));

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <DashboardBanner
        title={<>Servicio de <span className="text-[#FF7E5F]">Trabajador</span></>}
        subtitle="Administra los créditos otorgados al personal y el seguimiento de cuotas pendientes para nómina."
        extra={
          <div className="flex items-center gap-3 p-2 bg-black/40 border border-white/10 shadow-2xl rounded-xl backdrop-blur-md">
            <div className="p-2 bg-[#FF7E5F]/20 rounded-lg">
              <ArrowLeftRight className="size-5 text-[#FF7E5F]" />
            </div>
            <span className="text-[10px] font-black text-[#FF7E5F] uppercase tracking-widest mr-2">Finanzas Internas</span>
          </div>
        }
      />

      {/* Main Table Card */}
      <Card className="border border-slate-200 rounded-3xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-3">
            <History className="size-4 text-[#FF7E5F]" /> Historial de Créditos Personal
          </h3>
        </div>

        <ServicioTrabajadorClient initialServicios={servicios} />
      </Card>
    </div>
  );
}
