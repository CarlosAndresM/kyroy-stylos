'use client'

import * as React from 'react'
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableFilter } from '@/components/ui/table-filter'
import { LoadingGate } from '@/components/ui/loading-gate'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
  } from '@/components/ui/dialog'
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { sedeSchema, SedeFormData } from '@/features/trabajadores/schema'
  import { saveSede, deleteSede } from '@/features/trabajadores/services'
  import { toast } from 'sonner'

interface SedesClientProps {
  initialSedes: any[]
}

export function SedesClient({ initialSedes }: SedesClientProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeFilters, setActiveFilters] = React.useState<{ [key: string]: string[] }>({})
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingSede, setEditingSede] = React.useState<any | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  
  // Auth state for deletion
  const [isAuthOpen, setIsAuthOpen] = React.useState(false)
  const [sedeToDelete, setSedeToDelete] = React.useState<number | null>(null)
  const [adminPassword, setAdminPassword] = React.useState('')

  const form = useForm<SedeFormData>({
    resolver: zodResolver(sedeSchema),
    defaultValues: {
      SC_NOMBRE: '',
      SC_DIRECCION: ''
    }
  })

  React.useEffect(() => {
    if (editingSede) {
      form.reset({
        SC_IDSUCURSAL_PK: editingSede.SC_IDSUCURSAL_PK,
        SC_NOMBRE: editingSede.SC_NOMBRE,
        SC_DIRECCION: editingSede.SC_DIRECCION || ''
      })
    } else {
      form.reset({
        SC_NOMBRE: '',
        SC_DIRECCION: ''
      })
    }
  }, [editingSede, form])

  const filteredSedes = React.useMemo(() => {
    return initialSedes.filter(s => {
      const searchMatch = !searchTerm ||
        s.SC_NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.SC_DIRECCION && s.SC_DIRECCION.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!searchMatch) return false;

      for (const [col, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        const val = s[col]?.toString() || '';
        if (!values.includes(val)) return false;
      }
      return true;
    });
  }, [initialSedes, searchTerm, activeFilters])

  const getFilterOptions = (col: string) => {
    return Array.from(new Set(initialSedes.map(s => s[col]?.toString() || ''))).filter(Boolean).sort();
  }

  const handleFilterChange = (col: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [col]: values }))
  }

  const onSubmit = async (data: SedeFormData) => {
    setIsLoading(true);
    try {
      const res = await saveSede(data);
      if (res.success) {
        toast.success(editingSede ? 'SUCURSAL ACTUALIZADA' : 'SUCURSAL CREADA');
        setIsModalOpen(false);
        setEditingSede(null);
      } else {
        toast.error(res.error || 'ERROR AL GUARDAR');
      }
    } catch (error) {
      toast.error('ERROR INESPERADO');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!sedeToDelete || !adminPassword) return;
    setIsLoading(true);
    try {
      const res = await deleteSede(sedeToDelete, adminPassword);
      if (res.success) {
        toast.success('SUCURSAL ELIMINADA');
        setIsAuthOpen(false);
        setSedeToDelete(null);
        setAdminPassword('');
      } else {
        toast.error(res.error || 'ERROR AL ELIMINAR');
      }
    } catch (error) {
      toast.error('ERROR INESPERADO');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LoadingGate>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 border-2 border-kyroy-border shadow-md">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-kyroy-pink" />
          <Input 
            placeholder="FILTRO RÁPIDO..."
            className="pl-10 h-10 border-2 border-kyroy-border rounded-none bg-white dark:bg-slate-950 font-bold text-xs uppercase focus-visible:ring-kyroy-pink"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        <Button 
            onClick={() => { setEditingSede(null); setIsModalOpen(true); }}
            className="w-full sm:w-auto bg-kyroy-orange hover:bg-kyroy-orange-hover text-white font-black gap-2 rounded-none border-2 border-kyroy-orange shadow-sm h-10 px-6 text-sm uppercase italic"
        >
          <Plus className="size-4" />
          NUEVA SUCURSAL
        </Button>
      </div>

      <div className="border border-kyroy-border bg-white/50 backdrop-blur-sm overflow-hidden max-h-[75vh] overflow-y-auto shadow-md">
        <Table className="border-collapse">
          <TableHeader className="bg-kyroy-pink-light sticky top-0 z-10 shadow-sm border-b-2 border-kyroy-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 py-0 px-4 w-[120px]">
                <TableFilter 
                  label="ID" 
                  options={getFilterOptions('SC_IDSUCURSAL_PK')}
                  selectedValues={activeFilters['SC_IDSUCURSAL_PK'] || []}
                  onFilterChange={(vals: string[]) => handleFilterChange('SC_IDSUCURSAL_PK', vals)}
                />
              </TableHead>
              <TableHead className="h-10 py-0 px-4">
                <TableFilter 
                  label="Nombre de Sucursal" 
                  options={getFilterOptions('SC_NOMBRE')}
                  selectedValues={activeFilters['SC_NOMBRE'] || []}
                  onFilterChange={(vals: string[]) => handleFilterChange('SC_NOMBRE', vals)}
                />
              </TableHead>
              <TableHead className="h-10 py-0 px-4">
                <TableFilter 
                  label="Dirección" 
                  options={getFilterOptions('SC_DIRECCION')}
                  selectedValues={activeFilters['SC_DIRECCION'] || []}
                  onFilterChange={(vals: string[]) => handleFilterChange('SC_DIRECCION', vals)}
                />
              </TableHead>
              <TableHead className="h-10 py-0 px-4 font-black text-kyroy-pink uppercase tracking-widest text-[10px] text-right w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSedes.length > 0 ? (
              filteredSedes.map((sede) => (
                <TableRow key={sede.SC_IDSUCURSAL_PK} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="py-2 px-4 font-mono text-[10px] text-slate-500 italic">
                    #{sede.SC_IDSUCURSAL_PK}
                  </TableCell>
                  <TableCell className="py-2 px-4 font-bold text-slate-900 dark:text-white text-xs">
                    {sede.SC_NOMBRE}
                  </TableCell>
                  <TableCell className="py-2 px-4 text-xs text-slate-500 truncate max-w-[200px]">
                    {sede.SC_DIRECCION || '---'}
                  </TableCell>
                  <TableCell className="py-2 px-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingSede(sede); setIsModalOpen(true); }}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button 
                        onClick={() => { setSedeToDelete(sede.SC_IDSUCURSAL_PK); setIsAuthOpen(true); }}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500 py-10 italic text-xs">
                  No se encontraron sucursales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      {/* MODAL EDIT/CREATE */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6 border-2 border-kyroy-border rounded-none shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase italic tracking-widest text-kyroy-pink">
                {editingSede ? 'EDITAR SUCURSAL' : 'NUEVA SUCURSAL'}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="SC_NOMBRE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">NOMBRE</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs uppercase focus-visible:ring-kyroy-pink" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="SC_DIRECCION"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">DIRECCIÓN</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs uppercase focus-visible:ring-kyroy-pink" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4 gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-none border-2 border-kyroy-border font-bold uppercase text-xs h-10 px-6 hover:bg-slate-50">
                    CANCELAR
                  </Button>
                  <Button type="submit" disabled={isLoading} className="bg-kyroy-orange hover:bg-kyroy-orange-hover text-white rounded-none border-2 border-kyroy-orange font-bold uppercase text-xs h-10 px-6 shadow-sm">
                    {isLoading ? <Loader2 className="animate-spin size-4" /> : 'GUARDAR'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* AUTH DELETE */}
        <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
          <DialogContent className="max-w-sm p-6 border-2 border-kyroy-border rounded-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase italic tracking-widest text-red-600">
                CONFIRMAR ELIMINACIÓN
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-bold uppercase italic text-kyroy-text">Ingrese contraseña administrativa para confirmar:</p>
              <Input 
                type="password" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)}
                className="h-10 border-2 border-kyroy-border rounded-none text-center font-bold focus-visible:ring-red-500" 
              />
              <div className="flex gap-4 pt-2">
                <Button variant="outline" onClick={() => setIsAuthOpen(false)} className="flex-1 rounded-none border-2 border-kyroy-border font-bold uppercase text-[10px] h-10">CANCELAR</Button>
                <Button onClick={handleDelete} disabled={isLoading || !adminPassword} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-none border-2 border-red-600 font-bold uppercase text-[10px] h-10 shadow-sm">
                  {isLoading ? <Loader2 className="animate-spin size-4" /> : 'ELIMINAR'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </LoadingGate>
  )
}
