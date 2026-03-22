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
import { History, Calendar, User, DollarSign, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Nómina | Kyroy Stilos",
  description: "Cálculo de nómina y comisiones para administradores",
};

export default async function NominaPage() {
  // Skeleton data or empty until service is implemented
  const nomina: any[] = [];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Nómina & Comisiones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
            Cálculo detallado de pagos para trabajadores administrativos y técnicos.
          </p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] tracking-widest uppercase rounded-none px-6 h-9">
          <Download className="mr-2 h-4 w-4" />
          DESCARGAR REPORTE
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden max-h-[75vh] overflow-y-auto shadow-sm">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Trabajador</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center w-[150px]">Periodo</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right w-[140px]">Base</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right w-[140px]">Comisiones</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right w-[140px]">Total a Pagar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nomina.length > 0 ? (
              nomina.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="py-2 px-4 font-bold text-slate-900 dark:text-white text-xs block truncate">---</TableCell>
                  <TableCell className="py-2 px-4 text-center text-[10px] text-slate-500">---</TableCell>
                  <TableCell className="py-2 px-4 text-right font-black text-xs text-slate-900 dark:text-white">$0</TableCell>
                  <TableCell className="py-2 px-4 text-right font-black text-xs text-emerald-600">$0</TableCell>
                  <TableCell className="py-2 px-4 text-right font-black text-xs text-slate-900 dark:text-white bg-slate-50/50">$0</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 py-10 italic text-xs">
                  No hay datos de nómina generados para este periodo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
