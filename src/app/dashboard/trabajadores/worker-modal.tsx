'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { workerSchema, WorkerFormData } from '@/features/trabajadores/schema'
import { Loader2 } from 'lucide-react'

interface WorkerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: WorkerFormData) => Promise<void>
  editingWorker?: any
  roles: any[]
  sedes: any[]
}

export function WorkerModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingWorker, 
  roles, 
  sedes 
}: WorkerModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      TR_IDTRABAJADOR_PK: editingWorker?.TR_IDTRABAJADOR_PK,
      TR_NOMBRE: editingWorker?.TR_NOMBRE || '',
      TR_TELEFONO: editingWorker?.TR_TELEFONO || '',
      TR_PASSWORD: '',
      TR_ACTIVO: editingWorker ? !!editingWorker.TR_ACTIVO : true,
      RL_IDROL_FK: editingWorker?.RL_IDROL_FK,
      SC_IDSUCURSAL_FK: editingWorker?.SC_IDSUCURSAL_FK,
      TR_SUELDO_BASE: editingWorker?.TR_SUELDO_BASE || 0,
    }
  })

  // Reset form when editingWorker changes
  React.useEffect(() => {
    if (editingWorker) {
      form.reset({
        TR_IDTRABAJADOR_PK: editingWorker.TR_IDTRABAJADOR_PK,
        TR_NOMBRE: editingWorker.TR_NOMBRE,
        TR_TELEFONO: editingWorker.TR_TELEFONO || '',
        TR_PASSWORD: '',
        TR_ACTIVO: !!editingWorker.TR_ACTIVO,
        RL_IDROL_FK: editingWorker.RL_IDROL_FK,
        SC_IDSUCURSAL_FK: editingWorker.SC_IDSUCURSAL_FK,
        TR_SUELDO_BASE: editingWorker.TR_SUELDO_BASE || 0,
      })
    } else {
      form.reset({
        TR_IDTRABAJADOR_PK: undefined,
        TR_NOMBRE: '',
        TR_TELEFONO: '',
        TR_PASSWORD: '',
        TR_ACTIVO: true,
        RL_IDROL_FK: undefined,
        SC_IDSUCURSAL_FK: undefined,
        TR_SUELDO_BASE: 0,
      })
    }
  }, [editingWorker, form, isOpen])

  const onSubmit = async (data: WorkerFormData) => {
    setIsSubmitting(true)
    try {
      await onSave(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] border-2 border-kyroy-border rounded-none shadow-[12px_12px_0px_0px_rgba(255,134,162,0.15)] p-0 bg-white overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-kyroy-pink to-rose-400 p-6 border-b-2 border-kyroy-pink">
          <DialogTitle className="text-xl font-black text-white uppercase italic tracking-widest">
            {editingWorker ? 'EDITAR TRABAJADOR' : 'NUEVO TRABAJADOR'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="TR_NOMBRE"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Juan Pérez" {...field} className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs focus-visible:ring-kyroy-pink" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="TR_TELEFONO"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} value={field.value || ''} className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs focus-visible:ring-kyroy-pink" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="TR_PASSWORD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={editingWorker ? "Dejar en blanco" : "Mínimo 6 caracteres"} {...field} className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs focus-visible:ring-kyroy-pink" autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="RL_IDROL_FK"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">Rol</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs">
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none border-2 border-kyroy-border shadow-xl">
                          {roles.map((role) => (
                            <SelectItem key={role.RL_IDROL_PK} value={role.RL_IDROL_PK.toString()}>
                              {role.RL_NOMBRE.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="SC_IDSUCURSAL_FK"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">Sucursal</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === 'none' ? null : parseInt(val))} 
                        value={field.value?.toString() || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs focus-visible:ring-kyroy-pink">
                            <SelectValue placeholder="Seleccione sucursal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none border-2 border-kyroy-border shadow-xl">
                          <SelectItem value="none">Sin sucursal (Global)</SelectItem>
                          {sedes.map((sede) => (
                            <SelectItem key={sede.SC_IDSUCURSAL_PK} value={sede.SC_IDSUCURSAL_PK.toString()}>
                              {sede.SC_NOMBRE}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="TR_SUELDO_BASE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-kyroy-text italic">Sueldo Base ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} className="h-10 border-2 border-kyroy-border rounded-none font-bold text-xs focus-visible:ring-kyroy-pink" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="TR_ACTIVO"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-none border border-kyroy-border p-4 bg-kyroy-pink-light">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-black uppercase italic">Estado de Cuenta</FormLabel>
                      <p className="text-[10px] text-kyroy-text italic">Desactiva para impedir el acceso al sistema.</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-kyroy-pink"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="rounded-none border-2 border-kyroy-border font-bold uppercase text-xs h-10 px-6 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-kyroy-orange hover:bg-kyroy-orange-hover text-white font-black rounded-none border-2 border-kyroy-orange h-10 px-8 shadow-sm uppercase italic text-sm"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingWorker ? 'Guardar Cambios' : 'Crear Trabajador'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
