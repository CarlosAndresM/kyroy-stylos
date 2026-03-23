'use client'

import React, { useState } from 'react';
import { Plus, XCircle, Search, Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableFilter } from '@/components/ui/table-filter';
import { toast } from '@/lib/toast-helper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Adelanto {
  AD_IDADELANTO_PK: number;
  TR_IDTRABAJADOR_FK: number;
  AD_MONTO: string | number;
  AD_FECHA: string;
  AD_CUOTAS: number;
  AD_CUOTAS_PAGADAS: number;
  AD_ESTADO: 'PENDIENTE' | 'DESCONTADO' | 'ANULADO';
  AD_OBSERVACIONES: string | null;
  TR_NOMBRES: string;
  TR_APELLIDOS: string;
  AD_FECHA_CREACION: string;
}

interface Trabajador {
  TR_IDTRABAJADOR_PK: number;
  TR_NOMBRES: string;
  TR_APELLIDOS: string;
  TR_DOCUMENTO: string;
}

interface ValesClientProps {
  initialAdelantos: Adelanto[];
  trabajadores: Trabajador[];
}

export function ValesClient({ initialAdelantos, trabajadores }: ValesClientProps) {
  const [adelantos, setAdelantos] = useState<Adelanto[]>(initialAdelantos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  
  // Form State
  const [monto, setMonto] = useState('');
  const [cuotas, setCuotas] = useState('1');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [trabajadorId, setTrabajadorId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const filteredAdelantos = React.useMemo(() => {
    return adelantos.filter(a => {
      const fullName = `${a.TR_NOMBRES} ${a.TR_APELLIDOS}`.toLowerCase();
      const searchMatch = fullName.includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      for (const [col, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        let val = '';
        if (col === 'TRABAJADOR') val = `${a.TR_NOMBRES} ${a.TR_APELLIDOS}`;
        else val = (a[col as keyof Adelanto] as string)?.toString() || '';

        if (!values.includes(val)) return false;
      }
      return true;
    });
  }, [adelantos, searchTerm, activeFilters]);

  const getFilterOptions = (col: string) => {
    if (col === 'TRABAJADOR') {
      return Array.from(new Set(adelantos.map(a => `${a.TR_NOMBRES} ${a.TR_APELLIDOS}`))).filter(Boolean).sort();
    }
    return Array.from(new Set(adelantos.map(a => (a[col as keyof Adelanto] as string)?.toString() || ''))).filter(Boolean).sort();
  };

  const handleFilterChange = (col: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [col]: values }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !trabajadorId || !fecha) {
      toast.error('Campos incompletos', 'Por favor llena todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        TR_IDTRABAJADOR_FK: parseInt(trabajadorId, 10),
        AD_MONTO: parseFloat(monto),
        AD_CUOTAS: parseInt(cuotas, 10) || 1,
        AD_FECHA: fecha,
        AD_OBSERVACIONES: observaciones
      };

      const res = await fetch('/api/vales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('Vale registrado', 'El vale se ha creado exitosamente.');
        setIsCreateModalOpen(false);
        // Reset form
        setMonto('');
        setCuotas('1');
        setTrabajadorId('');
        setObservaciones('');
        // Recargar la página para obtener la tabla fresca
        window.location.reload();
      } else {
        toast.error('Error', data.error || 'No se pudo crear el vale');
      }
    } catch (error) {
      toast.error('Error de red', 'No se pudo contactar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnular = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas anular este vale?')) return;
    
    try {
      const res = await fetch(`/api/vales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Vale anulado', 'El vale ha sido marcado como anulado.');
        setAdelantos(prev => prev.map(a => 
          a.AD_IDADELANTO_PK === id ? { ...a, AD_ESTADO: 'ANULADO' } : a
        ));
      } else {
        toast.error('Error', data.error || 'No se pudo anular el vale');
      }
    } catch (err) {
      toast.error('Error', 'No se pudo anular');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">Pendiente</Badge>;
      case 'DESCONTADO': return <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">Descontado</Badge>;
      case 'ANULADO': return <Badge variant="destructive">Anulado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar por trabajador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto bg-[#FF7E5F] hover:bg-[#FF7E5F]/90 text-white shadow-lg shadow-[#FF7E5F]/20 rounded-xl"
        >
          <Plus className="mr-2 size-4" />
          Nuevo Vale
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="py-0 px-2">
                  <TableFilter
                    label="Trabajador"
                    options={getFilterOptions('TRABAJADOR')}
                    selectedValues={activeFilters['TRABAJADOR'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('TRABAJADOR', vals)}
                  />
                </TableHead>
                <TableHead>Monto / Cuotas</TableHead>
                <TableHead className="py-0 px-2">
                  <TableFilter
                    label="Estado"
                    options={getFilterOptions('AD_ESTADO')}
                    selectedValues={activeFilters['AD_ESTADO'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('AD_ESTADO', vals)}
                  />
                </TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdelantos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Wallet className="size-8 mb-2 opacity-20" />
                      <p>No se encontraron vales</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdelantos.map((adelanto) => (
                  <TableRow key={adelanto.AD_IDADELANTO_PK}>
                    <TableCell className="font-medium">
                      {format(new Date(adelanto.AD_FECHA), "dd 'de' MMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {adelanto.TR_NOMBRES} {adelanto.TR_APELLIDOS}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col">
                        <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(adelanto.AD_MONTO))}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {adelanto.AD_CUOTAS > 1 ? `${adelanto.AD_CUOTAS_PAGADAS}/${adelanto.AD_CUOTAS} cuotas` : '1 cuota'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(adelanto.AD_ESTADO)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={adelanto.AD_OBSERVACIONES || ''}>
                      {adelanto.AD_OBSERVACIONES || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {adelanto.AD_ESTADO === 'PENDIENTE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(adelanto.AD_IDADELANTO_PK)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Anular Vale"
                        >
                          <XCircle className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Vale de Nómina</DialogTitle>
            <DialogDescription>
              Asigna un vale a un trabajador que será descontado en su próximo pago.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Trabajador</Label>
              <Select value={trabajadorId} onValueChange={setTrabajadorId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {trabajadores.map((t) => (
                    <SelectItem key={t.TR_IDTRABAJADOR_PK} value={t.TR_IDTRABAJADOR_PK.toString()}>
                      {t.TR_NOMBRES} {t.TR_APELLIDOS} - {t.TR_DOCUMENTO}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-7"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>N° de Cuotas</Label>
                <Input 
                  type="number" 
                  value={cuotas}
                  onChange={(e) => setCuotas(e.target.value)}
                  required
                  min="1"
                  step="1"
                  placeholder="1"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <Input 
                    type="date" 
                    className="pl-9"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observaciones (Opcional)</Label>
              <Textarea 
                placeholder="Motivo u observaciones del vale..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF7E5F] hover:bg-[#FF7E5F]/90 text-white"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Vale'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
