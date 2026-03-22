'use client'

import * as React from 'react'
import { Plus, Search, Shield, Phone, Power, Edit2, Trash2 } from 'lucide-react'
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
import { TableFilter } from '@/components/ui/table-filter' // Added TableFilter
import { WorkerWithStats, WorkerFormData } from '@/features/trabajadores/schema'
import { saveTrabajador, toggleWorkerStatus, deleteWorker } from '@/features/trabajadores/services'
import { WorkerModal } from '@/app/dashboard/trabajadores/worker-modal'
import { DeleteConfirmModal } from '@/app/dashboard/trabajadores/delete-confirm-modal'
import { toast } from '@/lib/toast-helper'
import { LoadingGate } from '@/components/ui/loading-gate'

interface AdminClientProps {
  initialAdmins: WorkerWithStats[]
  roles: any[]
  sedes: any[]
}

export default function AdminClient({ initialAdmins, roles, sedes }: AdminClientProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [editingAdmin, setEditingAdmin] = React.useState<WorkerWithStats | null>(null)
  const [adminToDelete, setAdminToDelete] = React.useState<WorkerWithStats | null>(null)

  const [activeFilters, setActiveFilters] = React.useState<{ [key: string]: string[] }>({})

  const filteredAdmins = React.useMemo(() => {
    return initialAdmins.filter(a => {
      // Búsqueda general
      const searchMatch = !searchTerm ||
        a.TR_NOMBRE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.TR_TELEFONO && a.TR_TELEFONO.includes(searchTerm));

      if (!searchMatch) return false;

      // Filtros por columna
      for (const [col, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        
        let val = '';
        if (col === 'TR_ACTIVO') {
          val = a.TR_ACTIVO ? 'ACTIVO' : 'INACTIVO';
        } else {
          val = (a[col as keyof WorkerWithStats] as string)?.toString() || '';
        }

        if (!values.includes(val)) return false;
      }

      return true;
    })
  }, [initialAdmins, searchTerm, activeFilters])

  const getFilterOptions = (col: string) => {
    if (col === 'TR_ACTIVO') return ['ACTIVO', 'INACTIVO'];
    return Array.from(new Set(initialAdmins.map(a => (a[col as keyof WorkerWithStats] as string)?.toString() || ''))).filter(Boolean).sort()
  }

  const handleFilterChange = (col: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [col]: values }))
  }

  const handleOpenModal = (admin?: WorkerWithStats) => {
    setEditingAdmin(admin || null)
    setIsModalOpen(true)
  }

  const handleOpenDeleteModal = (admin: WorkerWithStats) => {
    setAdminToDelete(admin)
    setIsDeleteModalOpen(true)
  }

  const handleSave = async (data: WorkerFormData) => {
    const res = await saveTrabajador(data)
    if (res.success) {
      toast.success(data.TR_IDTRABAJADOR_PK ? 'Administrador actualizado' : 'Administrador creado')
      setIsModalOpen(false)
    } else {
      toast.error(res.error || 'Error al guardar')
    }
  }

  const handleToggleStatus = async (admin: WorkerWithStats) => {
    const newStatus = !admin.TR_ACTIVO
    const res = await toggleWorkerStatus(admin.TR_IDTRABAJADOR_PK, newStatus)
    if (res.success) {
      toast.success(`Administrador ${newStatus ? 'activado' : 'desactivado'}`)
    } else {
      toast.error(res.error || 'Error al cambiar estado')
    }
  }

  const handleDelete = async (password: string) => {
    if (!adminToDelete) return

    const res = await deleteWorker(adminToDelete.TR_IDTRABAJADOR_PK, password)
    if (res.success) {
      toast.success('Administrador eliminado definitivamente')
      setIsDeleteModalOpen(false)
      setAdminToDelete(null)
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
          Registrar Administrador
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm overflow-hidden max-h-[70vh] overflow-y-auto">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b-2 border-black">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 py-0 px-4">
                  <TableFilter 
                    label="Administrador" 
                    options={getFilterOptions('TR_NOMBRE')}
                    selectedValues={activeFilters['TR_NOMBRE'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('TR_NOMBRE', vals)}
                  />
                </TableHead>
                <TableHead className="h-10 py-0 px-4">
                  <TableFilter 
                    label="Teléfono" 
                    options={getFilterOptions('TR_TELEFONO')}
                    selectedValues={activeFilters['TR_TELEFONO'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('TR_TELEFONO', vals)}
                  />
                </TableHead>
                <TableHead className="h-10 py-0 px-4">
                  <TableFilter 
                    label="Sucursal" 
                    options={getFilterOptions('SC_NOMBRE')}
                    selectedValues={activeFilters['SC_NOMBRE'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('SC_NOMBRE', vals)}
                  />
                </TableHead>
                <TableHead className="h-10 py-0 px-4 text-center">
                  <TableFilter 
                    label="Estado" 
                    align="center"
                    options={getFilterOptions('TR_ACTIVO')}
                    selectedValues={activeFilters['TR_ACTIVO'] || []}
                    onFilterChange={(vals: string[]) => handleFilterChange('TR_ACTIVO', vals)}
                  />
                </TableHead>
                <TableHead className="h-10 py-0 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.TR_IDTRABAJADOR_PK} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="py-2 px-4">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {admin.TR_NOMBRE}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <span className="font-medium text-slate-600 text-xs">
                      {admin.TR_TELEFONO || '---'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <span className="text-[10px] font-black uppercase text-slate-500 italic bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                      {admin.SC_NOMBRE || 'GLOBAL'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm",
                      admin.TR_ACTIVO ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                    )}>
                      {admin.TR_ACTIVO ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                        onClick={() => handleToggleStatus(admin)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                        title="Alternar estado"
                      >
                        <Power className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(admin)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(admin)}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500 italic text-xs">
                    No se encontraron administradores
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <WorkerModal
        key={editingAdmin?.TR_IDTRABAJADOR_PK || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingWorker={editingAdmin}
        roles={roles}
        sedes={sedes}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        workerName={adminToDelete?.TR_NOMBRE || ''}
      />
      </div>
    </LoadingGate>
  )
}
