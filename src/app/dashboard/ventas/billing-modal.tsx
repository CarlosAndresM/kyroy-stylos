'use client'

import * as React from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Trash2,
  Receipt,
  User,
  Phone,
  Scissors,
  Package,
  DollarSign,
  PlusCircle,
  X,
  Camera,
  FileText,
  Save,
  Check,
  Calendar as CalendarIcon,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { NumericFormat } from 'react-number-format'
import { invoiceSchema, type InvoiceFormData } from '@/features/billing/schema'
import { saveInvoice, getNextInvoiceNumber } from '@/features/billing/services'
import { toast } from '@/lib/toast-helper'
import { cn } from '@/lib/utils'
import { ComboboxSearch } from '@/components/ui/combobox-search'
import { compressImage } from '@/lib/image-utils'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface BillingModalProps {
  isOpen: boolean
  onClose: () => void
  technicians: any[]
  services: any[]
  products: any[]
  paymentMethods: any[]
  sucursales: any[]
  sessionUser: any
  invoice?: any // Factura para editar
  isViewOnly?: boolean // Modo solo lectura
}

export function BillingModal({
  isOpen,
  onClose,
  technicians,
  services,
  products,
  paymentMethods,
  sucursales,
  sessionUser,
  invoice,
  isViewOnly = false
}: BillingModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [nextInvoiceNum, setNextInvoiceNum] = React.useState<string>('')
  const [uploadingIndexes, setUploadingIndexes] = React.useState<number[]>([])
  const fileInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({})
  const uploadedTempFiles = React.useRef<string[]>([])
  const [isAdminAuthOpen, setIsAdminAuthOpen] = React.useState(false)
  const [adminPassword, setAdminPassword] = React.useState('')
  const [isVerifyingAdmin, setIsVerifyingAdmin] = React.useState(false)
  const [pendingStatusChange, setPendingStatusChange] = React.useState<string | null>(null)

  const isEditing = !!invoice
  const isPaid = isViewOnly || ((invoice?.FC_ESTADO === 'PAGADO' || invoice?.FC_ESTADO === 'CANCELADO') && sessionUser?.role !== 'ADMINISTRADOR_TOTAL')

  const cleanupTempFiles = async (urls?: string[]) => {
    const filesToDelete = urls || uploadedTempFiles.current
    for (const url of filesToDelete) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
      } catch (error) {
        console.error('Error al limpiar archivo temporal:', error)
      }
    }
    if (!urls) uploadedTempFiles.current = []
  }

  const [uploadingPhysical, setUploadingPhysical] = React.useState(false)
  const physicalInvoiceInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhysicalInvoiceUpload = async (file: File) => {
    setUploadingPhysical(true)
    try {
      const compressedFile = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressedFile, file.name)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        const prevUrl = form.getValues(`FC_EVIDENCIA_FISICA_URL`)
        if (prevUrl && prevUrl.includes('/temp/')) {
          cleanupTempFiles([prevUrl])
        }
        form.setValue(`FC_EVIDENCIA_FISICA_URL`, data.url)
        uploadedTempFiles.current.push(data.url)
      } else {
        toast.error(data.error || 'Error al subir imagen')
      }
    } catch (error) {
      console.error('Error en upload factura:', error)
      toast.error('Error al procesar la imagen')
    } finally {
      setUploadingPhysical(false)
    }
  }

  const handleFileUpload = async (index: number, file: File) => {
    setUploadingIndexes(prev => [...prev, index])
    try {
      const compressedFile = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressedFile, file.name)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        const prevUrl = form.getValues(`payments.${index}.PF_EVIDENCIA_URL`)
        if (prevUrl && prevUrl.includes('/temp/')) {
          cleanupTempFiles([prevUrl])
        }

        form.setValue(`payments.${index}.PF_EVIDENCIA_URL`, data.url)
        uploadedTempFiles.current.push(data.url)
      } else {
        toast.error(data.error || 'Error al subir imagen')
      }
    } catch (error) {
      console.error('Error en upload:', error)
      toast.error('Error al procesar o subir la imagen')
    } finally {
      setUploadingIndexes(prev => prev.filter(i => i !== index))
    }
  }

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      FC_CLIENTE_NOMBRE: '',
      FC_CLIENTE_TELEFONO: '',
      FC_TIPO_CLIENTE: 'CLIENTE',
      TR_IDCLIENTE_FK: null,
      isVale: false,
      VL_NUMERO_CUOTAS: 1,
      VL_FECHA_INICIO_COBRO: new Date(),
      FC_FECHA: new Date(),
      SC_IDSUCURSAL_FK: sessionUser?.sucursal_id || 1,
      TR_IDCAJERO_FK: sessionUser?.id || 1,
      services: [{ tempId: uuidv4(), SV_IDSERVICIO_FK: undefined as any, TR_IDTECNICO_FK: undefined as any, FD_VALOR: 0, products: [] }],
      products: [],
      payments: [],
      FC_ESTADO: 'PENDIENTE',
      FC_TOTAL: 0,
      FC_EVIDENCIA_FISICA_URL: null
    }
  })

  // Cargar datos si estamos editando
  React.useEffect(() => {
    if (isOpen && invoice) {
      // Re-estructurar datos: mapear productos a sus servicios correspondientes basados en FD_IDDETALLE_FK
      const mappedServices = (invoice.services || []).map((s: any) => {
        const serviceProds = (invoice.products || []).filter((p: any) =>
          p.FD_IDDETALLE_FK && String(p.FD_IDDETALLE_FK) === String(s.FD_IDDETALLE_PK)
        )
        return {
          ...s,
          tempId: s.tempId || uuidv4(),
          products: serviceProds
        }
      })

      // Productos independientes (si quedara alguno)
      const standaloneProducts = (invoice.products || []).filter((p: any) => !p.FD_IDDETALLE_FK)

      form.reset({
        FC_IDFACTURA_PK: invoice.FC_IDFACTURA_PK,
        FC_NUMERO_FACTURA: invoice.FC_NUMERO_FACTURA,
        FC_FECHA: new Date(invoice.FC_FECHA),
        FC_TIPO_CLIENTE: invoice.FC_TIPO_CLIENTE,
        TR_IDCLIENTE_FK: invoice.TR_IDCLIENTE_FK,
        isVale: invoice.isVale,
        VL_NUMERO_CUOTAS: invoice.VL_NUMERO_CUOTAS || 1,
        VL_FECHA_INICIO_COBRO: invoice.VL_FECHA_INICIO_COBRO ? new Date(invoice.VL_FECHA_INICIO_COBRO) : null,
        FC_CLIENTE_NOMBRE: invoice.FC_CLIENTE_NOMBRE,
        FC_CLIENTE_TELEFONO: invoice.FC_CLIENTE_TELEFONO,
        SC_IDSUCURSAL_FK: invoice.SC_IDSUCURSAL_FK,
        TR_IDCAJERO_FK: invoice.TR_IDCAJERO_FK,
        services: mappedServices,
        products: standaloneProducts,
        payments: invoice.payments || [],
        FC_ESTADO: invoice.FC_ESTADO,
        FC_TOTAL: Number(invoice.FC_TOTAL),
        FC_EVIDENCIA_FISICA_URL: invoice.FC_EVIDENCIA_FISICA_URL
      })
    } else if (isOpen && !invoice) {
      form.reset({
        FC_CLIENTE_NOMBRE: '',
        FC_CLIENTE_TELEFONO: '',
        FC_TIPO_CLIENTE: 'CLIENTE',
        TR_IDCLIENTE_FK: null,
        isVale: false,
        VL_NUMERO_CUOTAS: 1,
        VL_FECHA_INICIO_COBRO: new Date(),
        FC_FECHA: new Date(),
        SC_IDSUCURSAL_FK: sessionUser?.sucursal_id || 1,
        TR_IDCAJERO_FK: sessionUser?.id || 1,
        services: [{ tempId: uuidv4(), SV_IDSERVICIO_FK: undefined as any, TR_IDTECNICO_FK: undefined as any, FD_VALOR: 0, products: [] }],
        products: [],
        payments: [],
        FC_ESTADO: 'PENDIENTE',
        FC_TOTAL: 0,
        FC_EVIDENCIA_FISICA_URL: null
      })
      getNextInvoiceNumber().then(res => {
        if (res.success) {
          const num = String(res.data)
          setNextInvoiceNum(num)
          form.setValue("FC_NUMERO_FACTURA", num)
        }
      })
    }
  }, [isOpen, invoice, form])

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services"
  })

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control: form.control,
    name: "products"
  })

  // Watchers con useWatch para máxima reactividad
  const watchedServices = useWatch({ control: form.control, name: "services" }) || []
  const watchedProducts = useWatch({ control: form.control, name: "products" }) || []
  const watchedPayments = useWatch({ control: form.control, name: "payments" }) || []
  const clientType = useWatch({ control: form.control, name: "FC_TIPO_CLIENTE" })

  // El total se calcula dinámicamente para la UI, ya no se sincroniza al estado del form para evitar bucles de renderizado
  const total = React.useMemo(() => {
    const sTotal = (watchedServices || []).reduce((sum, s) => {
      const base = Number(s.FD_VALOR) || 0
      const prodsTotal = (s.products || []).reduce((ps, p: any) => ps + (Number(p.FP_VALOR) || 0), 0)
      return sum + base + prodsTotal
    }, 0)
    const pTotal = (watchedProducts || []).reduce((sum, p) => sum + (Number(p.FP_VALOR) || 0), 0)
    return sTotal + pTotal
  }, [watchedServices, watchedProducts])

  const totalPaid = React.useMemo(() => {
    return (watchedPayments || []).reduce((sum, p) => sum + (Number(p.PF_VALOR) || 0), 0)
  }, [watchedPayments])

  const balance = total - totalPaid

  // Auto-balancear si hay un solo método de pago y es de tipo deuda (o si el usuario lo solicita)
  const handleBalance = React.useCallback(() => {
    if (watchedPayments.length > 0) {
      const idx = watchedPayments.length - 1
      const currentVal = Number(watchedPayments[idx].PF_VALOR) || 0
      form.setValue(`payments.${idx}.PF_VALOR`, currentVal + balance)
    }
  }, [balance, watchedPayments, form])

  // Si cambia el total y solo hay un pago de crédito/vale, lo actualizamos automáticamente
  React.useEffect(() => {
    if (watchedPayments.length === 1) {
      const methodId = watchedPayments[0].MP_IDMETODO_FK
      const methodName = paymentMethods.find(m => m.MP_IDMETODO_PK === methodId)?.MP_NOMBRE.toUpperCase()
      if (methodName === 'CREDITO' || methodName === 'VALE') {
         form.setValue('payments.0.PF_VALOR', total)
      }
    }
  }, [total, paymentMethods, form]) // Solo cuando cambia el total y hay un solo pago

  // Mapeo para comboboxes
  const technicianOptions = technicians.map(t => ({ label: t.TR_NOMBRE, value: t.TR_IDTRABAJADOR_PK }))
  const serviceOptions = services.map(s => ({ label: s.SV_NOMBRE, value: s.SV_IDSERVICIO_PK }))
  const productOptions = products.map(p => ({ label: p.PR_NOMBRE, value: p.PR_IDPRODUCTO_PK }))

  // Manejo de pagos
  const handlePaymentToggle = (method: any, checked: boolean) => {
    const currentPayments = form.getValues("payments") || []
    const isValeMethod = method.MP_NOMBRE?.toUpperCase() === 'VALE'

    if (checked) {
      const currentPayments = form.getValues("payments") || []
      const newPayments = [...currentPayments, { MP_IDMETODO_FK: method.MP_IDMETODO_PK, PF_VALOR: 0, PF_EVIDENCIA_URL: '' }]

      if (newPayments.length === 1) {
        newPayments[0].PF_VALOR = total
      }

      form.setValue("payments", newPayments)
      if (isValeMethod) form.setValue("isVale", true)
    } else {
      const paymentToRemove = currentPayments.find(p => p.MP_IDMETODO_FK === method.MP_IDMETODO_PK)
      if (paymentToRemove?.PF_EVIDENCIA_URL && paymentToRemove.PF_EVIDENCIA_URL.includes('/temp/')) {
        cleanupTempFiles([paymentToRemove.PF_EVIDENCIA_URL])
      }

      const filteredPayments = currentPayments.filter(p => p.MP_IDMETODO_FK !== method.MP_IDMETODO_PK)

      form.setValue("payments", filteredPayments)
      if (isValeMethod) form.setValue("isVale", false)
    }
  }

  // Auto-distribución si solo hay uno seleccionado
  React.useEffect(() => {
    if (watchedPayments.length === 1) {
      form.setValue(`payments.0.PF_VALOR`, total)
    }
  }, [total, watchedPayments.length, form])

  // Limpiar VALE si cambia a CLIENTE
  React.useEffect(() => {
    if (clientType === 'CLIENTE') {
      const valeMethod = paymentMethods.find(m => m.MP_NOMBRE?.toUpperCase() === 'VALE')
      if (valeMethod) {
        const currentPayments = form.getValues("payments") || []
        const hasVale = currentPayments.some(p => p.MP_IDMETODO_FK === valeMethod.MP_IDMETODO_PK)
        if (hasVale) {
          form.setValue("payments", currentPayments.filter(p => p.MP_IDMETODO_FK !== valeMethod.MP_IDMETODO_PK))
        }
      }
    }
  }, [clientType, paymentMethods, form])

  // Sync isVale checkbox with VALE payment method
  React.useEffect(() => {
    const isValeValue = form.watch("isVale")
    const valeMethod = paymentMethods.find(m => m.MP_NOMBRE?.toUpperCase() === 'VALE')

    if (clientType === 'TECNICO' && isValeValue && valeMethod) {
      const currentPayments = form.getValues("payments") || []
      const alreadyHasVale = currentPayments.find(p => p.MP_IDMETODO_FK === valeMethod.MP_IDMETODO_PK)

      if (!alreadyHasVale) {
        form.setValue("payments", [{ MP_IDMETODO_FK: valeMethod.MP_IDMETODO_PK, PF_VALOR: total, PF_EVIDENCIA_URL: '' }])
      }
    } else if (!isValeValue && clientType === 'TECNICO') {
      const valeMethod = paymentMethods.find(m => m.MP_NOMBRE?.toUpperCase() === 'VALE')
      if (valeMethod) {
        const currentPayments = form.getValues("payments") || []
        form.setValue("payments", currentPayments.filter(p => p.MP_IDMETODO_FK !== valeMethod.MP_IDMETODO_PK))
      }
    }
  }, [form.watch("isVale"), clientType, total, paymentMethods, form])

  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    toast.error('Datos incompletos', 'Por favor revise los campos marcados en rojo.');

    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error('Error detallado', firstError.message);
    }
  }

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true)
    try {
      // Inyectar el total calculado antes de enviar
      const finalData = { ...data, FC_TOTAL: total };
      console.log("Submitting Invoice Data:", finalData);
      const res = await saveInvoice(finalData)
      if (res.success) {
        toast.success(isEditing ? 'Factura actualizada' : 'Factura guardada')
        uploadedTempFiles.current = []
        form.reset()
        onClose()
      } else {
        toast.error(res.error || 'Error al procesar factura')
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error('Error de sistema')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    cleanupTempFiles()
    onClose()
  }

  const handleStatusChange = async (newStatus: string) => {
    const isRestrictedOriginalStatus = invoice?.FC_ESTADO === 'PAGADO' || invoice?.FC_ESTADO === 'CANCELADO'

    if (isRestrictedOriginalStatus && newStatus !== invoice.FC_ESTADO) {
      setPendingStatusChange(newStatus)
      setIsAdminAuthOpen(true)
      return
    }

    form.setValue("FC_ESTADO", newStatus as any)
  }

  const verifyAdminAndChangeStatus = async () => {
    if (!adminPassword) {
      toast.error('Ingrese la contraseña')
      return
    }

    setIsVerifyingAdmin(true)
    try {
      const { verifyAdminPassword } = await import('@/features/billing/services')
      const res = await verifyAdminPassword(adminPassword)
      if (res.success) {
        form.setValue("FC_ESTADO", pendingStatusChange as any)
        setIsAdminAuthOpen(false)
        setAdminPassword('')
        setPendingStatusChange(null)
        toast.success('Estado actualizado correctamente')
      } else {
        toast.error(res.error || 'Contraseña incorrecta')
      }
    } catch (error) {
      toast.error('Error de verificación')
    } finally {
      setIsVerifyingAdmin(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[1000px] max-h-[95vh] overflow-y-auto rounded-none p-0 border-2 border-rose-200 bg-white dark:bg-slate-950">
        <DialogHeader className="sr-only">
          <DialogTitle>Hoja de Venta</DialogTitle>
          <DialogDescription>{isEditing ? 'Edición' : 'Creación'} de factura de servicio</DialogDescription>
        </DialogHeader>

        {/* Modal de Autenticación Admin */}
        {isAdminAuthOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white border-2 border-rose-200 p-6 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-sm font-black uppercase mb-4 tracking-tighter">SEGURIDAD: REQUERIDO ADMIN</h3>
              <p className="text-[10px] text-black mb-4 font-bold uppercase italic">Para cambiar una factura PAGADA debe autorizar como administrador.</p>
              <Input
                type="password"
                placeholder="CONTRASEÑA ADMINISTRADOR"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="rounded-none border-rose-200 mb-4 font-black placeholder:text-black/40"
                autoFocus
                autoComplete="new-password"
                onKeyDown={(e) => e.key === 'Enter' && verifyAdminAndChangeStatus()}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-none border-rose-200 uppercase font-bold text-xs"
                  onClick={() => {
                    setIsAdminAuthOpen(false)
                    setAdminPassword('')
                    setPendingStatusChange(null)
                  }}
                >
                  CANCELAR
                </Button>
                <Button
                  className="flex-1 rounded-none bg-black text-white hover:bg-slate-800 uppercase font-black text-xs gap-2"
                  onClick={verifyAdminAndChangeStatus}
                  disabled={isVerifyingAdmin}
                >
                  {isVerifyingAdmin && <Loader2 className="size-3 animate-spin" />}
                  AUTORIZAR
                </Button>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col min-h-full font-mono text-black dark:text-white pb-6">
            <div className="p-4 pb-2 flex flex-col lg:flex-row justify-between items-start gap-6 relative">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-8 w-full lg:w-auto">
                <div className="flex flex-col gap-4 w-full lg:w-[350px]">
                  <div className="border border-rose-200 bg-white p-4 shadow-sm space-y-4">
                    <div className="space-y-3">
                      {clientType === 'CLIENTE' ? (
                        <>
                          <FormField
                            control={form.control}
                            name="FC_CLIENTE_NOMBRE"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black uppercase text-black italic">CLIENTE:</label>
                                  <Input {...field} value={field.value || ''} disabled={isPaid} placeholder="NOMBRE COMPLETO" className="border-0 border-b border-rose-200 p-0 h-7 focus-visible:ring-0 text-[12px] font-bold uppercase rounded-none placeholder:text-black/40 flex-1 bg-transparent text-black" />
                                </div>
                                <FormMessage className="text-[9px] font-bold text-red-600" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="FC_CLIENTE_TELEFONO"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black uppercase text-black italic">CONTACTO:</label>
                                  <Input {...field} value={field.value || ''} disabled={isPaid} placeholder="300 000 0000" className="border-0 border-b border-rose-200 p-0 h-7 focus-visible:ring-0 text-[12px] font-bold uppercase rounded-none placeholder:text-black/40 flex-1 bg-transparent text-black" />
                                </div>
                                <FormMessage className="text-[9px] font-bold text-red-600" />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <FormField
                          control={form.control}
                          name="TR_IDCLIENTE_FK"
                          render={({ field }) => (
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-black italic">PERSONAL / TÉCNICO:</label>
                              <ComboboxSearch
                                options={technicianOptions}
                                value={field.value || ''}
                                disabled={isPaid}
                                onValueChange={(val) => field.onChange(val)}
                                placeholder="BUSCAR..."
                                className="h-8 rounded-none border-rose-200 bg-transparent text-xs flex-1 text-black font-bold uppercase"
                              />
                            </div>
                          )}
                        />
                      )}
                    </div>

                    <div className="pt-2 border-t border-rose-200">
                      <label className="text-[9px] font-black uppercase text-black italic mb-1.5 block">FACTURA FÍSICA:</label>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" className="hidden" ref={physicalInvoiceInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhysicalInvoiceUpload(file) }} />
                        <button
                          type="button"
                          disabled={uploadingPhysical || (isPaid && !isAdminAuthOpen)}
                          onClick={() => physicalInvoiceInputRef.current?.click()}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-1.5 rounded-none text-[10px] font-bold transition-all border cursor-pointer uppercase min-h-[32px] flex-1",
                            uploadingPhysical ? "bg-slate-50 border-rose-200 text-black" :
                              form.watch("FC_EVIDENCIA_FISICA_URL")
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 text-white bg-slate-900 hover:bg-black"
                          )}
                        >
                          {uploadingPhysical ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                          {form.watch("FC_EVIDENCIA_FISICA_URL") ? 'FOTO ADJUNTA' : 'SUBIR EVIDENCIA'}
                        </button>
                        {form.watch("FC_EVIDENCIA_FISICA_URL") && (
                          <a href={form.watch("FC_EVIDENCIA_FISICA_URL")!} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-black hover:underline underline">VER</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full sm:w-auto">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-black italic">CATEGORÍA:</label>
                    <Select value={clientType} disabled={isPaid} onValueChange={(val) => form.setValue("FC_TIPO_CLIENTE", val as any)} >
                      <SelectTrigger className="w-full sm:w-[150px] h-9 rounded-none border-rose-200 bg-white text-[11px] font-bold uppercase text-black">
                        <SelectValue placeholder="TIPO" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-rose-200">
                        <SelectItem value="CLIENTE" className="text-[11px] font-bold uppercase text-black">CLIENTE NORMAL</SelectItem>
                        <SelectItem value="TECNICO" className="text-[11px] font-bold uppercase text-black">PERSONAL TÉCNICO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="SC_IDSUCURSAL_FK"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-black italic">SUCURSAL:</label>
                        <Select value={field.value?.toString()} onValueChange={(val) => field.onChange(Number(val))} disabled={sessionUser?.role !== 'ADMINISTRADOR_TOTAL'} >
                          <SelectTrigger className="w-full sm:w-[150px] h-9 rounded-none border-rose-200 bg-white text-[11px] font-bold uppercase text-black">
                            <SelectValue placeholder="SEDE" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-rose-200">
                            {sucursales.map(s => (
                              <SelectItem key={s.SC_IDSUCURSAL_PK} value={s.SC_IDSUCURSAL_PK.toString()} className="text-[11px] font-bold uppercase text-black">
                                {s.SC_NOMBRE}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                </div>

                {form.watch("isVale") && (
                  <div className="flex flex-col gap-4 w-full sm:w-[200px] bg-amber-50/50 p-3 border-2 border-dashed border-amber-600 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="size-3.5 text-amber-700" />
                      <span className="text-[10px] font-black uppercase text-amber-700 italic">VALE / VOLANTE</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-black italic">INICIO COBRO:</label>
                      <FormField
                        control={form.control}
                        name="VL_FECHA_INICIO_COBRO"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                disabled={isPaid}
                                className="w-full h-8 bg-white border border-rose-200 rounded-none flex items-center px-2 text-[11px] font-bold uppercase text-black"
                              >
                                {field.value ? format(field.value, "dd/MM/yyyy") : "SELECCIONAR"}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-none border border-rose-200" align="start">
                              <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus className="rounded-none shadow-none" />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-black italic">CUOTAS SEMANALES:</label>
                      <FormField
                        control={form.control}
                        name="VL_NUMERO_CUOTAS"
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            min={1}
                            disabled={isPaid}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="h-8 rounded-none border-rose-200 bg-white text-[11px] font-black text-black px-2"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-start lg:items-end gap-5 w-full lg:w-auto lg:pr-4">
                <div className="flex flex-col lg:items-end gap-1.5">
                  <label className="text-[9px] font-black uppercase text-black italic">FECHA DE EMISIÓN:</label>
                  <FormField
                    control={form.control}
                    name="FC_FECHA"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className={cn(
                            "text-[13px] font-black uppercase tracking-tight hover:text-black transition-colors flex items-center gap-2 border-b-2 border-rose-200 pb-1",
                            !field.value ? "text-black/40" : "text-black"
                          )}>
                            <CalendarIcon className="size-4" />
                            {field.value ? format(field.value, "d 'DE' MMMM, yyyy", { locale: es }) : "SELECCIONAR FECHA"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border border-rose-200 shadow-xl" align="end">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus className="rounded-none shadow-none" />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>

                <div className="flex flex-col items-start lg:items-end gap-1.5">
                  <label className="text-[9px] font-black uppercase text-black italic">NRO. FACTURA / REF:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-black">REF#</span>
                    <FormField
                      control={form.control}
                      name="FC_NUMERO_FACTURA"
                      render={({ field }) => (
                        <input
                          {...field}
                          value={field.value || ''}
                          disabled={isEditing}
                          className="text-[16px] font-black uppercase text-black bg-white border border-rose-200 px-3 h-10 w-32 text-right rounded-none focus:outline-none focus:border-rose-200 transition-all disabled:bg-slate-50 disabled:text-black/30 shadow-sm"
                          placeholder="0000"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-rose-200 border-b-0 p-3 sm:p-2 px-4 gap-3 sm:gap-4">
                <span className="text-[10px] font-bold uppercase text-black italic">DETALLE DE VENTA</span>
                <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isPaid}
                    onClick={() => appendService({ tempId: uuidv4(), SV_IDSERVICIO_FK: undefined as any, TR_IDTECNICO_FK: undefined as any, FD_VALOR: 0, products: [] })}
                    className={cn(
                      "flex-1 sm:flex-none text-[10px] sm:text-[12px] font-black flex items-center justify-center gap-1.5 hover:bg-slate-900 hover:text-white text-slate-900 bg-white border-2 border-slate-900 px-3 sm:px-4 py-2 sm:py-1.5 transition-all uppercase tracking-tighter cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]",
                      isPaid && "opacity-50 cursor-not-allowed shadow-none active:translate-x-0 active:translate-y-0"
                    )}
                  >
                    <PlusCircle className="size-3.5 sm:size-4" /> SERVICIO
                  </button>
                </div>
              </div>
              <div className="border border-rose-200 rounded-none shadow-sm overflow-hidden">
                <div className="hidden lg:grid grid-cols-12 bg-[#ff86a2] text-white text-[10px] font-bold uppercase tracking-widest py-3 px-0 divide-x divide-white/20">
                  <div className="col-span-4 px-4">SERVICIO</div>
                  <div className="col-span-3 px-4">ENCARGADO / TÉCNICO</div>
                  <div className="col-span-3 px-4">PRODUCTOS</div>
                  <div className="col-span-2 text-right px-4">TOTAL VALOR</div>
                </div>

                <div className="divide-y divide-black bg-white">
                  {serviceFields.map((field, index) => (
                    <div key={field.id} className={cn("grid grid-cols-1 lg:grid-cols-12 min-h-[48px] lg:items-center px-0 hover:bg-slate-50 transition-colors group border-b border-rose-200 lg:divide-x lg:divide-black", index % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                      <div className="col-span-1 lg:col-span-4 px-4 py-2 lg:py-1 border-b lg:border-b-0 border-rose-200 flex items-center justify-between lg:block">
                        <span className="lg:hidden text-[9px] font-black text-black uppercase italic">SERVICIO:</span>
                        <FormField
                          control={form.control}
                          name={`services.${index}.SV_IDSERVICIO_FK`}
                          render={({ field }) => (
                            <ComboboxSearch
                              options={serviceOptions}
                              value={field.value}
                              disabled={isPaid}
                              onValueChange={(val) => {
                                field.onChange(val)
                                const selectedService = services.find(s => s.SV_IDSERVICIO_PK === val)
                                if (selectedService) {
                                  form.setValue(`services.${index}.FD_VALOR`, selectedService.SV_VALOR || 0)
                                }
                              }}
                              placeholder="ELIJA SERVICIO..."
                              className="h-8 lg:h-9 border-none bg-transparent font-bold uppercase focus-visible:ring-0 p-0 text-[12px] lg:text-[13px] shadow-none placeholder:text-black/50 disabled:opacity-50 text-right lg:text-left flex-1 lg:flex-none"
                            />
                          )}
                        />
                      </div>
                      <div className="col-span-1 lg:col-span-3 px-4 py-2 lg:py-1 border-b lg:border-b-0 border-rose-200 flex items-center justify-between lg:block">
                        <span className="lg:hidden text-[9px] font-black text-black uppercase italic">ENCARGADO:</span>
                        <FormField
                          control={form.control}
                          name={`services.${index}.TR_IDTECNICO_FK`}
                          render={({ field }) => (
                            <ComboboxSearch
                              options={technicianOptions}
                              value={field.value}
                              disabled={isPaid}
                              onValueChange={(val) => field.onChange(val)}
                              placeholder="ENCARGADO..."
                              className="h-8 lg:h-9 border-none bg-transparent font-semibold uppercase focus-visible:ring-0 p-0 text-[11px] shadow-none italic placeholder:text-black/50 text-right lg:text-left flex-1 lg:flex-none"
                            />
                          )}
                        />
                      </div>

                      <div className="col-span-1 lg:col-span-3 px-4 py-2 lg:py-1 border-b lg:border-b-0 border-rose-200 flex items-center justify-between lg:block">
                        <span className="lg:hidden text-[9px] font-black text-black uppercase italic">PRODUCTOS:</span>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          <span className="text-[10px] font-black text-black/60 uppercase italic whitespace-nowrap">
                            {(watchedServices[index]?.products || []).length > 0
                              ? watchedServices[index].products.map((p: any) => {
                                const productName = products.find(cp => cp.PR_IDPRODUCTO_PK === p.PR_IDPRODUCTO_FK)?.PR_NOMBRE || 'PRODUCTO'
                                const val = Number(p.FP_VALOR || 0).toLocaleString('es-CO')
                                return `${productName} ($${val})`
                              }).join(', ')
                              : 'SIN PRODUCTOS'}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-1 lg:col-span-2 text-right px-4 py-2 lg:py-1 flex items-center justify-between lg:justify-end gap-2 bg-slate-50/50 lg:bg-transparent">
                        <span className="lg:hidden text-[9px] font-black text-black uppercase italic">VALOR:</span>
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`services.${index}.FD_VALOR`}
                            render={({ field }) => (
                              <NumericFormat
                                value={field.value}
                                disabled={isPaid}
                                onValueChange={(values) => {
                                  // Solo llamamos onChange si el valor realmente cambió para evitar re-renders infinitos
                                  const newVal = values.floatValue ?? 0;
                                  if (newVal !== field.value) {
                                    field.onChange(newVal);
                                  }
                                }}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="$ "
                                allowNegative={false}
                                className="w-24 sm:w-28 h-7 lg:h-8 bg-white border border-rose-200 rounded-none text-right font-bold focus:outline-none text-xs lg:text-sm text-black px-2 shadow-sm disabled:bg-slate-50 disabled:text-black/30"
                              />
                            )}
                          />
                          {!isPaid && (
                            <button type="button" onClick={() => removeService(index)} className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1.5 text-red-600 hover:text-red-800 cursor-pointer">
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[48px] items-center px-4 bg-slate-900 border-t border-rose-200 py-3 lg:py-0">
                    <div className="col-span-1 lg:col-span-10 text-left lg:text-right lg:pr-6">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 italic">SUBTOTAL DE VENTA</span>
                    </div>
                    <div className="col-span-1 lg:col-span-2 text-right lg:px-4 lg:border-l lg:border-white/10 mt-1 lg:mt-0">
                      <span className="text-xl sm:text-lg font-black text-white leading-none tracking-tighter">
                        $ {total.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 border border-rose-200 rounded-none divide-x divide-black bg-slate-50/30">
              <div className="lg:col-span-7 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-1 bg-[#ff86a2] text-white text-[10px] font-bold uppercase tracking-widest rounded-none italic">MÉTODOS DE PAGO</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-black">
                  {paymentMethods
                    .filter(method => {
                      const isValeMethod = method.MP_NOMBRE?.toUpperCase() === 'VALE'
                      if (clientType === 'CLIENTE' && isValeMethod) return false
                      if (clientType === 'TECNICO' && isValeMethod) return true
                      return true
                    })
                    .map(method => {
                      const isSelected = !!watchedPayments.find(p => p.MP_IDMETODO_FK === method.MP_IDMETODO_PK)
                      return (
                        <div
                          key={method.MP_IDMETODO_PK}
                          onClick={() => !isPaid && handlePaymentToggle(method, !isSelected)}
                          className={cn(
                            "group flex items-center gap-3 p-3 border transition-all rounded-none",
                            isPaid ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                            isSelected ? "border-rose-200 bg-white text-black shadow-sm" : "border-slate-300 bg-white/50 text-black hover:border-rose-200 hover:bg-white"
                          )}
                        >
                          <div className={cn("w-5 h-5 border border-rose-200 flex items-center justify-center transition-all bg-white rounded-none")}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-black" />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight text-black">{method.MP_NOMBRE}</span>
                        </div>
                      )
                    })}
                </div>

                {watchedPayments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-[10px] font-bold text-black uppercase tracking-widest italic">DISTRIBUCIÓN DE PAGO</p>
                    {watchedPayments.map((payment, idx) => {
                      const method = paymentMethods.find(m => m.MP_IDMETODO_PK === payment.MP_IDMETODO_FK)
                      return (
                        <div key={`${payment.MP_IDMETODO_FK}-${idx}`} className="flex flex-col gap-2 bg-white border border-rose-200 rounded-none p-3 shadow-sm">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                            <span className="text-[11px] font-bold uppercase text-black">{method?.MP_NOMBRE}</span>
                            <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-rose-200 px-3 min-h-[40px] sm:min-h-0">
                              <FormField
                                control={form.control}
                                name={`payments.${idx}.PF_VALOR`}
                                render={({ field }) => (
                                  <NumericFormat
                                    value={field.value}
                                    disabled={isPaid}
                                    onValueChange={(values) => {
                                      const newVal = values.floatValue ?? 0;
                                      if (newVal !== field.value) {
                                        field.onChange(newVal);
                                      }
                                    }}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="$ "
                                    allowNegative={false}
                                    className="w-full sm:w-32 bg-white border border-rose-200 rounded-none px-2 focus:outline-none font-bold text-right text-black text-base shadow-sm h-9 disabled:bg-slate-50 disabled:text-black/50"
                                  />
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-rose-200">
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => { fileInputRefs.current[`${idx}`] = el }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(idx, file)
                                }}
                              />
                              <button
                                type="button"
                                disabled={uploadingIndexes.includes(idx) || isPaid}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  fileInputRefs.current[`${idx}`]?.click()
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-none text-[10px] font-bold transition-all border shadow-sm cursor-pointer",
                                  uploadingIndexes.includes(idx) ? "bg-slate-50 border-rose-200 text-black cursor-not-allowed" :
                                    payment.PF_EVIDENCIA_URL
                                      ? "border-green-500 bg-green-50 text-green-700"
                                      : "border-rose-200 hover:border-rose-200 text-black bg-white"
                                )}
                              >
                                {uploadingIndexes.includes(idx) ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Camera className="size-3.5" />
                                )}
                                {uploadingIndexes.includes(idx) ? 'PROCESANDO...' : (payment.PF_EVIDENCIA_URL ? 'REGISTRO OK' : 'ADJUNTAR FOTO')}
                              </button>
                              {payment.PF_EVIDENCIA_URL && (
                                <HoverCard openDelay={1000}>
                                  <HoverCardTrigger asChild>
                                    <a href={payment.PF_EVIDENCIA_URL} target="_blank" rel="noreferrer" className="text-[10px] font-bold underline text-black hover:text-black cursor-pointer">
                                      VER PDF/IMG
                                    </a>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80 p-0 border-2 border-rose-200 rounded-none shadow-xl overflow-hidden" side="top">
                                    <div className="bg-slate-900 text-white text-[9px] font-bold p-1 px-2 uppercase italic">VISTA PREVIA</div>
                                    <img
                                      src={payment.PF_EVIDENCIA_URL}
                                      alt="Evidencia"
                                      className="w-full h-auto object-contain max-h-96"
                                    />
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between p-8 bg-white h-full min-h-[300px]">
                <div className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="FC_ESTADO"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-black italic">ESTADO DE FACTURA</label>
                        <Select
                          value={field.value}
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger className={cn(
                            "w-full h-10 rounded-none border-rose-200 font-black uppercase text-xs",
                            field.value === 'PAGADO' ? "bg-green-50 text-green-700 border-green-200" :
                              field.value === 'CANCELADO' ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-black"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-rose-200">
                            <SelectItem value="PENDIENTE" className="text-xs font-bold uppercase text-black">PENDIENTE</SelectItem>
                            <SelectItem value="PAGADO" className="text-xs font-bold uppercase text-green-700">PAGADO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />

                  {totalPaid < total ? (
                    <div className="pt-4 border-t border-rose-200">
                      <span className="text-[10px] font-bold uppercase text-black mb-1 italic">PENDIENTE POR DISTRIBUIR</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg sm:text-xl font-bold text-red-500">$</span>
                        <span className="text-3xl sm:text-4xl font-black text-red-600 tracking-tighter animate-pulse">
                          {(total - totalPaid).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ) : totalPaid > total ? (
                    <div className="pt-4 border-t border-rose-200">
                      <span className="text-[10px] font-bold uppercase text-amber-500 mb-1 italic">SOBREPAGO / EXCESO</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg sm:text-xl font-bold text-amber-500">$</span>
                        <span className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tighter">
                          {(totalPaid - total).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ) : total > 0 ? (
                    <div className="pt-4 border-t border-rose-200 flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-green-600 italic">BALANCE COMPLETADO</span>
                        <span className="text-xs font-black text-black">TOTAL RECIBIDO: $ {totalPaid.toLocaleString('es-CO')}</span>
                      </div>
                      <Check className="size-5 text-green-500 ml-auto" />
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2 justify-end items-center mt-auto">
                  {Math.abs(totalPaid - total) < 0.01 && total > 0 ? (
                    <div className="flex gap-2 items-center text-green-600 transition-all scale-110">
                      <Check className="size-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">LISTA PARA PROCESAR</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center text-red-500 transition-all opacity-100">
                      <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{totalPaid > total ? 'EXCESO DE DINERO' : 'PAGO INCOMPLETO'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 pt-4 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12 rounded-none border-2 border-rose-200 font-bold text-sm hover:bg-slate-50 uppercase tracking-tighter text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-0 active:translate-x-[1px] active:translate-y-[1px]"
              >
                {isViewOnly ? 'CERRAR VISTA' : 'DESCARTAR'}
              </Button>
              {!isPaid && (
                <Button
                  type="submit"
                  disabled={isLoading || uploadingPhysical || uploadingIndexes.length > 0 || Math.abs(totalPaid - total) > 0.01 || total <= 0}
                  className={cn(
                    "flex-[2] h-12 rounded-none font-black text-lg uppercase tracking-tighter transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-0 active:translate-x-[2px] active:translate-y-[2px]",
                    !isLoading && !uploadingPhysical && uploadingIndexes.length === 0 && Math.abs(totalPaid - total) <= 0.01 && total > 0
                      ? "bg-[#f97316] hover:bg-[#ea580c] text-white border-2 border-[#f97316] shadow-[4px_4px_0px_0px_rgba(234,88,12,0.2)]"
                      : "bg-slate-100 text-black/20 cursor-not-allowed border-2 border-kyroy-border shadow-sm"
                  )}
                >
                  {isLoading
                    ? 'GUARDANDO...'
                    : (uploadingPhysical || uploadingIndexes.length > 0)
                      ? 'SUBIENDO IMAGEN...'
                      : 'PROCESAR FACTURA'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
