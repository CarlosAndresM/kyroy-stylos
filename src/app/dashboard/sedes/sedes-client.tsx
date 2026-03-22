'use client'

import * as React from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
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

interface SedesClientProps {
  initialSedes: any[]
}

export function SedesClient({ initialSedes }: SedesClientProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeFilters, setActiveFilters] = React.useState<{ [key: string]: string[] }>({})

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

  return (
    <LoadingGate>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-100 dark:bg-slate-900/50 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="FILTRO RÁPIDO..."
            className="pl-10 h-10 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-slate-950 font-bold text-xs uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        <Button className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black gap-2 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-10 px-6 text-sm uppercase italic">
          <Plus className="size-4" />
          NUEVA SUCURSAL
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden max-h-[75vh] overflow-y-auto shadow-sm">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b-2 border-black">
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
              <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right w-[120px]">Acciones</TableHead>
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
                      <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all">
                        <Edit2 className="size-3.5" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all">
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
    </LoadingGate>
  )
}
