'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    TrendingUp,
    Users,
    Wallet,
    CreditCard,
    History,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MapPin,
    BarChart3,
    LayoutList,
    Plus,
    Zap,
    ChevronDown,
    Search,
    Eye,
    Pencil,
    Trash2,
    Check,
    Loader2,
    Package2,
    ShoppingBag,
    Landmark,
    HandCoins,
    Ticket,
    UserPlus,
    DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableFilter } from '@/components/ui/table-filter'
import { ComboboxSearch } from '@/components/ui/combobox-search'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    getDashboardStats,
    getDashboardCharts,
    getPayrollPeriods,
    getCurrentUserSession,
    getDashboardSpecificData
} from '@/features/dashboard/services'
import { getSedes } from '@/features/trabajadores/services'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts'
import { LoadingGate } from '@/components/ui/loading-gate'
import { toast } from '@/lib/toast-helper'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { BillingModal } from '@/app/dashboard/ventas/billing-modal'
import { getPaymentMethods, getTechnicians, getInvoiceById, deleteInvoice, verifyAdminPassword, addProductToInvoice, updateProductInInvoice, deleteProductFromInvoice } from '@/features/billing/services'
import { getServices, getProducts } from '@/features/catalog/services'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { NumericFormat } from 'react-number-format'

const COLORS = ['#FF7E5F', '#FEB47B', '#FFD200', '#F7971E', '#FFDF00'];

