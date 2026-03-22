'use client'

import * as React from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { LoadingGate } from '@/components/ui/loading-gate'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ItemModal } from '@/app/dashboard/catalogos/item-modal'
import { ServiceFormData, ProductFormData } from '@/features/catalog/schema'
import { saveService, saveProduct, deleteService, deleteProduct } from '@/features/catalog/services'
import { toast } from '@/lib/toast-helper'
import { TableFilter } from '@/components/ui/table-filter'

interface CatalogClientProps {
  initialServices: any[]
  initialProducts: any[]
}

export function CatalogClient({ initialServices, initialProducts }: CatalogClientProps) {
  const [activeTab, setActiveTab] = React.useState('servicios')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<any>(null)
  const [activeFilters, setActiveFilters] = React.useState<{ [key: string]: string[] }>({})

  const filteredServices = React.useMemo(() => {
    return initialServices.filter(s => {
      const searchMatch = !searchTerm || s.SV_NOMBRE.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      for (const [col, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        let val = '';
        if (col === 'SV_ACTIVO') val = s.SV_ACTIVO ? 'ACTIVO' : 'INACTIVO';
        else val = s[col]?.toString() || '';
        if (!values.includes(val)) return false;
      }
      return true;
    });
  }, [initialServices, searchTerm, activeFilters])

  const filteredProducts = React.useMemo(() => {
    return initialProducts.filter(p => {
      const searchMatch = !searchTerm || p.PR_NOMBRE.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      for (const [col, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        let val = '';
        if (col === 'PR_ACTIVO') val = p.PR_ACTIVO ? 'ACTIVO' : 'INACTIVO';
        else val = p[col]?.toString() || '';
        if (!values.includes(val)) return false;
      }
      return true;
    });
  }, [initialProducts, searchTerm, activeFilters])

  const getFilterOptions = (tab: string, col: string) => {
    const list = tab === 'servicios' ? initialServices : initialProducts;
    if (col === 'SV_ACTIVO' || col === 'PR_ACTIVO') return ['ACTIVO', 'INACTIVO'];
    return Array.from(new Set(list.map(item => item[col]?.toString() || ''))).filter(Boolean).sort();
  }

  const handleFilterChange = (col: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [col]: values }))
  }

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: any) => {
    const isService = activeTab === 'servicios'
    const res = isService ? await saveService(data) : await saveProduct(data)

    if (res.success) {
      toast.success(isService ? 'Servicio guardado' : 'Producto guardado')
      setIsModalOpen(false)
    } else {
      toast.error(res.error || 'Error al guardar')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.')) return

    const isService = activeTab === 'servicios'
    const res = isService ? await deleteService(id) : await deleteProduct(id)

    if (res.success) {
      toast.success(isService ? 'Servicio eliminado' : 'Producto eliminado')
    } else {
      toast.error(res.error || 'Error al eliminar')
    }
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

        <Button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black gap-2 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-10 px-6 text-sm uppercase italic"
        >
          <Plus className="size-4" />
          {activeTab === 'servicios' ? 'NUEVO SERVICIO' : 'NUEVO PRODUCTO'}
        </Button>
      </div>

      <Tabs defaultValue="servicios" className="w-full" onValueChange={(v) => {
        setActiveTab(v);
        setActiveFilters({});
      }}>
        <TabsList className="bg-slate-50 dark:bg-slate-950 p-0 rounded-none border-2 border-black h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger value="servicios" className="rounded-none px-12 h-full data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs uppercase tracking-widest border-r-2 border-black">
            Servicios
          </TabsTrigger>
          <TabsTrigger value="productos" className="rounded-none px-12 h-full data-[state=active]:bg-black data-[state=active]:text-white font-black text-xs uppercase tracking-widest">
            Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicios" className="mt-6">
          <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden max-h-[60vh] overflow-y-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b-2 border-black">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 py-0 px-4 w-[110px]">
                    <TableFilter
                      label="ID"
                      options={getFilterOptions('servicios', 'SV_IDSERVICIO_PK')}
                      selectedValues={activeFilters['SV_IDSERVICIO_PK'] || []}
                      onFilterChange={(vals: string[]) => handleFilterChange('SV_IDSERVICIO_PK', vals)}
                    />
                  </TableHead>
                  <TableHead className="h-10 py-0 px-4">
                    <TableFilter
                      label="Nombre"
                      options={getFilterOptions('servicios', 'SV_NOMBRE')}
                      selectedValues={activeFilters['SV_NOMBRE'] || []}
                      onFilterChange={(vals: string[]) => handleFilterChange('SV_NOMBRE', vals)}
                    />
                  </TableHead>
                  <TableHead className="h-10 py-0 px-4 text-center">
                    <TableFilter
                      label="Estado"
                      align="center"
                      options={getFilterOptions('servicios', 'SV_ACTIVO')}
                      selectedValues={activeFilters['SV_ACTIVO'] || []}
                      onFilterChange={(vals: string[]) => handleFilterChange('SV_ACTIVO', vals)}
                    />
                  </TableHead>
                  <TableHead className="h-10 py-0 px-4 text-right w-[100px]">
                    <span className="font-black uppercase tracking-widest text-[10px] text-slate-500">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.SV_IDSERVICIO_PK} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800/50">
                    <TableCell className="py-2 px-4 font-mono text-[10px] text-slate-500 italic">
                      #{service.SV_IDSERVICIO_PK}
                    </TableCell>
                    <TableCell className="py-2 px-4 font-bold text-slate-900 dark:text-white text-xs">
                      {service.SV_NOMBRE}
                    </TableCell>
                    <TableCell className="py-2 px-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm",
                        service.SV_ACTIVO ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {service.SV_ACTIVO ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(service)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.SV_IDSERVICIO_PK)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500 py-4 italic text-xs">
                      No hay servicios registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="productos" className="mt-6">
          <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden max-h-[60vh] overflow-y-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b-2 border-black">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 py-0 px-4 w-[110px]">
                    <TableFilter
                      label="ID"
                      options={getFilterOptions('productos', 'PR_IDPRODUCTO_PK')}
                      selectedValues={activeFilters['PR_IDPRODUCTO_PK'] || []}
                      onFilterChange={(vals: string[]) => handleFilterChange('PR_IDPRODUCTO_PK', vals)}
                    />
                  </TableHead>
                  <TableHead className="h-10 py-0 px-4">
                    <TableFilter
                      label="Nombre"
                      options={getFilterOptions('productos', 'PR_NOMBRE')}
                      selectedValues={activeFilters['PR_NOMBRE'] || []}
                      onFilterChange={(vals: string[]) => handleFilterChange('PR_NOMBRE', vals)}
                    />
                  </TableHead>
                  <TableHead className="h-10 py-0 px-4 text-center">
                    <TableFilter
                      label="Estado"
                      align="center"
                      options={getFilterOptions('productos', 'PR_ACTIVO')}
                      selectedValues={activeFilters['PR_ACTIVO'] || []}
                      onFilterChange={(vals: string[]) => handleFilterChange('PR_ACTIVO', vals)}
                    />
                  </TableHead>
                  <TableHead className="h-10 py-0 px-4 text-right w-[100px]">
                    <span className="font-black uppercase tracking-widest text-[10px] text-slate-500">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.PR_IDPRODUCTO_PK} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800/50">
                    <TableCell className="py-2 px-4 font-mono text-[10px] text-slate-500 italic">
                      #{product.PR_IDPRODUCTO_PK}
                    </TableCell>
                    <TableCell className="py-2 px-4 font-bold text-slate-900 dark:text-white text-xs">
                      {product.PR_NOMBRE}
                    </TableCell>
                    <TableCell className="py-2 px-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm",
                        product.PR_ACTIVO ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {product.PR_ACTIVO ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.PR_IDPRODUCTO_PK)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500 py-4 italic text-xs">
                      No hay productos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ItemModal
        key={`${activeTab}-${editingItem?.SV_IDSERVICIO_PK || editingItem?.PR_IDPRODUCTO_PK || 'new'}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        type={activeTab === 'servicios' ? 'service' : 'product'}
      />
      </div>
    </LoadingGate>
  )
}

