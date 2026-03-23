'use client'

import * as React from 'react'
import { Search, DollarSign, ArrowUpCircle, History, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { NumericFormat } from 'react-number-format'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Calendar as CalendarIcon,
  Camera,
  Upload,
  FileText,
  Eye,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import { getCredits, payCredit, getCreditHistory } from '@/features/billing/credit-services'
import { toast } from '@/lib/toast-helper'
import { LoadingGate } from '@/components/ui/loading-gate'
import { Loader2 } from 'lucide-react'

export default function CreditsPage() {
  // Estados principales
  const [mounted, setMounted] = React.useState(false)
  const [credits, setCredits] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'PENDIENTES' | 'HISTORICO'>('PENDIENTES')

  // Estados para abono
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false)
  const [selectedCredit, setSelectedCredit] = React.useState<any>(null)
  const [payAmount, setPayAmount] = React.useState<number>(0)
  const [abonoDate, setAbonoDate] = React.useState<Date>(new Date())
  const [abonoEvidenceUrl, setAbonoEvidenceUrl] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isUploadingEvidence, setIsUploadingEvidence] = React.useState(false)

  // Referencia para input de archivo
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Estados para trazabilidad
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false)
  const [creditHistory, setCreditHistory] = React.useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (mounted) fetchData()
  }, [mounted, activeTab])

  const fetchData = async () => {
    setLoading(true)
    const res = await getCredits(activeTab === 'HISTORICO')
    if (res.success) setCredits(res.data)
    setLoading(false)
  }

  const handlePayClick = (credit: any) => {
    setSelectedCredit(credit)
    setPayAmount(Number(credit.CR_VALOR_PENDIENTE))
    setAbonoDate(new Date())
    setAbonoEvidenceUrl('')
    setIsPayModalOpen(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingEvidence(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setAbonoEvidenceUrl(data.url)
        toast.success('Imagen cargada', 'La evidencia se ha adjuntado correctamente.')
      } else {
        toast.error('Error al subir', data.error || 'No se pudo subir la imagen.')
      }
    } catch (error) {
      toast.error('Error de red')
    } finally {
      setIsUploadingEvidence(false)
    }
  }

  const handleViewHistory = async (credit: any) => {
    setSelectedCredit(credit)
    setIsHistoryModalOpen(true)
    setLoadingHistory(true)
    try {
      const res = await getCreditHistory(credit.CR_IDCREDITO_PK)
      if (res.success) {
        setCreditHistory(res.data)
      } else {
        toast.error('Error', res.error || 'No se pudo cargar la trazabilidad.')
      }
    } catch (error) {
      toast.error('Error de sistema')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleConfirmPay = async () => {
    if (!selectedCredit || payAmount <= 0) {
      toast.error('Monto inválido', 'Por favor ingrese un valor superior a 0.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await payCredit(selectedCredit.CR_IDCREDITO_PK, payAmount, {
        date: abonoDate,
        evidenceUrl: abonoEvidenceUrl
      })
      if (res.success) {
        toast.success('Pago exitoso', 'El saldo del crédito ha sido actualizado.')
        setIsPayModalOpen(false)
        fetchData()
      } else {
        toast.error('Error', res.error || 'Ocurrió un problema al procesar el pago.')
      }
    } catch (error) {
      toast.error('Error de sistema')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCredits = credits.filter(c =>
    c.FC_NUMERO_FACTURA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.FC_CLIENTE_NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.FC_CLIENTE_TELEFONO.includes(searchTerm)
  )

  const totalDebt = credits.reduce((acc, curr) => acc + Number(curr.CR_VALOR_PENDIENTE), 0)

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Cuentas por Cobrar <span className="text-[#FF7E5F]">(Créditos)</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-widest italic">
            Monitor de deudas de clientes y pagos pendientes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex border-2 border-kyroy-border rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(255,134,162,0.15)] h-12 bg-white">
            <button
              onClick={() => setActiveTab('PENDIENTES')}
              className={cn(
                "px-6 h-full flex items-center gap-2 text-[10px] font-black uppercase transition-all",
                activeTab === 'PENDIENTES' ? "bg-kyroy-pink text-white" : "bg-white text-slate-500 hover:bg-kyroy-pink-light/30"
              )}
            >
              <DollarSign className="size-3.5" />
              Pendientes
            </button>
            <button
              onClick={() => setActiveTab('HISTORICO')}
              className={cn(
                "px-6 h-full flex items-center gap-2 text-[10px] font-black uppercase transition-all border-l-2 border-kyroy-border",
                activeTab === 'HISTORICO' ? "bg-kyroy-pink text-white" : "bg-white text-slate-500 hover:bg-kyroy-pink-light/30"
              )}
            >
              <History className="size-3.5" />
              Histórico
            </button>
          </div>
          <Card className="border-2 border-kyroy-border rounded-none shadow-[4px_4px_0px_0px_rgba(255,134,162,0.15)] bg-kyroy-pink text-white px-6 h-20 flex flex-col justify-center min-w-[260px]">
            <span className="text-[10px] font-black uppercase text-white/70 block tracking-widest italic leading-tight">CARTERA {activeTab}</span>
            <span className="text-3xl font-black italic tracking-tighter">$ {totalDebt.toLocaleString('es-CO')}</span>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-kyroy-pink-light/30 dark:bg-slate-900 p-4 border-2 border-kyroy-border shadow-[4px_4px_0px_0px_rgba(255,134,162,0.15)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="BUSCAR POR FACTURA, CLIENTE O TELÉFONO..."
            className="pl-10 h-11 border-2 border-kyroy-border rounded-none shadow-[2px_2px_0px_0px_rgba(255,134,162,0.15)] bg-white dark:bg-slate-950 font-black text-xs uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <LoadingGate>
        <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-kyroy-pink-light/30 dark:bg-slate-900 border-b-2 border-kyroy-border">
              <TableRow>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px] px-4"># Fac</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Registro</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Sede</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Cliente</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Teléfono</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Servicios</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px] text-right">Total</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px] text-right">Pendiente</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[9px] text-center">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.length > 0 ? (
                filteredCredits.map((credit, i) => (
                  <TableRow key={credit.CR_IDCREDITO_PK} className="hover:bg-kyroy-pink-light/30 group border-b border-slate-100">
                    <TableCell className="px-4 py-4 font-black text-xs text-slate-900 uppercase">
                      #{credit.FC_NUMERO_FACTURA}
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-500 uppercase italic whitespace-nowrap">
                      {format(new Date(credit.CR_FECHA), 'dd/MM/yy', { locale: es })}
                    </TableCell>
                    <TableCell className="font-bold text-[10px] uppercase text-slate-600 truncate max-w-[100px]">
                      {credit.sucursal_nombre}
                    </TableCell>
                    <TableCell className="text-[11px] font-black text-slate-900 uppercase">
                      {credit.cliente_display || credit.FC_CLIENTE_NOMBRE}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-500">
                      {credit.FC_CLIENTE_TELEFONO}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-[10px] font-bold text-slate-600 uppercase">
                      {credit.servicios || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-black text-xs text-slate-400">
                      $ {Number(credit.FC_TOTAL).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(credit.CR_VALOR_PENDIENTE) > 0 ? (
                        <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-1 border border-red-100 rounded-none italic whitespace-nowrap">
                          $ {Number(credit.CR_VALOR_PENDIENTE).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-100 rounded-none italic uppercase flex items-center justify-end gap-1">
                          <CheckCircle2 className="size-3 text-emerald-600" /> LIQUIDADO
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(credit)}
                          className="h-8 w-8 p-0 rounded-none border border-kyroy-border hover:bg-kyroy-pink-light/30 shadow-[2px_2px_0px_0px_rgba(255,134,162,0.15)]"
                          title="Ver Trazabilidad"
                        >
                          <History className="size-3.5" />
                        </Button>
                        {Number(credit.CR_VALOR_PENDIENTE) > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handlePayClick(credit)}
                            className="h-8 px-4 bg-kyroy-orange hover:bg-kyroy-orange-hover text-white font-black text-[9px] uppercase tracking-widest rounded-none border-2 border-kyroy-border shadow-[3px_3px_0px_0px_rgba(255,134,162,0.15)]"
                          >
                            Abonar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-slate-400 py-10 italic uppercase font-bold text-xs">
                    No se encontraron créditos pendientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </LoadingGate>

      {/* MODAL DE ABONO */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-2 border-kyroy-border bg-white rounded-none shadow-[10px_10px_0px_0px_rgba(255,134,162,0.15)] animate-in slide-in-from-bottom duration-500">
          <DialogHeader className="p-6 bg-gradient-to-r from-kyroy-pink to-rose-400 text-white border-b-2 border-kyroy-pink">
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Registrar Pago / Abono</DialogTitle>
            <DialogDescription className="text-white/80 font-bold uppercase text-[10px] tracking-widest italic">
              Actualice el saldo del cr&eacute;dito seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {selectedCredit && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-kyroy-border pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">FACTURA:</span>
                  <span className="text-xs font-black">#{selectedCredit.FC_NUMERO_FACTURA}</span>
                </div>
                <div className="flex justify-between items-center border-b border-kyroy-border pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">CLIENTE:</span>
                  <span className="text-xs font-black">{selectedCredit.FC_CLIENTE_NOMBRE}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 p-3 border border-red-200">
                  <span className="text-[10px] font-black uppercase text-red-600">SALDO PENDIENTE:</span>
                  <span className="text-lg font-black text-red-600">$ {Number(selectedCredit.CR_VALOR_PENDIENTE).toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-kyroy-pink block italic tracking-widest">MONTO A PAGAR / ABONAR:</label>
                  <NumericFormat
                    value={payAmount}
                    onValueChange={(vals) => setPayAmount(vals.floatValue || 0)}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$ "
                    className="w-full h-12 border-2 border-kyroy-border px-4 text-xl font-black bg-kyroy-pink-light/20 focus:bg-white focus:outline-none focus:border-kyroy-pink rounded-none shadow-[4px_4px_0px_0px_rgba(255,134,162,0.1)] transition-all"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 italic">FECHA DE ABONO:</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 border-kyroy-border rounded-none justify-start px-3 font-bold text-xs hover:bg-rose-50 hover:text-kyroy-pink"
                        >
                          <CalendarIcon className="mr-2 size-4 text-rose-400" />
                          {abonoDate ? format(abonoDate, "dd/MM/yyyy") : "SELECCIONAR"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-none border-2 border-kyroy-border" align="start">
                        <Calendar mode="single" selected={abonoDate} onSelect={(d) => d && setAbonoDate(d)} initialFocus className="rounded-none" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black uppercase text-slate-500 italic">EVIDENCIA PAGO:</label>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 border-kyroy-border rounded-none justify-start px-3 font-bold text-xs",
                        abonoEvidenceUrl ? "bg-green-50 text-green-700 border-green-500" : "bg-white"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingEvidence}
                      type="button"
                    >
                      {isUploadingEvidence ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : abonoEvidenceUrl ? (
                        <CheckCircle2 className="mr-2 size-4 text-green-600" />
                      ) : (
                        <Camera className="mr-2 size-4 text-slate-500" />
                      )}
                      {isUploadingEvidence ? "SUBIENDO..." : abonoEvidenceUrl ? "ADJUNTADO" : "FOTO/VOUCHER"}
                    </Button>

                    {abonoEvidenceUrl && (
                      <button
                        type="button"
                        onClick={() => setAbonoEvidenceUrl('')}
                        className="absolute -right-1 -top-1 bg-red-600 text-white rounded-full p-1 border border-kyroy-border hover:bg-red-700 transition-colors shadow-sm"
                      >
                        <Trash2 className="size-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {abonoEvidenceUrl && (
                  <div className="border border-kyroy-border bg-kyroy-pink-light/30 p-2 overflow-hidden">
                    <img
                      src={abonoEvidenceUrl}
                      alt="Vista previa evidencia"
                      className="w-full h-32 object-contain grayscale hover:grayscale-0 transition-all cursor-zoom-in"
                      onClick={() => window.open(abonoEvidenceUrl, '_blank')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-kyroy-pink-light/30 flex gap-2 sm:gap-0 sm:justify-between border-t-2 border-kyroy-border">
            <Button
              variant="outline"
              className="rounded-none border-2 border-kyroy-border font-black uppercase text-xs h-11 px-6 active:translate-x-[1px] active:translate-y-[1px] text-slate-500 hover:text-kyroy-pink hover:bg-white"
              onClick={() => setIsPayModalOpen(false)}
            >
              CANCELAR
            </Button>
            <Button
              className="bg-kyroy-orange hover:bg-kyroy-orange-hover text-white font-black uppercase text-xs h-11 px-8 rounded-none shadow-[4px_4px_0px_0px_rgba(249,115,22,0.3)] active:shadow-none translate-x-0 active:translate-x-[2px] active:translate-y-[2px] gap-2 border-2 border-orange-600/20"
              onClick={handleConfirmPay}
              disabled={isSubmitting || payAmount <= 0}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <DollarSign className="size-4" />
              )}
              {isSubmitting ? 'PROCESANDO...' : 'REGISTRAR ABONO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL DE TRAZABILIDAD */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-2xl border-2 border-kyroy-border rounded-none shadow-[12px_12px_0px_0px_rgba(255,134,162,0.15)] p-0 bg-white">
          <DialogHeader className="bg-gradient-to-r from-kyroy-pink to-rose-500 p-6 border-b-2 border-kyroy-pink">
            <DialogTitle className="text-white font-black uppercase text-xl italic tracking-tighter">TRAZABILIDAD DE PAGOS</DialogTitle>
            <DialogDescription className="text-white/80 text-[11px] uppercase font-bold tracking-widest mt-1 italic">Historial completo de abonos realizados para liquidar esta deuda.</DialogDescription>
          </DialogHeader>

          <div className="p-0 max-h-[500px] overflow-y-auto">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="size-10 animate-spin text-rose-200" />
                <span className="text-xs font-black uppercase text-rose-300 italic">RECUPERANDO HISTORIAL...</span>
              </div>
            ) : creditHistory.length > 0 ? (
              <div className="border border-kyroy-border border-t-0 border-x-0">
                <Table className="border-collapse">
                  <TableHeader className="bg-kyroy-pink-light/30 border-b-2 border-kyroy-border">
                    <TableRow className="divide-x divide-kyroy-border">
                      <TableHead className="text-[11px] font-black uppercase text-slate-500 italic h-12 px-6">FECHA DEL ABONO</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-slate-500 italic h-12 text-right px-6">MONTO ABONADO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-kyroy-border">
                    {creditHistory.map((abono) => (
                      <TableRow key={abono.AB_IDABONO_PK} className="divide-x divide-kyroy-border hover:bg-rose-50/30 transition-colors">
                        <TableCell className="px-6 py-5">
                          <span className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
                            {format(new Date(abono.AB_FECHA), "dd 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-6 py-5">
                          <div className="flex items-center justify-end gap-4">
                            {abono.AB_EVIDENCIA_URL && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-kyroy-border text-kyroy-pink hover:bg-rose-50 rounded-none shadow-sm"
                                onClick={() => window.open(abono.AB_EVIDENCIA_URL, '_blank')}
                                title="Ver Comprobante"
                              >
                                <Camera className="size-3.5 mr-2" />
                                VER FOTO
                              </Button>
                            )}
                            <div className="flex flex-col">
                              <span className="text-lg font-black text-rose-600 tracking-tighter">
                                $ {Number(abono.AB_MONTO).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="bg-rose-50 p-6 rounded-full">
                  <History className="h-12 w-12 text-rose-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-black uppercase text-slate-400 italic">No hay abonos registrados todavía.</p>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Proceda a registrar el primer pago del cliente.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-kyroy-pink-light/30 border-t-2 border-kyroy-border">
            <Button
              className="w-full bg-kyroy-pink hover:bg-rose-600 text-white font-black uppercase text-xs h-11 px-8 rounded-none shadow-[4px_4px_0px_0px_rgba(255,134,162,0.15)] active:shadow-none translate-x-0 active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => setIsHistoryModalOpen(false)}
            >
              CERRAR HISTORIAL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
