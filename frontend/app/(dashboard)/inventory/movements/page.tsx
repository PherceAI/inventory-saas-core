"use client"

import { useEffect, useState } from "react"
import { InventoryService } from "@/services/inventory.service"
import {
    Search,
    Filter,
    Calendar,
    ArrowRight,
    ArrowLeft,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    ClipboardCheck,
    ShoppingCart
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface Movement {
    id: string
    type: 'IN' | 'OUT' | 'TRANSFER' | 'AUDIT' | 'SALE' | 'CONSUME'
    quantity: number
    stockAfter: number
    createdAt: string
    notes?: string
    referenceId?: string
    product: {
        id: string
        name: string
        sku: string
    }
    warehouseOrigin?: {
        name: string
    }
    warehouseDestination?: {
        name: string
    }
    performedBy: {
        firstName: string
        lastName: string
    }
}

interface Meta {
    page: number
    limit: number
    total: number
    totalPages: number
}

const TYPE_CONFIG: Record<string, { label: string, color: string, bg: string, icon: any }> = {
    IN: { label: 'Ingreso', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ArrowDownLeft },
    OUT: { label: 'Salida', color: 'text-rose-600', bg: 'bg-rose-50', icon: ArrowUpRight },
    TRANSFER: { label: 'Traslado', color: 'text-blue-600', bg: 'bg-blue-50', icon: ArrowLeftRight },
    AUDIT: { label: 'Auditoría', color: 'text-purple-600', bg: 'bg-purple-50', icon: ClipboardCheck },
    SALE: { label: 'Venta', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: ShoppingCart },
    CONSUME: { label: 'Consumo', color: 'text-amber-600', bg: 'bg-amber-50', icon: ArrowUpRight },
}

export default function MovementsPage() {
    const [movements, setMovements] = useState<Movement[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)

    // Filters
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [type, setType] = useState<string>('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const fetchMovements = async () => {
        setLoading(true)
        try {
            const params: any = {
                page,
                limit: 10,
                search: search || undefined,
                type: type || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            }
            const res = await InventoryService.getAllMovements(params)
            setMovements(res.data)
            setMeta(res.meta)
        } catch (error) {
            console.error("Failed to fetch movements", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchMovements()
        }, 300)
        return () => clearTimeout(debounce)
    }, [page, search, type, startDate, endDate])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPage(1)
    }

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setType(e.target.value)
        setPage(1)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Historial de Movimientos</h1>
                    <p className="text-slate-500">Registro completo de transacciones de inventario</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchMovements()}
                        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium shadow-sm transition-colors">
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por producto, referencia o notas..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={type}
                            onChange={handleTypeChange}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="IN">Ingresos</option>
                            <option value="OUT">Egresos</option>
                            <option value="TRANSFER">Traslados</option>
                            <option value="AUDIT">Auditorías</option>
                        </select>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="relative">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-3 pr-3 py-2 bg-slate-50 border-none rounded-lg text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Cantidad</th>
                                <th className="px-6 py-4">Bodega</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Referencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-32 bg-slate-100 rounded mb-1"></div>
                                            <div className="h-3 w-20 bg-slate-100 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                <Filter size={24} />
                                            </div>
                                            <p className="font-medium text-slate-600">No se encontraron movimientos</p>
                                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movements.map((move) => {
                                    const typeInfo = TYPE_CONFIG[move.type] || { label: move.type, color: 'text-slate-600', bg: 'bg-slate-100', icon: Filter }
                                    const Icon = typeInfo.icon

                                    return (
                                        <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {formatDate(move.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                    typeInfo.color,
                                                    typeInfo.bg
                                                )}>
                                                    <Icon size={12} />
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-[250px]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 truncate">{move.product.name}</span>
                                                    <span className="text-xs text-slate-500">SKU: {move.product.sku}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "font-mono font-medium",
                                                    move.type === 'IN' ? "text-emerald-600" :
                                                        move.type === 'OUT' ? "text-rose-600" : "text-slate-700"
                                                )}>
                                                    {move.type === 'IN' ? '+' : move.type === 'OUT' ? '-' : ''}
                                                    {parseFloat(move.quantity.toString())}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {move.type === 'TRANSFER' ? (
                                                    <div className="flex flex-col text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                                            {move.warehouseOrigin?.name}
                                                        </span>
                                                        <span className="flex items-center gap-1 mt-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                            {move.warehouseDestination?.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    move.warehouseDestination?.name || move.warehouseOrigin?.name
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {move.performedBy.firstName.charAt(0)}{move.performedBy.lastName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm truncate max-w-[100px]">
                                                        {move.performedBy.firstName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {move.referenceId ? (
                                                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                        {/* Simple logic to detect if it's a PO number or UUID */}
                                                        {move.referenceId.length > 20 && !move.referenceId.startsWith('PO')
                                                            ? '...' + move.referenceId.slice(-6)
                                                            : move.referenceId}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-sm text-slate-500">
                            Mostrando <span className="font-medium">{movements.length}</span> de <span className="font-medium">{meta.total}</span> resultados
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowLeft size={16} className="text-slate-600" />
                            </button>
                            <span className="text-sm font-medium text-slate-700">
                                Página {page} de {meta.totalPages}
                            </span>
                            <button
                                disabled={page === meta.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowRight size={16} className="text-slate-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
