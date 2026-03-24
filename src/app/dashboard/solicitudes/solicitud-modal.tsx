'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Package, MapPin, Hash, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { ComboboxSearch } from '@/components/ui/combobox-search'
import { solicitudProductoSchema, type SolicitudProductoFormData } from '@/features/solicitudes/schema'
import { createSolicitud } from '@/features/solicitudes/services'
import { toast } from '@/lib/toast-helper'

interface SolicitudModalProps {
  isOpen: boolean
  onClose: () => void
  products: any[]
  sedes: any[]
  sessionUser: any
}

export function SolicitudModal({
  isOpen,
  onClose,
  products,
  sedes,
  sessionUser
}: SolicitudModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<SolicitudProductoFormData>({
    resolver: zodResolver(solicitudProductoSchema),
    defaultValues: {
      PR_IDPRODUCTO_FK: undefined,
      SC_IDSUCURSAL_FK: sessionUser?.branchId || undefined,
      SP_CANTIDAD: 1,
      SP_ESTADO: 'PENDIENTE',
      SP_COMENTARIOS: ''
    }
  })

  // Reset form when opening/closing
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        PR_IDPRODUCTO_FK: undefined,
        SC_IDSUCURSAL_FK: sessionUser?.branchId || undefined,
        SP_CANTIDAD: 1,
        SP_ESTADO: 'PENDIENTE',
        SP_COMENTARIOS: ''
      })
    }
  }, [isOpen, sessionUser, form])

  const productOptions = products.map(p => ({ label: p.PR_NOMBRE, value: p.PR_IDPRODUCTO_PK }))
  const sedeOptions = sedes.map(s => ({ label: s.SC_NOMBRE, value: s.SC_IDSUCURSAL_PK }))

  const onSubmit = async (data: SolicitudProductoFormData) => {
    setIsLoading(true)
    try {
      const finalData = {
        ...data,
        TR_IDTRABAJADOR_FK: sessionUser?.id
      }
      const res = await createSolicitud(finalData)
      if (res.success) {
        toast.success('Solicitud enviada', 'El pedido se ha registrado correctamente.')
        onClose()
      } else {
        toast.error('Error', res.error || 'No se pudo enviar la solicitud.')
      }
    } catch (error) {
      toast.error('Error', 'Ocurrió un error inesperado.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5 text-[#FF7E5F]" />
            Nueva Solicitud de Producto
          </DialogTitle>
          <DialogDescription>
            Selecciona el producto y la cantidad necesaria para tu sucursal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
            <FormField
              control={form.control}
              name="PR_IDPRODUCTO_FK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="size-3.5 text-slate-400" /> Producto *
                  </FormLabel>
                  <ComboboxSearch
                    options={productOptions}
                    value={field.value}
                    onValueChange={(val) => field.onChange(val)}
                    placeholder="Seleccionar producto..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="SC_IDSUCURSAL_FK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-slate-400" /> Sucursal *
                    </FormLabel>
                    <Select 
                      disabled={sessionUser?.role !== 'ADMINISTRADOR_TOTAL'}
                      onValueChange={(val) => field.onChange(Number(val))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sede..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sedes.map(s => (
                          <SelectItem key={s.SC_IDSUCURSAL_PK} value={s.SC_IDSUCURSAL_PK.toString()}>
                            {s.SC_NOMBRE}
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
                name="SP_CANTIDAD"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="size-3.5 text-slate-400" /> Cantidad *
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="SP_COMENTARIOS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="size-3.5 text-slate-400" /> Comentarios
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Indica detalles adicionales (ej. color, marca, urgencia)" 
                      className="resize-none h-24"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#FF7E5F] hover:bg-[#FF7E5F]/90 text-white" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                Enviar Solicitud
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
