import { Metadata } from 'next';
import { getAllAdelantosService } from '@/features/vales/services';
import { getTrabajadores } from '@/features/trabajadores/services';
import { ValesClient } from '@/app/dashboard/vales/vales-client';

export const metadata: Metadata = {
  title: 'Vales | Kyros Stilos',
  description: 'Gestión de vales (anticipos) a trabajadores',
};

export default async function ValesPage() {
  const [adelantosRes, trabajadoresRes] = await Promise.all([
    getAllAdelantosService(),
    getTrabajadores()
  ]);

  const adelantos = adelantosRes.success ? adelantosRes.data : [];
  
  // Excluir administradores de la lista de trabajadores elegibles para adelantos
  const trabajadores = (trabajadoresRes.success ? trabajadoresRes.data : [])?.filter(
    (w: any) => w.RL_NOMBRE !== 'ADMINISTRADOR_TOTAL'
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-400 dark:to-white">
            Vales
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gestiona los anticipos de sueldo para los trabajadores.
          </p>
        </div>
      </div>

      <ValesClient 
        initialAdelantos={(adelantos || []) as any[]} 
        trabajadores={(trabajadores || []) as any[]} 
      />
    </div>
  );
}
