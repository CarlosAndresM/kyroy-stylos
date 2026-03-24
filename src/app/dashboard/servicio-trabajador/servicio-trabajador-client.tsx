'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar, Eye, History, ArrowLeftRight, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCuotasByService } from '@/features/servicio-trabajador/services'
import { toast } from '@/lib/toast-helper'
import { Badge } from '@/components/ui/badge'

interface ServicioTrabajadorClientProps {
  initialServicios: any[]
}

export function ServicioTrabajadorClient({ initialServicios }: ServicioTrabajadorClientProps) {
  const [selectedService, setSelectedService] = React.useState<any>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [quotas, setQuotas] = React.useState<any[]>([])
  const [isLoadingQuotas, setIsLoadingQuotas] = React.useState(false)

  const handleViewQuotas = async (service: any) => {
    setSelectedService(service)
    setIsModalOpen(true)
    setIsLoadingQuotas(true)
    try {
      const res = await getCuotasByService(service.ST_IDSERVICIO_TRABAJADOR_PK)
      if (res.success) {
        setQuotas(res.data)
      } else {
        toast.error(res.error || "No se pudo cargar el plan de pago")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setIsLoadingQuotas(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none"><CheckCircle2 className="size-3 mr-1" /> Pagado</Badge>
      case 'CANCELADO':
        return <Badge variant="destructive" className="border-none"><XCircle className="size-3 mr-1" /> Cancelado</Badge>
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 border-none"><Clock className="size-3 mr-1" /> Pendiente</Badge>
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider w-[120px]">Registro #</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider w-[180px] text-center">Fecha Inicio</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Colaborador</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-center">Factura Origen</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-center">Cuotas</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right w-[160px]">Valor Total</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-center w-[140px]">Estado</TableHead>
              <TableHead className="px-6 py-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialServicios.length > 0 ? (
              initialServicios.map((s: any) => (
                <TableRow key={s.ST_IDSERVICIO_TRABAJADOR_PK} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group">
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">ST-{s.ST_IDSERVICIO_TRABAJADOR_PK}</span>
                      <span className="text-[9px] text-slate-400 font-medium tabular-nums uppercase">Creado: {format(new Date(s.ST_FECHA), 'dd/MM/yy')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-[10px] tabular-nums">
                      <Calendar className="size-3 text-[#FF7E5F]" />
                      {format(new Date(s.ST_FECHA_INICIO_COBRO), 'dd MMM, yyyy', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[#FF7E5F] font-bold text-[10px] border border-white shadow-sm">
                        {s.trabajador_nombre?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase">{s.trabajador_nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    {s.FC_NUMERO_FACTURA ? (
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        #{s.FC_NUMERO_FACTURA}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300 uppercase italic">Directo</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-slate-400">{s.ST_NUMERO_CUOTAS} <span className="text-[9px] font-bold uppercase ml-0.5">Semanas</span></span>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right font-black text-sm text-slate-900 tabular-nums">
                    $ {Number(s.ST_VALOR_TOTAL).toLocaleString('es-CO')}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    {getStatusBadge(s.ST_ESTADO)}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <Button 
                      onClick={() => handleViewQuotas(s)}
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-[#FF7E5F] transition-all"
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <ArrowLeftRight className="size-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 italic text-sm font-medium">No se han registrado créditos de personal aún.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-900 text-white relative">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-[#FF7E5F] uppercase tracking-[0.2em]">Detalle de Amortización</span>
              <DialogTitle className="text-2xl font-black tracking-tight">
                {selectedService?.trabajador_nombre}
              </DialogTitle>
              <div className="flex gap-4 mt-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Total Crédito</span>
                  <span className="text-lg font-black text-[#FF7E5F]">$ {Number(selectedService?.ST_VALOR_TOTAL || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Cuotas</span>
                  <span className="text-lg font-black text-white">{selectedService?.ST_NUMERO_CUOTAS} <span className="text-xs font-normal">SEM</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Estado General</span>
                  <div className="mt-1">{getStatusBadge(selectedService?.ST_ESTADO)}</div>
                </div>
              </div>
            </div>
            <ArrowLeftRight className="absolute right-8 top-8 size-12 text-[#FF7E5F]/20" />
          </DialogHeader>

          <div className="p-0 bg-white min-h-[300px] max-h-[400px] overflow-y-auto">
            {isLoadingQuotas ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="size-8 animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest">Cargando plan de pagos...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400">#</TableHead>
                    <TableHead className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400">Fecha Estimada</TableHead>
                    <TableHead className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400 text-right">Valor</TableHead>
                    <TableHead className="px-8 py-4 font-bold text-[10px] uppercase text-slate-400 text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((q) => (
                    <TableRow key={q.STC_IDCUOTA_PK} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell className="px-8 py-4">
                        <span className="text-xs font-black text-slate-400 tabular-nums">{q.STC_NUMERO_CUOTA.toString().padStart(2, '0')}</span>
                      </TableCell>
                      <TableCell className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3 text-[#FF7E5F]" />
                          <span className="text-xs font-bold text-slate-600">{format(new Date(q.STC_FECHA_COBRO), "dd MMM yyyy", { locale: es })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 tabular-nums">$ {Number(q.STC_VALOR_CUOTA).toLocaleString('es-CO')}</span>
                      </TableCell>
                      <TableCell className="px-8 py-4 text-center">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5",
                          q.STC_ESTADO === 'PAGADO' ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                        )}>
                          {q.STC_ESTADO}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button 
              onClick={() => setIsModalOpen(false)}
              className="bg-[#FF7E5F] hover:bg-[#FF7E5F]/90 text-white rounded-xl font-bold uppercase text-[10px] px-8 tracking-widest shadow-lg shadow-[#FF7E5F]/20"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
