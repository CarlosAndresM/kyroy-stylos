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
import { Receipt, Calendar, User, DollarSign, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Vales | Kyroy Stilos",
  description: "Gestión de vales y deudas de técnicos",
};

export default async function ValesPage() {
  // Skeleton data or empty until service is implemented
  const vales: any[] = [];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Gestión de Vales
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
          Listado de servicios a crédito y deudas pendientes.
        </p>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden max-h-[75vh] overflow-y-auto shadow-sm">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] w-[100px]">Vale #</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] w-[150px]">Fecha</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Técnico</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right w-[140px]">Valor Total</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center w-[120px]">Estado</TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vales.length > 0 ? (
              vales.map((vale) => (
                <TableRow key={vale.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="py-2 px-4 font-mono text-[10px] text-slate-500">#{vale.id}</TableCell>
                  <TableCell className="py-2 px-4 text-[10px] text-slate-500">---</TableCell>
                  <TableCell className="py-2 px-4 font-bold text-slate-900 dark:text-white text-xs">---</TableCell>
                  <TableCell className="py-2 px-4 text-right font-black text-xs text-slate-900 dark:text-white">$0</TableCell>
                  <TableCell className="py-2 px-4 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-orange-500">PENDIENTE</span>
                  </TableCell>
                  <TableCell className="py-2 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-slate-100">
                      <ChevronRight className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400 py-10 italic text-xs">
                  No hay vales registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
