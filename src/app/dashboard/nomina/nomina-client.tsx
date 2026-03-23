'use client'

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Settings,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  History,
  Info,
  Banknote,
  Trash2,
  RefreshCw,
  Lock,
  Plus
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  procesarNominaSemanal,
  confirmarNomina,
  getNominaConfigs,
  saveNominaConfig,
  getNominaByRange,
  deleteNomina,
  getPayrollWorkers
} from "@/features/nomina/services";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function NominaClient() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 0 }));
  const [nominaData, setNominaData] = useState<any[]>([]);
  const [nominaBatch, setNominaBatch] = useState<any>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [configs, setConfigs] = useState<any[]>([]);
  // States for Config Modal
  const [svcPercent, setSvcPercent] = useState("");
  const [prdPercent, setPrdPercent] = useState("");
  const [configStartDate, setConfigStartDate] = useState("");
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    fetchNomina();
  }, [startDate]);

  useEffect(() => {
    if (configOpen) {
      fetchConfigs();
    }
  }, [configOpen]);

  const fetchConfigs = async () => {
    const res = await getNominaConfigs();
    if (res.success) setConfigs(res.data || []);
  };

  const fetchNomina = async () => {
    setLoading(true);
    const res = await getNominaByRange(startDate, endDate);
    if (res.success && res.data) {
      setNominaBatch(res.data);
      setNominaData(res.data.details || []);
    } else {
      setNominaBatch(null);
      setNominaData([]);
    }
    setLoading(false);
  };

  const handleProcesar = async () => {
    setLoading(true);
    try {
      const res = await procesarNominaSemanal({ startDate, endDate });
      if (res.success) {
        toast.success(res.message);
        await fetchNomina();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!nominaBatch) return;
    setLoading(true);
    const res = await confirmarNomina(nominaBatch.NM_IDNOMINA_PK);
    if (res.success) {
      toast.success(res.message);
      await fetchNomina();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleBorrar = async () => {
    if (!nominaBatch) return;
    if (!confirm("¿Está seguro de borrar este proceso de nómina?")) return;

    setLoading(true);
    const res = await deleteNomina(nominaBatch.NM_IDNOMINA_PK);
    if (res.success) {
      toast.success(res.message);
      await fetchNomina();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    const res = await saveNominaConfig({
      NC_PORCENTAJE_SERVICIO: parseFloat(svcPercent),
      NC_PORCENTAJE_PRODUCTO: parseFloat(prdPercent),
      NC_FECHA_INICIO: new Date(configStartDate)
    });

    if (res.success) {
      toast.success(res.message);
      fetchConfigs();
      setShowConfigForm(false);
    } else {
      toast.error(res.error);
    }
  };

  const currentRangeLabel = `${format(startDate, "dd MMM", { locale: es })} - ${format(endDate, "dd MMM yyyy", { locale: es })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Banknote className="h-8 w-8 text-[#ff86a2]" />
            Gestión de Nómina
          </h1>
          <p className="text-sm text-slate-400 font-medium italic">
            Cálculo semanal de comisiones y sueldos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setConfigOpen(true)}
            className="border-slate-200 text-slate-600 font-bold text-[10px] tracking-widest uppercase h-9 rounded-none px-4"
          >
            <Settings className="mr-2 h-4 w-4" />
            Parametrizar N&oacute;mina
          </Button>
        </div>
      </div>

      {/* Rango de Fechas */}
      <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-100 rounded-full">
            <CalendarIcon className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo de Liquidaci&oacute;n (Dom - Sab)</p>
            <p className="text-lg font-black text-slate-900 capitalize">{currentRangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newStart = addDays(startDate, -7);
              setStartDate(newStart);
              setEndDate(addDays(newStart, 6));
            }}
            className="font-bold text-xs"
          >
            ANTERIOR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newStart = addDays(startDate, 7);
              setStartDate(newStart);
              setEndDate(addDays(newStart, 6));
            }}
            className="font-bold text-xs"
          >
            SIGUIENTE
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <Button
            disabled={loading}
            onClick={handleProcesar}
            className="bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-[10px] tracking-widest uppercase rounded-none px-6 h-9 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.2)]"
          >
            {loading ? <RefreshCw className="animate-spin mr-2 h-3.5 w-3.5" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            PROCESAR NÓMINA
          </Button>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="border border-rose-100 bg-white/50 backdrop-blur-sm overflow-hidden min-h-[400px] shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#fff1f2] sticky top-0 z-10 border-b border-rose-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-[#ff86a2] uppercase tracking-widest text-[10px] px-6">Trabajador</TableHead>
                <TableHead className="font-black text-[#ff86a2] uppercase tracking-widest text-[10px] text-right">Base</TableHead>
                <TableHead className="font-black text-[#ff86a2] uppercase tracking-widest text-[10px] text-right">Comisiones (Neto)</TableHead>
                <TableHead className="font-black text-[#ff86a2] uppercase tracking-widest text-[10px] text-right">Deducciones Vales</TableHead>
                <TableHead className="font-black text-[#ff86a2] uppercase tracking-widest text-[10px] text-right px-6">Total a Pagar</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nominaData.length > 0 ? (
                nominaData.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <TableCell className="font-bold text-slate-900 text-xs px-6 uppercase tracking-tight">{item.TR_NOMBRE}</TableCell>
                    <TableCell className="text-right font-medium text-xs">$ {item.ND_BASE.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600">$ {item.ND_COMISIONES.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-xs text-red-600 tracking-tighter">
                      - $ {item.ND_DEDUCCIONES_VALES.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-black text-sm text-slate-900 px-6">$ {item.ND_TOTAL_NETO.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center py-10 italic text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 opacity-20" />
                      {nominaBatch ? (
                        <>
                          <p className="text-xs font-medium">Esta n&oacute;mina se proces&oacute; pero result&oacute; vac&iacute;a.</p>
                          <p className="text-[10px] text-slate-500 uppercase">Aseg&uacute;rese de tener trabajadores con el rol 'TECNICO' activos.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-medium">No hay una n&oacute;mina procesada para esta semana.</p>
                          <Button variant="outline" size="sm" onClick={handleProcesar} className="h-8 text-[10px] font-black uppercase">Click para procesar</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Acciones */}
      {nominaBatch && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between bg-[#fff1f2] border border-rose-100 text-[#ff86a2] p-4 md:p-6 shadow-sm mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-rose-300 tracking-widest">Total acumulado de la semana</span>
            <span className="text-2xl font-black italic text-[#ff86a2]">$ {nominaData.reduce((acc, curr) => acc + curr.ND_TOTAL_NETO, 0).toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className={cn(
              "text-[10px] font-black px-3 py-1 border uppercase tracking-widest mr-4",
              nominaBatch.NM_ESTADO === 'CONFIRMADA' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-amber-500/20 border-amber-500 text-amber-400"
            )}>
              ESTADO: {nominaBatch.NM_ESTADO}
            </span>

            {nominaBatch.NM_ESTADO !== 'CONFIRMADA' && (
              <>
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-500 hover:bg-red-50 font-bold text-[10px] rounded-none h-11 px-4 uppercase"
                  onClick={handleBorrar}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="bg-white border-rose-200 text-[#ff86a2] hover:bg-rose-50 font-bold text-[10px] rounded-none h-11 px-6 uppercase"
                  onClick={handleProcesar}
                  disabled={loading}
                >
                  Volver a Procesar
                </Button>
                <Button
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white font-black text-[10px] tracking-widest uppercase rounded-none h-11 px-8 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.2)]"
                >
                  Confirmar Liquidación
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal Configuración */}
      <Dialog open={configOpen} onOpenChange={(open) => { setConfigOpen(open); if (!open) setShowConfigForm(false); }}>
        <DialogContent className="w-[1280px] max-w-[95vw] rounded-none border-2 border-[#ff86a2] p-0 overflow-hidden shadow-2xl bg-white">
          <DialogHeader className="bg-[#fff1f2] text-[#ff86a2] p-6 border-b border-rose-100 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-[#ff86a2]" />
              <DialogTitle className="text-lg font-black uppercase tracking-widest">
                Parametrizar Nómina
              </DialogTitle>
            </div>
            <Button
              onClick={() => setShowConfigForm(!showConfigForm)}
              className={cn(
                "h-10 w-10 p-0 rounded-none border-2 border-white/20 transition-all",
                showConfigForm ? "bg-red-500 border-red-500 rotate-45" : "bg-emerald-600 border-emerald-600"
              )}
            >
              <Plus className="size-6 text-white" />
            </Button>
          </DialogHeader>

          <div className="relative h-[420px] overflow-hidden">
            {/* Fondo: Historial (Ocupa todo el ancho siempre para no aplastarse) */}
            <div className="bg-white p-6 flex flex-col h-full w-full overflow-hidden transition-opacity duration-300">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-2 flex items-center justify-between">
                <span>Historial de Vigencias en Sistema</span>
                <History className="size-3 text-slate-400" />
              </h4>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                <Table className="border-collapse">
                  <TableHeader className="bg-kyroy-pink-light/30 border-b-2 border-kyroy-pink sticky top-0 z-20">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-wider h-10 px-4">Vigencia Desde</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider h-10 px-4 text-center">% SVC</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider h-10 px-4 text-center">% PRD</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider h-10 px-4 text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((cfg, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 group">
                        <TableCell className="py-4 px-4 text-[12px] font-bold text-slate-900">
                          {cfg.NC_FECHA_INICIO ? format(new Date(cfg.NC_FECHA_INICIO), 'dd/MM/yyyy') : '---'}
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[12px] font-black text-center text-slate-900">
                          {cfg.NC_PORCENTAJE_SERVICIO}%
                        </TableCell>
                        <TableCell className="py-4 px-4 text-[12px] font-black text-center text-slate-900">
                          {cfg.NC_PORCENTAJE_PRODUCTO}%
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          {idx === 0 ? (
                            <span className="inline-flex bg-emerald-600 text-white text-[9px] px-2 py-0.5 font-black uppercase tracking-tighter shadow-sm">
                              Vigente
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 uppercase italic opacity-50 text-xs">Antiguo</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {configs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center opacity-40 py-10 italic">
                          <div className="flex flex-col items-center gap-2">
                            <History className="h-10 w-10 text-slate-200" />
                            <p className="text-[12px] font-bold uppercase">Sin registros históricos de vigencia</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Capa Superior (Overlay): Formulario */}
            {showConfigForm && (
              <div className="absolute top-0 right-0 bottom-0 w-[400px] z-50 bg-white border-l-2 border-kyroy-pink shadow-[-15px_0_30px_-15px_rgba(255,134,162,0.15)] animate-in slide-in-from-right duration-300 h-full p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nuevo Registro de Vigencia</h4>
                </div>

                <div className="p-3 bg-emerald-100/50 border-l-4 border-emerald-500 flex gap-2">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-[10px] text-emerald-800 font-medium leading-tight">
                    Al agregar una nueva vigencia, se aplicar&aacute; a los sueldos calculados desde la fecha seleccionada en adelante.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Comisi&oacute;n SVC (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={svcPercent}
                        onChange={(e) => setSvcPercent(e.target.value)}
                        placeholder="0.00"
                        className="rounded-none border-kyroy-border focus:border-kyroy-pink font-black h-9 text-sm pl-3 bg-white transition-all shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs">%</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Descuento PRD (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={prdPercent}
                        onChange={(e) => setPrdPercent(e.target.value)}
                        placeholder="0.00"
                        className="rounded-none border-kyroy-border focus:border-kyroy-pink font-black h-9 text-sm pl-3 bg-white transition-all shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Vigencia desde (Inicio)</Label>
                  <Input
                    type="date"
                    value={configStartDate}
                    onChange={(e) => setConfigStartDate(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="rounded-none border-kyroy-border focus:border-kyroy-pink font-black h-9 text-sm bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <Button
                    onClick={handleSaveConfig}
                    className="w-full bg-kyroy-orange hover:bg-kyroy-orange-hover text-white font-black text-xs rounded-none h-11 uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(249,115,22,0.2)] active:shadow-none"
                  >
                    AGREGAR VIGENCIA
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