export function DashboardClient() {
    const [mounted, setMounted] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)
    const [sedes, setSedes] = React.useState<any[]>([])
    const [selectedSede, setSelectedSede] = React.useState<number>(-1) // -1 for GLOBAL
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date())
    const [viewMode, setViewMode] = React.useState<'GENERAL' | 'ESPECIFICO'>('GENERAL')
    const [periods, setPeriods] = React.useState<any[]>([])
    const [periodPopoverOpen, setPeriodPopoverOpen] = React.useState(false)
    const [selectedPeriod, setSelectedPeriod] = React.useState<string>('')
    const [filterType, setFilterType] = React.useState<'DIA' | 'PERIODO'>('DIA')

    // Custom Table States
    const [searchTerm, setSearchTerm] = React.useState('')
    const [activeFilters, setActiveFilters] = React.useState<{ [key: string]: string[] }>({})
    const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null)
    const [isViewOnly, setIsViewOnly] = React.useState(false)
    const [isAdminDeleteAuthOpen, setIsAdminDeleteAuthOpen] = React.useState(false)
    const [invoiceToDelete, setInvoiceToDelete] = React.useState<any>(null)
    const [adminPassword, setAdminPassword] = React.useState('')
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isFetchingInfo, setIsFetchingInfo] = React.useState(false)

    const [stats, setStats] = React.useState<any>(null)
    const [chartsData, setChartsData] = React.useState<any>(null)
    const [specificData, setSpecificData] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    // Billing Modal Data
    const [isBillingModalOpen, setIsBillingModalOpen] = React.useState(false)
    const [catalogData, setCatalogData] = React.useState<any>({
        technicians: [],
        services: [],
        products: [],
        paymentMethods: []
    })

    // Estados para Agregar Producto a Factura (AP)
    const [isAddProductModalOpen, setIsAddProductModalOpen] = React.useState(false)
    const [apSelectedInvoiceId, setApSelectedInvoiceId] = React.useState<string>('')
    const [apInvoiceDetails, setApInvoiceDetails] = React.useState<any>(null)
    const [apSelectedProductId, setApSelectedProductId] = React.useState<string>('')
    const [apSelectedServiceId, setApSelectedServiceId] = React.useState<string>('')
    const [apTechnicianId, setApTechnicianId] = React.useState<string>('')
    const [apValue, setApValue] = React.useState<number>(0)
    const [apLoadingInvoice, setApLoadingInvoice] = React.useState(false)
    const [apIsSubmitting, setApIsSubmitting] = React.useState(false)
    const [apIsEdit, setApIsEdit] = React.useState(false)
    const [apProductInvoiceId, setApProductInvoiceId] = React.useState<number | null>(null)

    React.useEffect(() => {
        setMounted(true)
        const init = async () => {
            const [userRes, sedesRes, periodsRes] = await Promise.all([
                getCurrentUserSession(),
                getSedes(),
                getPayrollPeriods()
            ])

            if (userRes.success) {
                setUser(userRes.data)
                // If cajero and has sucursal, set it
                if (userRes.data.role === 'CAJERO' && userRes.data.sucursalId) {
                    setSelectedSede(userRes.data.sucursalId)
                }
            }
            if (sedesRes.success) setSedes(sedesRes.data)
            if (periodsRes.success) {
                setPeriods(periodsRes.data)
                if (periodsRes.data.length > 0 && !selectedPeriod) {
                    setSelectedPeriod(periodsRes.data[0].NM_IDNOMINA_PK.toString())
                }
            }

            // Fetch catalog for billing modal
            const [techs, servs, prods, payments] = await Promise.all([
                getTechnicians(),
                getServices(),
                getProducts(),
                getPaymentMethods()
            ])
            setCatalogData({
                technicians: techs.success ? techs.data : [],
                services: servs.success ? servs.data : [],
                products: prods.success ? prods.data : [],
                paymentMethods: payments.success ? payments.data : []
            })
        }
        init()
    }, [])

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            let from = format(currentDate, 'yyyy-MM-dd')
            let to = format(currentDate, 'yyyy-MM-dd')

            if (filterType === 'PERIODO') {
                if (selectedPeriod === '7dias') {
                    from = format(subDays(new Date(), 7), 'yyyy-MM-dd')
                    to = format(new Date(), 'yyyy-MM-dd')
                } else {
                    const period = periods.find(p => p.NM_IDNOMINA_PK.toString() === selectedPeriod)
                    if (period) {
                        from = format(new Date(period.NM_FECHA_INICIO), 'yyyy-MM-dd')
                        to = format(new Date(period.NM_FECHA_FIN), 'yyyy-MM-dd')
                    }
                }
            }

            const [statsRes, chartsRes] = await Promise.all([
                getDashboardStats(selectedSede, from, to),
                getDashboardCharts(selectedSede, from, to)
            ])

            if (statsRes.success) setStats(statsRes.data)
            if (chartsRes.success) setChartsData(chartsRes.data)

            if (viewMode === 'ESPECIFICO') {
                const specificRes = await getDashboardSpecificData(selectedSede, from, to)
                if (specificRes.success) setSpecificData(specificRes.data)
            }
        } catch (error) {
            toast.error("Error al cargar datos")
        } finally {
            setIsLoading(false)
        }
    }, [selectedSede, currentDate, selectedPeriod, viewMode, periods])

    React.useEffect(() => {
        if (mounted) fetchData()
    }, [fetchData, mounted])

    if (!mounted) return null

    const navigateDay = (dir: 'prev' | 'next') => {
        setCurrentDate(prev => dir === 'prev' ? subDays(prev, 1) : addDays(prev, 1))
    }

    const handleProductChange = (productId: string) => {
        setApSelectedProductId(productId)
        const product = catalogData.products.find((p: any) => p.PR_IDPRODUCTO_PK.toString() === productId)
        if (product && product.PR_PRECIO) {
            setApValue(Number(product.PR_PRECIO))
        }
    }

    const fetchInvoiceForAssociation = async (invoiceId: string) => {
        setApSelectedInvoiceId(invoiceId)
        if (!invoiceId) return

        setApLoadingInvoice(true)
        try {
            const res = await getInvoiceById(Number(invoiceId))
            if (res.success) {
                setApInvoiceDetails(res.data)
                // Default values if possible
                if (res.data.services?.length > 0) {
                    setApSelectedServiceId(res.data.services[0].FD_IDDETALLE_PK.toString())
                }
            }
        } catch (err) {
            toast.error("Error al cargar servicios de la factura")
        } finally {
            setApLoadingInvoice(false)
        }
    }

    const handleAddProduct = async () => {
        if (!apSelectedInvoiceId || !apSelectedProductId || !apTechnicianId || apValue <= 0) {
            toast.error("Datos incompletos", "Por favor llene todos los campos obligatorios.")
            return
        }

        setApIsSubmitting(true)
        try {
            const res = apIsEdit && apProductInvoiceId
                ? await updateProductInInvoice(
                    apProductInvoiceId,
                    Number(apSelectedProductId),
                    Number(apTechnicianId),
                    apValue,
                    apSelectedServiceId ? Number(apSelectedServiceId) : undefined
                )
                : await addProductToInvoice(
                    Number(apSelectedInvoiceId),
                    Number(apSelectedProductId),
                    Number(apTechnicianId),
                    apValue,
                    apSelectedServiceId ? Number(apSelectedServiceId) : undefined
                )

            if (res.success) {
                toast.success(apIsEdit ? "Producto actualizado" : "Producto agregado", "Se ha procesado la asociación correctamente.")
                setIsAddProductModalOpen(false)
                fetchData()
            } else {
                toast.error("Ups", res.error || "No se pudo procesar la solicitud.")
            }
        } catch (err) {
            toast.error("Error de sistema")
        } finally {
            setApIsSubmitting(false)
        }
    }

    const handleOpenAddProduct = (invoice: any) => {
        setApIsEdit(false)
        setApProductInvoiceId(null)
        setApSelectedInvoiceId(invoice.FC_IDFACTURA_PK.toString())
        fetchInvoiceForAssociation(invoice.FC_IDFACTURA_PK.toString())
        setApSelectedProductId('')
        setApSelectedServiceId('')
        setApTechnicianId('')
        setApValue(0)
        setIsAddProductModalOpen(true)
    }

    const handleEditProductAction = (productRow: any) => {
        setApIsEdit(true)
        setApProductInvoiceId(productRow.FP_IDFACTURA_PRODUCTO_PK)
        setApSelectedInvoiceId(productRow.FC_IDFACTURA_FK.toString())
        fetchInvoiceForAssociation(productRow.FC_IDFACTURA_FK.toString())
        setApSelectedProductId(productRow.PR_IDPRODUCTO_FK.toString())
        setApSelectedServiceId(productRow.FD_IDDETALLE_FK ? productRow.FD_IDDETALLE_FK.toString() : '')
        setApTechnicianId(productRow.TR_IDTECNICO_FK.toString())
        setApValue(Number(productRow.FP_VALOR))
        setIsAddProductModalOpen(true)
    }

    const handleDeleteProductAction = async (productRow: any) => {
        if (!confirm("¿Desea eliminar este producto de la factura? El total se ajustará automáticamente.")) return

        try {
            const res = await deleteProductFromInvoice(productRow.FP_IDFACTURA_PRODUCTO_PK)
            if (res.success) {
                toast.success("Producto eliminado")
                fetchData()
            } else {
                toast.error(res.error || "Error al eliminar")
            }
        } catch (e) {
            toast.error("Error de sistema")
        }
    }

    const handleOpenInvoice = async (invoice: any, isView: boolean = false) => {
        setIsFetchingInfo(true)
        try {
            const res = await getInvoiceById(invoice.FC_IDFACTURA_PK)
            if (res.success) {
                setSelectedInvoice(res.data)
                setIsViewOnly(isView)
                setIsBillingModalOpen(true)
            } else {
                toast.error(res.error || 'Error al obtener detalles de la factura')
            }
        } catch (error) {
            toast.error('Error de red')
        } finally {
            setIsFetchingInfo(false)
        }
    }

    const confirmDeleteInvoice = async () => {
        if (!adminPassword) {
            toast.error('Ingrese la contraseña de administrador')
            return
        }

        setIsDeleting(true)
        try {
            const authRes = await verifyAdminPassword(adminPassword)
            if (!authRes.success) {
                toast.error(authRes.error || 'Contraseña incorrecta')
                return
            }

            const res = await deleteInvoice(invoiceToDelete.FC_IDFACTURA_PK)
            if (res.success) {
                toast.success('Factura eliminada correctamente')
                setIsAdminDeleteAuthOpen(false)
                setAdminPassword('')
                setInvoiceToDelete(null)
                fetchData() // Refresh data list
            } else {
                toast.error(res.error || 'Error al eliminar factura')
            }
        } catch (error) {
            toast.error('Error de sistema al eliminar')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleNewInvoice = () => {
        setSelectedInvoice(null)
        setIsViewOnly(false)
        setIsBillingModalOpen(true)
    }

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
            {/* Header / Welcome */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    {/* H1 adaptado a móvil */}
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]">{user?.username || 'Admin'}</span>! 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Resumen de {filterType === 'DIA' ? `el día ${format(currentDate, 'd MMM', { locale: es })}` : 'el periodo seleccionado'} en <span className="text-[#FF7E5F] font-bold">Kyroy Stilos</span>.
                    </p>
                </div>

                {/* Branch Selector */}
                <div className="flex items-center gap-2 p-1 bg-rose-50/50 dark:bg-slate-900 border-2 border-rose-100 shadow-sm rounded-none self-start w-full sm:w-auto">
                    <div className="px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase text-rose-400 italic">
                        <MapPin className="size-3 text-[#ff86a2]" />
                        Sucursal:
                    </div>
                    <select
                        className="bg-transparent font-black text-xs uppercase pr-8 outline-none cursor-pointer text-slate-700"
                        value={selectedSede}
                        onChange={(e) => setSelectedSede(Number(e.target.value))}
                        disabled={user?.role === 'CAJERO' && user?.sucursalId}
                    >
                        <option value="-1">GENERAL (TODAS)</option>
                        {sedes.map(s => (
                            <option key={s.SC_IDSUCURSAL_PK} value={s.SC_IDSUCURSAL_PK}>{s.SC_NOMBRE}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col gap-3 xl:flex-row xl:gap-4 xl:items-center justify-between bg-white dark:bg-slate-900 p-3 md:p-4 border-2 border-rose-100 shadow-sm rounded-none">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    {/* Selector de Tipo de Filtro */}
                    <div className="flex items-center bg-rose-50/50 dark:bg-slate-800 p-1 border-2 border-rose-100">
                        <button
                            onClick={() => setFilterType('DIA')}
                            className={cn(
                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all italic",
                                filterType === 'DIA' ? "bg-[#f97316] text-white" : "text-rose-300 hover:text-[#f97316]"
                            )}
                        >
                            POR DÍA
                        </button>
                        {periods.length > 0 && (
                            <button
                                onClick={() => setFilterType('PERIODO')}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all italic",
                                    filterType === 'PERIODO' ? "bg-[#f97316] text-white" : "text-rose-300 hover:text-[#f97316]"
                                )}
                            >
                                POR PERIODO
                            </button>
                        )}
                    </div>

                    <div className="h-8 w-px bg-rose-100 hidden md:block" />

                    {/* Mostramos el filtro correspondiente */}
                    {filterType === 'DIA' ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border-2 border-rose-100 shadow-sm">
                            <Button variant="ghost" size="icon" onClick={() => navigateDay('prev')} className="h-8 w-8 rounded-none hover:bg-rose-50 text-rose-300">
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-8 px-4 rounded-none font-black text-[10px] uppercase tracking-tighter flex gap-2 border-x border-rose-50 text-slate-700">
                                        <CalendarIcon className="size-3.5 text-[#ff86a2]" />
                                        {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-2 border-rose-200 shadow-xl" align="start">
                                    <Calendar mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" onClick={() => navigateDay('next')} className="h-8 w-8 rounded-none hover:bg-rose-50 text-rose-300">
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    ) : periods.length > 0 ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border-2 border-rose-100 shadow-sm w-[260px] max-w-full">
                            <div className="px-3 text-[10px] font-black text-rose-300 border-r border-rose-50 mr-2 shrink-0 uppercase">VER:</div>
                            <div className="flex-1 min-w-0">
                                <ComboboxSearch
                                    options={periods.map(p => ({
                                        label: `${format(new Date(p.NM_FECHA_INICIO), 'dd MMM', { locale: es }).toUpperCase()} - ${format(new Date(p.NM_FECHA_FIN), 'dd MMM', { locale: es }).toUpperCase()}`,
                                        value: p.NM_IDNOMINA_PK.toString()
                                    }))}
                                    value={selectedPeriod}
                                    onValueChange={(val) => val && setSelectedPeriod(val.toString())}
                                    placeholder="BUSCAR..."
                                    className="bg-transparent border-none shadow-none h-6 font-black text-[10px] w-full px-0 hover:bg-transparent justify-start text-slate-700"
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* View Switcher */}
                <div className="flex items-center bg-[#f97316] p-1 shadow-md">
                    <button
                        onClick={() => setViewMode('GENERAL')}
                        className={cn(
                            "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center gap-2",
                            viewMode === 'GENERAL' ? "bg-white text-[#f97316]" : "text-white hover:text-white/80"
                        )}
                    >
                        <BarChart3 className="size-3.5" /> GENERAL
                    </button>
                    <button
                        onClick={() => setViewMode('ESPECIFICO')}
                        className={cn(
                            "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center gap-2",
                            viewMode === 'ESPECIFICO' ? "bg-white text-[#f97316]" : "text-white hover:text-white/80"
                        )}
                    >
                        <LayoutList className="size-3.5" /> ESPECÍFICO
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'GENERAL' ? (
                <div className="space-y-8 font-black">
                    {/* Row 1: Core Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                        {[
                            {
                                title: `Ventas Hoy`,
                                value: `$${(stats?.ventas_total || 0).toLocaleString('es-CO')}`,
                                sub: 'Facturas Pagadas Hoy',
                                icon: TrendingUp,
                                color: 'from-[#FF7E5F] to-[#FEB47B]'
                            },
                            {
                                title: 'Recibido en Caja',
                                value: `$${(stats?.total_caja || 0).toLocaleString('es-CO')}`,
                                sub: 'Directo + Abonos de Deuda',
                                icon: Wallet,
                                color: 'from-emerald-600 to-teal-500'
                            },
                            {
                                title: 'Abonos de Deuda',
                                value: `$${(stats?.total_abonos || 0).toLocaleString('es-CO')}`,
                                sub: 'Pagos a deudas de clientes',
                                icon: History,
                                color: 'from-purple-600 to-indigo-500'
                            },
                            {
                                title: 'Por Cobrar',
                                value: `$${(stats?.por_cobrar_total || 0).toLocaleString('es-CO')}`,
                                sub: 'Ventas Pendientes Hoy',
                                icon: HandCoins,
                                color: 'from-red-500 to-rose-400'
                            },
                        ].map((stat, i) => (
                            <Card key={i} className="border-2 border-rose-100 rounded-none shadow-md overflow-hidden relative group bg-white dark:bg-slate-900">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.05] group-hover:opacity-[0.1] rounded-full -mr-12 -mt-12 transition-all duration-500 blur-xl group-hover:scale-150`} />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                                    <div className={cn("p-2 border-2 border-rose-100 shadow-sm bg-gradient-to-br", stat.color)}>
                                        <stat.icon className="size-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stat.value}</div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase italic leading-tight">{stat.sub}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Row 2: Payment Methods Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mt-4 md:mt-8">
                        {[
                            {
                                title: 'Efectivo',
                                value: `$${(stats?.metodos_pago?.['EFECTIVO'] || 0).toLocaleString('es-CO')}`,
                                sub: 'Suma de Ventas Pagadas',
                                icon: DollarSign,
                                color: 'from-green-600 to-emerald-500'
                            },
                            {
                                title: 'Transferencia',
                                value: `$${(stats?.metodos_pago?.['TRANSFERENCIA'] || 0).toLocaleString('es-CO')}`,
                                sub: 'Nequi / Daviplata / Bancos',
                                icon: Landmark,
                                color: 'from-blue-600 to-cyan-500'
                            },
                            {
                                title: 'Datáfono',
                                value: `$${(stats?.metodos_pago?.['DATAFONO'] || 0).toLocaleString('es-CO')}`,
                                sub: 'Tarjetas Débito / Crédito',
                                icon: CreditCard,
                                color: 'from-indigo-600 to-violet-500'
                            },
                            {
                                title: 'Crédito',
                                value: `$${(stats?.metodos_pago?.['CREDITO'] || 0).toLocaleString('es-CO')}`,
                                sub: 'Deuda generada hoy',
                                icon: History,
                                color: 'from-amber-600 to-orange-400'
                            },
                            {
                                title: 'Vale',
                                value: `$${(stats?.metodos_pago?.['VALE'] || 0).toLocaleString('es-CO')}`,
                                sub: 'Deducciones en Facturas',
                                icon: Ticket,
                                color: 'from-slate-600 to-slate-450'
                            },
                        ].map((stat, i) => (
                            <Card key={i} className="border-2 border-rose-100 rounded-none shadow-md overflow-hidden relative group bg-white dark:bg-slate-900">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.05] group-hover:opacity-[0.1] rounded-full -mr-12 -mt-12 transition-all duration-500 blur-xl group-hover:scale-150`} />
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                                    <div className={cn("p-2 border-2 border-rose-100 shadow-sm bg-gradient-to-br", stat.color)}>
                                        <stat.icon className="size-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stat.value}</div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase italic leading-tight">{stat.sub}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                        {/* Top Technicians Chart */}
                        <Card className="border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 p-6">
                            <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2 tracking-tighter text-slate-700">
                                <Zap className="size-4 text-[#FF7E5F]" /> Técnicos con mayor servicios
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartsData?.topTechs || []} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }}
                                            width={100}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: 0, padding: 8 }}
                                            itemStyle={{ color: '#fff', fontSize: 10, fontWeight: 900 }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#FF7E5F', fontSize: 10, fontWeight: 900 }}>
                                            {(chartsData?.topTechs || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Top Services Pie */}
                        <Card className="border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 p-6">
                            <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2 tracking-tighter text-slate-700">
                                <Users className="size-4 text-emerald-500" /> Top Servicios
                            </h3>
                            <div className="h-[300px] w-full flex items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartsData?.topServices || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="count"
                                        >
                                            {(chartsData?.topServices || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-1/3 space-y-2">
                                    {(chartsData?.topServices || []).map((s: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="size-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-[9px] font-black uppercase truncate">{s.name}</span>
                                            <span className="text-[9px] font-black ml-auto">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Top Products */}
                        <Card className="lg:col-span-2 border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 p-6">
                            <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2 tracking-tighter text-slate-700">
                                <Wallet className="size-4 text-blue-500" /> Productos Utilizados
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {(chartsData?.topProducts || []).map((p: any, i: number) => (
                                    <div key={i} className="border-2 border-rose-100 p-3 bg-rose-50/30 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-1 bg-[#ff86a2] text-white text-[8px] font-black">#{i + 1}</div>
                                        <p className="text-[10px] font-black uppercase mb-1 truncate pr-4">{p.name}</p>
                                        <p className="text-xl font-black text-[#FF7E5F]">{p.count}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Unidades</p>
                                    </div>
                                ))}
                                {(chartsData?.topProducts || []).length === 0 && (
                                    <p className="col-span-1 md:col-span-5 text-center text-slate-400 italic text-xs py-8 uppercase font-bold">Sin productos registrados en este periodo</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                    {/* Facturas Table */}
                    <Card className="border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 overflow-hidden p-0 py-0 gap-0">
                        <div className="bg-[#ff86a2] p-3 flex items-center justify-between border-b-2 border-rose-100">
                            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                <LayoutList className="size-4" /> VENTAS
                            </h3>
                            <Button
                                onClick={handleNewInvoice}
                                className="h-7 px-3 bg-[#f97316] text-white hover:bg-[#ea580c] rounded-none border-2 border-[#f97316] font-black text-[9px] uppercase italic gap-1 shadow-sm"
                            >
                                <Plus className="size-3" /> Agregar Factura
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-rose-50 dark:bg-slate-800 border-b-2 border-rose-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase w-[110px]">Factura</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase w-[80px]">Fecha</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Sucursal</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Cliente</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Teléfono</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Servicios</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-right w-[110px]">Total</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-center w-[100px]">Estado</TableHead>
                                        <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-right w-[60px]">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={`ventas-skeleton-${i}`} className="animate-in fade-in zoom-in-95 duration-500">
                                                <TableCell colSpan={10}>
                                                    <Skeleton className="h-8 w-full rounded-none" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <>
                                            {(specificData?.facturas || []).map((f: any) => (
                                                <TableRow key={f.FC_IDFACTURA_PK} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group animate-in fade-in duration-700">
                                                    <TableCell className="text-[11px] font-bold">{f.FC_NUMERO_FACTURA}</TableCell>
                                                    <TableCell className="text-[10px] font-medium text-slate-500">
                                                        {format(new Date(f.FC_FECHA), "dd/MM", { locale: es })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-[10px] font-black uppercase text-slate-500 italic bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                                                            {f.sucursal_nombre}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] font-black uppercase">{f.cliente_display || 'GENERAL'}</TableCell>
                                                    <TableCell className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{f.FC_CLIENTE_TELEFONO || '--'}</TableCell>
                                                    <TableCell className="text-[11px] italic text-slate-500 max-w-[250px] truncate">
                                                        {f.servicios || '--'}
                                                        {f.productos && (
                                                            <span className="text-rose-400"> + {f.productos}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] font-black text-right">
                                                        <span className={cn(
                                                            "text-sm font-black tracking-tight",
                                                            f.FC_ESTADO === 'CANCELADO' ? "text-slate-300 line-through" : "text-slate-900 dark:text-white"
                                                        )}>
                                                            $ {Number(f.FC_TOTAL).toLocaleString('es-CO')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border",
                                                            f.FC_ESTADO === 'PAGADO' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                                f.FC_ESTADO === 'PENDIENTE' ? "bg-orange-50 text-orange-600 border-orange-200" :
                                                                    "bg-red-50 text-red-600 border-red-200"
                                                        )}>
                                                            {f.FC_ESTADO}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1.5 transition-opacity">
                                                            <button
                                                                onClick={() => handleOpenInvoice(f, true)}
                                                                className="p-1.5 hover:bg-blue-50 text-blue-500 text-opacity-40 hover:text-opacity-100 rounded-lg transition-all"
                                                                title="Ver detalles"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </button>
                                                            {(f.FC_ESTADO === 'PENDIENTE' || user?.role === 'ADMINISTRADOR_TOTAL') && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleOpenInvoice(f, false)}
                                                                        className="p-1.5 hover:bg-amber-50 text-amber-500 text-opacity-40 hover:text-opacity-100 rounded-lg transition-all"
                                                                        title="Editar factura"
                                                                    >
                                                                        <Pencil className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setInvoiceToDelete(f)
                                                                            setIsAdminDeleteAuthOpen(true)
                                                                        }}
                                                                        className="p-1.5 hover:bg-red-50 text-red-500 text-opacity-40 hover:text-opacity-100 rounded-lg transition-all"
                                                                        title="Eliminar factura"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(specificData?.facturas || []).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center p-8 text-slate-400 font-bold uppercase text-[10px]">Sin movimientos registrados</TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                        {/* Créditos Table */}
                        <Card className="border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 overflow-hidden p-0 py-0 gap-0">
                            <div className="bg-[#ff86a2] p-3 border-b-2 border-rose-100">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <CreditCard className="size-4" /> CREDITOS
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-rose-50 dark:bg-slate-800 border-b-2 border-rose-100">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase w-[80px]">Fecha</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Factura</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Cliente</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-right">Pendiente</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={`creditos-skeleton-${i}`} className="animate-in fade-in zoom-in-95 duration-500">
                                                    <TableCell colSpan={4}>
                                                        <Skeleton className="h-8 w-full rounded-none" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <>
                                                {(specificData?.creditos || []).map((c: any) => (
                                                    <TableRow key={c.CR_IDCREDITO_PK} className="animate-in fade-in duration-700">
                                                        <TableCell className="text-[9px] font-bold text-slate-400">
                                                            {format(new Date(c.CR_FECHA), "dd/MM", { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="text-[10px] font-bold">{c.FC_NUMERO_FACTURA}</TableCell>
                                                        <TableCell className="text-[10px] font-black uppercase">{c.cliente_display}</TableCell>
                                                        <TableCell className="text-[11px] font-black text-right text-red-600">$ {Number(c.CR_VALOR_PENDIENTE).toLocaleString('es-CO')}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {(specificData?.creditos || []).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center p-4 text-slate-400 font-bold uppercase text-[10px]">Sin créditos</TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        {/* Vales Table */}
                        <Card className="border-2 border-rose-100 rounded-none shadow-md bg-white dark:bg-slate-900 overflow-hidden p-0 py-0 gap-0">
                            <div className="bg-[#ff86a2] p-3 border-b-2 border-rose-100">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <Wallet className="size-4" /> VALES
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-rose-50 dark:bg-slate-800 border-b-2 border-rose-100">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase w-[80px]">Fecha</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Trabajador</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Valor</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-center">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={`vales-skeleton-${i}`} className="animate-in fade-in zoom-in-95 duration-500">
                                                    <TableCell colSpan={4}>
                                                        <Skeleton className="h-8 w-full rounded-none" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <>
                                                {(specificData?.vales || []).map((v: any) => (
                                                    <TableRow key={v.VL_IDVALE_PK} className="animate-in fade-in duration-700">
                                                        <TableCell className="text-[9px] font-bold text-slate-400">
                                                            {format(new Date(v.VL_FECHA), "dd/MM", { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="text-[10px] font-black uppercase">{v.trabajador_nombre}</TableCell>
                                                        <TableCell className="text-[11px] font-black">$ {Number(v.VL_VALOR_TOTAL).toLocaleString('es-CO')}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase border bg-slate-50">
                                                                {v.VL_ESTADO}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(specificData?.vales || []).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center p-4 text-slate-400 font-bold uppercase text-[10px]">Sin vales</TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        {/* PRODUCTOS Table */}
                        <Card className="border-2 border-kyroy-border rounded-none shadow-md bg-white dark:bg-slate-900 overflow-hidden lg:col-span-2 p-0 py-0 gap-0">
                            <div className="bg-[#ff86a2] p-3 flex items-center justify-between border-b-2 border-kyroy-border">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <Package2 className="size-4" /> PRODUCTOS
                                </h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 bg-[#f97316] text-white hover:bg-[#ea580c] rounded-none border-2 border-[#f97316] font-black text-[9px] uppercase italic gap-1 shadow-sm"
                                    onClick={() => {
                                        setApSelectedInvoiceId('')
                                        setApInvoiceDetails(null)
                                        setApSelectedProductId('')
                                        setApSelectedServiceId('')
                                        setApValue(0)
                                        setIsAddProductModalOpen(true)
                                    }}
                                >
                                    <Plus className="size-3" /> Agregar Producto
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-rose-50 dark:bg-slate-800 border-b-2 border-kyroy-border">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Factura</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Fecha</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Producto</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-right">Valor</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Técnico</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase">Servicio Asociado</TableHead>
                                            <TableHead className="font-black text-[#ff86a2] text-[10px] uppercase text-right w-[60px]">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={`skeleton-${i}`} className="animate-in fade-in zoom-in-95 duration-500" >
                                                    <TableCell colSpan={7}>
                                                        <Skeleton className="h-8 w-full rounded-none" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <>
                                                {(specificData?.productos || []).map((p: any) => (
                                                    <TableRow key={p.FP_IDFACTURA_PRODUCTO_PK} className="hover:bg-slate-50 transition-colors animate-in fade-in duration-700">
                                                        <TableCell className="text-[10px] font-black uppercase tracking-tighter">#{p.FC_NUMERO_FACTURA}</TableCell>
                                                        <TableCell className="text-[10px] font-medium text-slate-500">
                                                            {format(new Date(p.FC_FECHA), 'dd MMM', { locale: es })}
                                                        </TableCell>
                                                        <TableCell className="text-[11px] font-black uppercase text-slate-900">{p.producto_nombre}</TableCell>
                                                        <TableCell className="text-[11px] font-black text-right text-slate-900 dark:text-white">
                                                            $ {Number(p.FP_VALOR).toLocaleString('es-CO')}
                                                        </TableCell>
                                                        <TableCell className="text-[10px] font-bold uppercase text-slate-600">{p.tecnico_nombre}</TableCell>
                                                        <TableCell className="text-[10px] font-black uppercase">
                                                            {p.servicio_nombre ? (
                                                                <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-200 italic text-slate-500">
                                                                    {p.servicio_nombre}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 italic">SIN ASOCIAR</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1 font-black">
                                                                <button
                                                                    onClick={() => handleOpenInvoice({ ...p, FC_IDFACTURA_PK: p.FC_IDFACTURA_FK }, true)}
                                                                    className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-all"
                                                                    title="Ver detalles"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </button>
                                                                {(p.FC_ESTADO === 'PENDIENTE' || user?.role === 'ADMINISTRADOR_TOTAL') && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleEditProductAction(p)}
                                                                            className="p-1.5 hover:bg-amber-50 text-amber-400 hover:text-amber-600 rounded-lg transition-all"
                                                                            title="Editar este producto"
                                                                        >
                                                                            <Pencil className="size-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteProductAction(p)}
                                                                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                                                                            title="Eliminar este producto"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(specificData?.productos || []).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center p-8 text-slate-400 font-bold uppercase text-[10px]">Sin productos registrados</TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </div >
            )
            }

            {/* El modal de asociación de productos ya está más abajo */}


            <BillingModal
                isOpen={isBillingModalOpen}
                onClose={() => {
                    setIsBillingModalOpen(false)
                    fetchData() // Refresh data after closing
                }}
                technicians={catalogData.technicians}
                services={catalogData.services}
                products={catalogData.products}
                paymentMethods={catalogData.paymentMethods}
                sucursales={sedes}
                sessionUser={user}
                invoice={selectedInvoice}
                isViewOnly={isViewOnly}
            />

            {/* Modal Autenticación Admin para Eliminar */}
            {
                isAdminDeleteAuthOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-rose-950/20 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-slate-800 p-6 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(255,134,162,0.2)]">
                            <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-red-600 flex items-center gap-2">
                                <Trash2 className="size-4" /> REQUERIDO ADMIN
                            </h3>
                            <p className="text-[10px] text-slate-500 mb-4 font-bold uppercase italic">Para eliminar definitivamente una factura debe autorizar como administrador.</p>
                            <Input
                                type="password"
                                placeholder="CONTRASEÑA ADMINISTRADOR"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="rounded-none border-rose-200 mb-4 font-black bg-white text-slate-900"
                                autoFocus
                                autoComplete="new-password"
                                onKeyDown={(e) => e.key === 'Enter' && confirmDeleteInvoice()}
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-none border-rose-200 uppercase font-bold text-xs text-slate-400 hover:text-slate-900 hover:bg-rose-50"
                                    onClick={() => {
                                        setIsAdminDeleteAuthOpen(false)
                                        setAdminPassword('')
                                        setInvoiceToDelete(null)
                                    }}
                                >
                                    CANCELAR
                                </Button>
                                <Button
                                    className="flex-1 rounded-none bg-red-600 text-white hover:bg-red-700 uppercase font-black text-xs gap-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]"
                                    onClick={confirmDeleteInvoice}
                                    disabled={isDeleting}
                                >
                                    {isDeleting && <Loader2 className="size-3 animate-spin" />}
                                    CONFIRMAR
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL PARA AGREGAR PRODUCTO A FACTURA EXISTENTE */}
            <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
                <DialogContent className="max-w-md border-2 border-rose-200 rounded-none shadow-[8px_8px_0px_0px_rgba(255,134,162,0.15)] p-0 bg-white">
                    <DialogHeader className="bg-gradient-to-r from-rose-400 to-rose-500 p-4 border-b-2 border-rose-300">
                        <DialogTitle className="text-white font-black uppercase text-sm italic tracking-tighter">{apIsEdit ? "EDITAR ASOCIACIÓN" : "AGREGAR PRODUCTO A FACTURA"}</DialogTitle>
                        <DialogDescription className="text-white/80 text-[10px] uppercase font-bold tracking-widest">{apIsEdit ? "Modifique los detalles de este producto." : "Asocie un producto con un servicio realizado en una factura."}</DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-rose-400 italic">1. SELECCIONAR FACTURA:</label>
                            <ComboboxSearch
                                options={(specificData?.facturas || []).map((f: any) => ({
                                    label: `#${f.FC_NUMERO_FACTURA} - ${f.cliente_display}`,
                                    value: f.FC_IDFACTURA_PK.toString()
                                }))}
                                value={apSelectedInvoiceId}
                                onValueChange={(val) => fetchInvoiceForAssociation(val.toString())}
                                placeholder="BUSQUE LA FACTURA..."
                                className="w-full h-10 border-2 border-rose-200 rounded-none font-black text-xs uppercase focus:border-orange-400"
                            />
                        </div>

                        {apLoadingInvoice && (
                            <div className="flex items-center justify-center py-4 gap-2 text-[10px] font-black text-rose-400 italic animate-pulse">
                                <Loader2 className="size-4 animate-spin" /> CARGANDO SERVICIOS DE LA FACTURA...
                            </div>
                        )}

                        {apInvoiceDetails && (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-rose-400 italic">2. PRODUCTO A CONSUMIR:</label>
                                    <ComboboxSearch
                                        options={catalogData.products.map((p: any) => ({
                                            label: p.PR_NOMBRE,
                                            value: p.PR_IDPRODUCTO_PK.toString()
                                        }))}
                                        value={apSelectedProductId}
                                        onValueChange={(val) => handleProductChange(val.toString())}
                                        placeholder="BUSCAR PRODUCTO..."
                                        className="w-full h-10 border-2 border-rose-200 rounded-none font-black text-xs uppercase focus:border-orange-400 shadow-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-rose-400 italic">3. SERVICIO DONDE SE USÓ:</label>
                                    <ComboboxSearch
                                        options={(apInvoiceDetails?.services || []).map((s: any) => ({
                                            label: `${catalogData.services.find((cs: any) => cs.SV_IDSERVICIO_PK === s.SV_IDSERVICIO_FK)?.SV_NOMBRE || 'Servicio'} - $${Number(s.FD_VALOR).toLocaleString()}`,
                                            value: s.FD_IDDETALLE_PK.toString()
                                        }))}
                                        value={apSelectedServiceId}
                                        onValueChange={(val) => setApSelectedServiceId(val.toString())}
                                        placeholder="SELECCIONAR SERVICIO..."
                                        className="w-full h-10 border-2 border-rose-200 rounded-none font-black text-xs uppercase bg-rose-50/10 focus:border-orange-400"
                                        emptyText={(!apInvoiceDetails.services || apInvoiceDetails.services.length === 0) ? "NO HAY SERVICIOS EN ESTA FACTURA" : "NO SE ENCONTRÓ"}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-rose-400 italic">VALOR:</label>
                                        <NumericFormat
                                            value={apValue}
                                            onValueChange={(vals) => setApValue(vals.floatValue || 0)}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            prefix="$ "
                                            className="w-full h-10 border-2 border-rose-200 rounded-none px-3 font-black text-sm outline-none focus:bg-rose-50/50 focus:border-orange-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-rose-400 italic">TÉCNICO:</label>
                                        <ComboboxSearch
                                            options={catalogData.technicians.map((t: any) => ({
                                                label: t.TR_NOMBRE,
                                                value: t.TR_IDTRABAJADOR_PK.toString()
                                            }))}
                                            value={apTechnicianId}
                                            onValueChange={(val) => setApTechnicianId(val.toString())}
                                            placeholder="TÉCNICO..."
                                            className="w-full h-10 border-2 border-rose-200 rounded-none font-black text-xs uppercase focus:border-orange-400 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-rose-50/30 border-t-2 border-rose-100">
                        <Button
                            className="w-full h-12 rounded-none bg-orange-500 text-white font-black uppercase text-xs italic shadow-[4px_4px_0px_0px_rgba(249,115,22,0.3)] active:shadow-none translate-x-0 active:translate-x-[2px] active:translate-y-[2px] hover:bg-orange-600 border-2 border-orange-600"
                            onClick={handleAddProduct}
                            disabled={apIsSubmitting || !apSelectedInvoiceId || !apSelectedProductId}
                        >
                            {apIsSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Package2 className="size-4 mr-2" />}
                            {apIsEdit ? "ACTUALIZAR PRODUCTO" : "ASOCIAR PRODUCTO A FACTURA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
