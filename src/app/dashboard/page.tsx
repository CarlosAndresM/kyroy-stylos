import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Wallet, CreditCard, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingGate } from '@/components/ui/loading-gate'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Ventas Hoy',
      value: '$0.00',
      icon: TrendingUp,
      color: 'from-[#FF7E5F] to-[#FEB47B]',
      iconColor: 'text-[#FF7E5F]',
      description: '+0% desde ayer'
    },
    {
      title: 'Clientes Nuevos',
      value: '0',
      icon: Users,
      color: 'from-blue-500 to-cyan-400',
      iconColor: 'text-blue-500',
      description: '+0% esta semana'
    },
    {
      title: 'Créditos Pendientes',
      value: '$0.00',
      icon: CreditCard,
      color: 'from-red-500 to-rose-400',
      iconColor: 'text-red-500',
      description: '0 facturas'
    },
    {
      title: 'Vales Activos',
      value: '$0.00',
      icon: Wallet,
      color: 'from-emerald-500 to-teal-400',
      iconColor: 'text-emerald-500',
      description: '0 trabajadores'
    }
  ]

  return (
    <LoadingGate>
      <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          ¡Bienvenido de nuevo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]">Admin</span>! 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Aquí tienes un resumen de lo que está pasando hoy en <span className="text-[#FF7E5F] font-bold">Kyroy Stilos</span>.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 overflow-hidden relative group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full -mr-16 -mt-16 transition-all duration-500 blur-2xl group-hover:scale-150`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={cn("p-2.5 rounded-xl bg-gradient-to-br opacity-80", stat.color)}>
                <stat.icon className="size-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">{stat.value}</div>
              <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-emerald-500">↑</span> {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for Charts / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900 h-[400px] flex items-center justify-center p-8 text-center group">
           <div className="space-y-3">
             <div className="size-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto transition-transform group-hover:rotate-12">
               <TrendingUp className="size-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-400">Gráfico de Ventas Semanales</h3>
             <p className="text-sm text-slate-500 max-w-xs mx-auto">
               Próximamente estaremos visualizando aquí el rendimiento de tus sucursales.
             </p>
           </div>
         </Card>

         <Card className="border-none shadow-sm bg-white dark:bg-slate-900 h-[400px] flex items-center justify-center p-8 text-center group">
            <div className="space-y-3">
             <div className="size-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto transition-transform group-hover:-rotate-12">
               <History className="size-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-400">Actividad Reciente</h3>
             <p className="text-sm text-slate-500 max-w-xs mx-auto">
               El historial dinámico de facturas y abonos aparecerá aquí.
             </p>
           </div>
         </Card>
      </div>
      </div>
    </LoadingGate>
  )
}
