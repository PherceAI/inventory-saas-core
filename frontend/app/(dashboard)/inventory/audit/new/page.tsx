"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ClipboardCheck,
    Barcode,
    Trash2,
    Calendar as CalendarIcon,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Warehouse,
    Search,
    RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Services
import { ProductsService } from "@/services/products.service"
import { WarehousesService } from "@/services/warehouses.service" // Assuming this exists or using mock

// --- Types ---
interface AuditItem {
    id: string
    productId: string
    productName: string
    sku: string
    batch?: string
    systemStock: number
    countedStock: number
    variance: number
}

// Mock Items for demo (until backend connection is solid)
const MOCK_SNAPSHOT = [
    { id: "1", productId: "p1", name: "Vodka Grey Goose 750ml", sku: "VOD-GREY-750", batch: "L-2023-A", systemStock: 24 },
    { id: "2", productId: "p1", name: "Vodka Grey Goose 750ml", sku: "VOD-GREY-750", batch: "L-2024-B", systemStock: 12 },
    { id: "3", productId: "p2", name: "Ron Zacapa 23 Años", sku: "RUM-ZAC-23", batch: "BATCH-001", systemStock: 8 },
]

export default function NewAuditPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [warehouses, setWarehouses] = useState<any[]>([])

    // Header State
    const [auditName, setAuditName] = useState(`AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`)
    const [warehouseId, setWarehouseId] = useState("")
    const [isBlind, setIsBlind] = useState(false)

    // Staging / Scan State
    const [scanCode, setScanCode] = useState("")
    const [activeItem, setActiveItem] = useState<any>(null) // The item found in snapshot or DB
    const [countInput, setCountInput] = useState(0)

    // The Audit List (Active Snapshot)
    const [items, setItems] = useState<AuditItem[]>([])

    // Focus Refs
    const countRef = useRef<HTMLInputElement>(null)
    const scanRef = useRef<HTMLInputElement>(null)

    // --- Load Data ---
    useEffect(() => {
        const loadWarehouses = async () => {
            try {
                // Determine if we have the service, otherwise mock
                const data = await WarehousesService.getAll().catch(() => [
                    { id: "main", name: "Bodega Central A1" },
                    { id: "kitchen", name: "Depósito Cocina" },
                    { id: "bar", name: "Barra Principal" }
                ])
                setWarehouses(data || [])
            } catch (error) {
                console.error("Error loading warehouses", error)
            }
        }
        loadWarehouses()
    }, [])

    // --- Search & Scan Logic ---
    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (!scanCode.trim()) return

            // 1. Try to find in current list first (to update count)
            const existingInList = items.find(i => i.sku.toLowerCase() === scanCode.toLowerCase() || i.batch?.toLowerCase() === scanCode.toLowerCase())

            if (existingInList) {
                setActiveItem(existingInList)
                setCountInput(existingInList.countedStock) // Pre-fill with current count
                setScanCode("")
                setTimeout(() => countRef.current?.focus(), 50)
                return
            }

            // 2. If not in list, find in DB (Simulated)
            try {
                // Simulation of "Finding a product that wasn't expected" or "First scan"
                // in a real app, this searches the API
                const product = await ProductsService.findByTerm(scanCode).catch(() => null)

                if (product) {
                    // Create a new audit line for this found product
                    const newItem: AuditItem = {
                        id: crypto.randomUUID(),
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        batch: "N/A", // If scanned by SKU, batch is unknown or N/A
                        systemStock: product.stockLevel || 0,
                        countedStock: 0,
                        variance: 0 - (product.stockLevel || 0)
                    }
                    setActiveItem(newItem)
                    setCountInput(0)
                    setScanCode("")
                    setTimeout(() => countRef.current?.focus(), 50)
                } else {
                    toast({
                        variant: "destructive",
                        title: "No encontrado",
                        description: "No se encontró ningún producto con ese código."
                    })
                    setActiveItem(null)
                }
            } catch (err) {
                // Fallback to mock for demo if API fails
                const mock = MOCK_SNAPSHOT.find(m => m.sku.toLowerCase().includes(scanCode.toLowerCase()))
                if (mock) {
                    const newItem: AuditItem = {
                        id: crypto.randomUUID(),
                        productId: mock.productId,
                        productName: mock.name,
                        sku: mock.sku,
                        batch: mock.batch,
                        systemStock: mock.systemStock,
                        countedStock: 0,
                        variance: 0 - mock.systemStock
                    }
                    setActiveItem(newItem)
                    setCountInput(0)
                    setScanCode("")
                    setTimeout(() => countRef.current?.focus(), 50)
                } else {
                    toast({
                        variant: "destructive",
                        title: "No encontrado",
                        description: "No se encontró el producto."
                    })
                }
            }
        }
    }

    const clearStaging = () => {
        setScanCode("")
        setActiveItem(null)
        setCountInput(0)
        scanRef.current?.focus()
    }

    const updateOrAddItem = () => {
        if (!activeItem) return

        setItems(prev => {
            const exists = prev.find(i => i.id === activeItem.id || (i.sku === activeItem.sku && i.batch === activeItem.batch))

            if (exists) {
                // Update existing
                return prev.map(i => {
                    if (i.id === exists.id) {
                        return {
                            ...i,
                            countedStock: countInput,
                            variance: countInput - i.systemStock
                        }
                    }
                    return i
                })
            } else {
                // Add new (Surprise item found during audit)
                return [...prev, {
                    ...activeItem,
                    countedStock: countInput,
                    variance: countInput - activeItem.systemStock
                }]
            }
        })

        clearStaging()
    }

    const handleStagingKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            updateOrAddItem()
        }
    }

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    // --- Load Snapshot (Hybrid Mode) ---
    // If user wants to pre-load all system stock
    const loadSystemSnapshot = () => {
        if (!warehouseId) return
        // Mock loading
        const snapshot = MOCK_SNAPSHOT.map(m => ({
            id: crypto.randomUUID(),
            productId: m.productId,
            productName: m.name,
            sku: m.sku,
            batch: m.batch,
            systemStock: m.systemStock,
            countedStock: 0, // Default to 0 or systemStock? Typically 0 for forced count
            variance: 0 - m.systemStock
        }))
        setItems(snapshot)
        toast({ title: "Snapshot Cargado", description: "Se cargaron 3 lotes teóricos del sistema." })
    }

    // --- Submit Logic ---
    const handleConfirm = async () => {
        if (!warehouseId) {
            toast({ variant: "destructive", title: "Falta Bodega", description: "Seleccione una bodega." })
            return
        }

        setIsLoading(true)
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            toast({ title: "Auditoría Guardada", description: "El conteo ha sido registrado exitosamente." })
            router.push('/inventory')
        }, 1500)
    }

    // Metrics
    const totalCounted = items.reduce((acc, i) => acc + i.countedStock, 0)
    const accuracy = items.length > 0
        ? Math.round((items.filter(i => i.variance === 0).length / items.length) * 100)
        : 100

    return (
        <div className="flex h-full flex-col bg-slate-50/50 p-6 space-y-6 overflow-hidden">

            {/* 1. Header Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 shrink-0">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 -ml-2 rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-amber-50 p-2 rounded-lg">
                                <ClipboardCheck className="h-5 w-5 text-amber-600" />
                            </span>
                            Nueva Auditoría
                        </h1>
                        <p className="text-slate-500 text-sm ml-12">Verificación de stock físico vs sistema</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 ml-12">
                    {/* Reference Name */}
                    <div className="md:col-span-3 space-y-2">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Referencia</Label>
                        <div className="relative group">
                            <ClipboardCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <Input
                                className="pl-10 bg-slate-50 border-slate-200 h-10 font-mono text-slate-700 rounded-xl"
                                value={auditName}
                                onChange={(e) => setAuditName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Warehouse Selector */}
                    <div className="md:col-span-5 space-y-2">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bodega Objetivo</Label>
                        <Select value={warehouseId} onValueChange={setWarehouseId}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl">
                                <SelectValue placeholder="Seleccionar ubicación..." />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Blind Toggle & Load Actions */}
                    <div className="md:col-span-4 flex items-end gap-3 pb-1">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer flex-1" onClick={() => setIsBlind(!isBlind)}>
                            <Checkbox checked={isBlind} onCheckedChange={(c) => setIsBlind(!!c)} id="blind" className="data-[state=checked]:bg-amber-600 border-slate-300" />
                            <div className="space-y-0 leading-none">
                                <Label htmlFor="blind" className="font-semibold text-slate-700 cursor-pointer text-sm">Conteo Ciego</Label>
                                <p className="text-[10px] text-slate-400">Ocultar teórico</p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadSystemSnapshot}
                            disabled={!warehouseId || items.length > 0}
                            className="h-10 border-dashed border-slate-300 text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            Cargar Todo
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Content Card */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100">

                {/* Scan Strip */}
                <div className="p-5 border-b border-slate-50 flex flex-wrap md:flex-nowrap gap-4 items-end bg-white">
                    {/* Search */}
                    <div className="w-full md:flex-[3] space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escanear Producto o Lote</Label>
                        <div className="relative">
                            <Barcode className={`absolute left-3 top-3 h-4 w-4 ${activeItem ? 'text-amber-500' : 'text-slate-400'}`} />
                            <Input
                                ref={scanRef}
                                value={scanCode}
                                onChange={(e) => {
                                    setScanCode(e.target.value)
                                    if (e.target.value === "") setActiveItem(null)
                                }}
                                onKeyDown={handleScan}
                                className={cn(
                                    "pl-10 h-10 transition-all rounded-xl",
                                    activeItem
                                        ? "border-amber-500 ring-4 ring-amber-500/10 bg-amber-50/20 text-amber-900 font-semibold"
                                        : "bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                                )}
                                placeholder="Escanear código..."
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Active Item Display */}
                    <div className="w-full md:flex-[4] space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Seleccionado</Label>
                        <div className={cn(
                            "h-10 px-4 rounded-xl border flex items-center justify-between text-sm transition-colors",
                            activeItem ? "bg-amber-50/30 border-amber-200 text-slate-900 font-medium" : "bg-slate-50 border-slate-200 text-slate-400 italic"
                        )}>
                            <span>{activeItem ? activeItem.productName : "Esperando escaneo..."}</span>
                            {activeItem && <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-amber-100 text-amber-700">{activeItem.batch}</span>}
                        </div>
                    </div>

                    {/* Count Input */}
                    <div className="w-32 space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conteo Físico</Label>
                        <Input
                            ref={countRef}
                            type="number"
                            className="h-10 text-center font-bold text-slate-700 rounded-xl bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                            disabled={!activeItem}
                            value={countInput}
                            onChange={(e) => setCountInput(Number(e.target.value))}
                            onKeyDown={handleStagingKeyDown}
                        />
                    </div>

                    {/* Action */}
                    <div className="pt-0 pb-0.5 pl-2">
                        <Button
                            className={cn(
                                "h-10 px-6 rounded-xl transition-all shadow-sm active:scale-95 text-xs uppercase font-bold tracking-wide",
                                activeItem
                                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            )}
                            disabled={!activeItem}
                            onClick={updateOrAddItem}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider w-32">SKU</th>
                                <th className="px-6 py-4 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Producto / Lote</th>
                                <th className="px-6 py-4 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider w-24">Sistema</th>
                                <th className="px-6 py-4 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider w-24 bg-amber-50/50">Físico</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-400 text-[10px] uppercase tracking-wider w-24">Varianza</th>
                                <th className="px-4 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100">
                                                <ClipboardCheck className="h-10 w-10 opacity-20" />
                                            </div>
                                            <p className="font-medium text-slate-400">Auditoría vacía</p>
                                            <p className="text-xs mt-1 text-slate-400">Escanea items o carga un snapshot</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-amber-50/20 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.sku}</td>
                                    <td className="px-6 py-4 text-slate-700 font-medium">
                                        <div>{item.productName}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Lote: {item.batch}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-500">
                                        {isBlind ? "---" : item.systemStock}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800 bg-amber-50/30">
                                        {item.countedStock}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold",
                                            item.variance === 0 ? "bg-emerald-100 text-emerald-700" :
                                                item.variance < 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {item.variance > 0 ? "+" : ""}{item.variance}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Statistic Strip */}
                <div className="bg-white px-8 py-6 border-t border-slate-50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex gap-8">
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Items Contados</div>
                                <div className="text-2xl font-bold text-slate-800">{items.length}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Precisión</div>
                                <div className={cn("text-2xl font-bold", accuracy === 100 ? "text-emerald-600" : "text-amber-600")}>
                                    {accuracy}%
                                </div>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="bg-slate-900 hover:bg-black text-white font-bold px-8 h-12 shadow-lg shadow-slate-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                            disabled={items.length === 0 || isLoading}
                            onClick={handleConfirm}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Finalizar Auditoría"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
