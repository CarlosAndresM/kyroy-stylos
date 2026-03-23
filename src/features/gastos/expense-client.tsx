'use client'

import * as React from 'react'
import {
  Plus,
  LayoutList,
  CircleDollarSign,
  TrendingDown,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { TableFilter } from '@/components/ui/table-filter'
import { toast } from '@/lib/toast-helper'
import { UnifiedGasto, GastoData } from './schema'
import { createExpense } from './services'
import { getSedes } from '@/features/trabajadores/services'

interface ExpenseClientProps {
  initialData: UnifiedGasto[]
  user: any
}

export function ExpenseClient({ initialData, user }: ExpenseClientProps) {
  const [data, setData] = React.useState<UnifiedGasto[]>(initialData)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [sedes, setSedes] = React.useState<any[]>([])

  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeFilters, setActiveFilters] = React.useState<{ [key: string]: string[] }>({})

  // Form State
  const [formData, setFormData] = React.useState<GastoData>({
    GS_CONCEPTO: '',
    GS_DESCRIPCION: '',
    GS_VALOR: 0,
    GS_FECHA: new Date(),
    SC_IDSUCURSAL_FK: user?.sucursalId || null
  })

  React.useEffect(() => {
    const fetchSedes = async () => {
      const res = await getSedes()
      if (res.success) setSedes(res.data)
    }
    fetchSedes()
  }, [])

  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      // Búsqueda general
      const searchMatch = !searchTerm ||
        item.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sucursal || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tipo.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Filtros por columna
      for (const [col, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        const val = (item[col as keyof UnifiedGasto] as string)?.toString() || 'GENERAL';
        if (!values.includes(val)) return false;
      }

      return true;
    })
  }, [data, searchTerm, activeFilters])

  const getFilterOptions = (col: keyof UnifiedGasto) => {
    return Array.from(new Set(data.map(item => (item[col] as string)?.toString() || 'GENERAL'))).filter(Boolean).sort()
  }

  const handleFilterChange = (col: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [col]: values }))
  }

  const handleOpenModal = () => {
    setFormData({
      GS_CONCEPTO: '',
      GS_DESCRIPCION: '',
      GS_VALOR: 0,
      GS_FECHA: new Date(),
      SC_IDSUCURSAL_FK: user?.role === 'CAJERO' ? user?.sucursalId : null
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.GS_CONCEPTO || formData.GS_VALOR <= 0) {
      toast.error("Datos inválidos", "Por favor completa el concepto y valor.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createExpense(formData)
      if (res.success) {
        toast.success("Gasto registrado")
        setIsModalOpen(false)
        window.location.reload()
      } else {
        toast.error("Error", res.error || "No se pudo registrar el gasto")
      }
    } catch (error) {
      toast.error("Error de sistema")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalGastos = data.reduce((acc, curr) => acc + Number(curr.valor), 0)

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Header compact section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-4 border-b-2 border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 border-2 border-rose-100 shadow-sm">
              <TrendingDown className="size-6 text-[#FF7E5F]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none">
                Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]">Gastos</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Historial unificado de egresos y nómina confirmada.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="h-12 flex items-center bg-white dark:bg-slate-900 border-2 border-rose-100 px-4 shadow-sm group hover:border-[#FF7E5F] transition-colors">
            <div className="border-r-2 border-rose-50 pr-4 mr-4 hidden sm:block">
              <p className="text-[8px] font-black text-rose-300 uppercase tracking-[0.2em] leading-none mb-1">TOTAL EGRESOS:</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none tabular-nums tracking-tighter">
                $ {totalGastos.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="sm:hidden">
              <p className="text-[8px] font-black text-rose-300 uppercase tracking-widest mb-0.5">TOTAL:</p>
              <p className="text-sm font-black text-slate-900">$ {totalGastos.toLocaleString('es-CO')}</p>
            </div>
            <CircleDollarSign className="size-5 text-[#FF7E5F] group-hover:scale-110 transition-transform" />
          </div>

          <Button
            onClick={handleOpenModal}
            className="bg-[#f97316] text-white hover:bg-[#ea580c] rounded-none border-2 border-[#f97316] font-black uppercase italic gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.2)] h-12 px-6 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Plus className="size-4" /> Registrar Gasto
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-3 border-2 border-rose-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-rose-300" />
          <Input
            placeholder="FILTRO RÁPIDO (CONCEPTO, DESCRIPCIÓN, SUCURSAL, TIPO)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-2 border-rose-50 rounded-none font-black text-[10px] uppercase placeholder:text-slate-300 focus-visible:ring-0 focus-visible:border-rose-200 transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <Card className="border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 overflow-hidden p-0 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="bg-[#ff86a2] p-2.5 border-b-2 border-rose-100 flex items-center justify-between sticky top-0 z-20">
          <h3 className="text-[11px] font-black uppercase text-white tracking-widest flex items-center gap-2">
            <LayoutList className="size-3.5" /> Historial de Salidas
          </h3>
          <span className="text-[9px] font-black uppercase text-white/80 italic">{filteredData.length} registros encontrados</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-rose-50/50 dark:bg-slate-800 border-b-2 border-rose-100 sticky top-10 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent text-center">
                <TableHead className="h-10 py-0 px-4">
                  <TableFilter
                    label="Concepto / Detalle"
                    options={getFilterOptions('concepto')}
                    selectedValues={activeFilters['concepto'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('concepto', vals)}
                  />
                </TableHead>
                <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase px-4 whitespace-nowrap text-center">Fecha</TableHead>
                <TableHead className="h-10 py-0 px-4">
                  <TableFilter
                    label="Sucursal"
                    align="center"
                    options={getFilterOptions('sucursal')}
                    selectedValues={activeFilters['sucursal'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('sucursal', vals)}
                  />
                </TableHead>
                <TableHead className="h-10 py-0 px-4">
                  <TableFilter
                    label="Tipo"
                    align="center"
                    options={getFilterOptions('tipo')}
                    selectedValues={activeFilters['tipo'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('tipo', vals)}
                  />
                </TableHead>
                <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-right px-4">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-slate-400 font-bold uppercase italic text-[10px] tracking-widest">
                    No se encontraron gastos con los criterios de búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, i) => (
                  <TableRow key={`${item.tipo}-${item.id}-${i}`} className="hover:bg-rose-50/20 transition-colors border-b border-rose-50/50">
                    <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                            <span className="font-black text-[10px] uppercase text-slate-700 leading-tight">{item.concepto}</span>
                            {item.descripcion && (
                                <span className="text-[9px] font-bold text-slate-400 uppercase italic truncate max-w-[200px]">{item.descripcion}</span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-[9px] font-bold text-slate-500 tabular-nums px-4 whitespace-nowrap text-center">
                      {item.fecha ? format(new Date(item.fecha), "dd MMM yyyy '∙' HH:mm", { locale: es }).toUpperCase() : '--'}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <span className="text-[8px] font-black uppercase text-rose-400 italic bg-rose-50/50 px-2 py-0.5 border border-rose-100">
                        {item.sucursal || 'GENERAL'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-tighter border shadow-sm",
                        item.tipo === 'NOMINA' ? "bg-purple-600 text-white border-purple-700" : "bg-blue-600 text-white border-blue-700"
                      )}>
                        {item.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-black text-slate-900 text-sm tabular-nums px-4">
                      <span className="text-xs text-slate-400 mr-1 font-bold italic">$</span>
                      {Number(item.valor).toLocaleString('es-CO')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Registration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-none border-4 border-rose-100 sm:max-w-[425px] p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-rose-400 to-rose-500 p-6 border-b-2 border-rose-300">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-white italic">Registrar Nuevo Gasto</DialogTitle>
            <DialogDescription className="text-xs font-bold text-white/80 uppercase">Ingresa los detalles de la salida de dinero.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concepto" className="text-[10px] font-black uppercase text-rose-400 italic">1. CONCEPTO (CATEGORÍA):</Label>
              <Input
                id="concepto"
                placeholder="EJ. ARRIENDO, SERVICIOS, INSUMOS..."
                className="rounded-none border-2 border-rose-100 font-black text-sm uppercase focus:border-rose-400 h-10 transition-all"
                value={formData.GS_CONCEPTO}
                onChange={e => setFormData({ ...formData, GS_CONCEPTO: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-[10px] font-black uppercase text-rose-400 italic">2. DESCRIPCIÓN / DETALLE:</Label>
              <Input
                id="descripcion"
                placeholder="EJ. PAGO LUZ MARZO, COMPRA DE TINTES RAZA..."
                className="rounded-none border-2 border-rose-100 font-bold text-[10px] uppercase focus:border-rose-400 h-10 transition-all"
                value={formData.GS_DESCRIPCION}
                onChange={e => setFormData({ ...formData, GS_DESCRIPCION: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor" className="text-[10px] font-black uppercase text-rose-400 italic">3. VALOR ($):</Label>
              <Input
                id="valor"
                type="number"
                placeholder="0"
                className="rounded-none border-2 border-rose-100 font-black text-2xl text-[#FF7E5F] focus:border-rose-400 h-12 transition-all"
                value={formData.GS_VALOR || ''}
                onChange={e => setFormData({ ...formData, GS_VALOR: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-rose-400 italic">3. SUCURSAL:</Label>
                <Select
                  value={formData.SC_IDSUCURSAL_FK?.toString() || 'general'}
                  onValueChange={val => setFormData({ ...formData, SC_IDSUCURSAL_FK: val === 'general' ? null : Number(val) })}
                  disabled={user?.role === 'CAJERO'}
                >
                  <SelectTrigger className="rounded-none border-2 border-rose-100 font-bold text-[10px] uppercase h-10 focus:ring-0 focus:border-rose-400">
                    <SelectValue placeholder="General" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-rose-100">
                    <SelectItem value="general" className="text-[10px] font-bold uppercase">NEGOCIO GENERAL</SelectItem>
                    {sedes.map(s => (
                      <SelectItem key={s.SC_IDSUCURSAL_PK} value={s.SC_IDSUCURSAL_PK.toString()} className="text-[10px] font-bold uppercase">
                        {s.SC_NOMBRE}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-rose-400 italic">4. FECHA:</Label>
                <div className="relative">
                  <Input
                    type="date"
                    className="rounded-none border-2 border-rose-100 font-bold text-[10px] uppercase h-10 focus:border-rose-400"
                    value={formData.GS_FECHA ? format(new Date(formData.GS_FECHA), "yyyy-MM-dd") : ''}
                    onChange={e => setFormData({ ...formData, GS_FECHA: new Date(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-none border-2 border-slate-100 font-black uppercase text-[10px] h-12 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-none bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] gap-2 h-12 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.2)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                Confirmar Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
