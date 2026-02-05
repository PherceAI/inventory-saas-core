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
    ArrowLeft,
    Loader2,
    RotateCcw,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Services
import { WarehousesService, Warehouse } from "@/services/warehouses.service"
import { AuditsService, Audit, AuditItem } from "@/services/audits.service"

// --- Types ---
interface LocalAuditItem {
    id: string
    productId: string
    productName: string
    sku: string
    systemStock: number
    countedStock: number | null
    variance: number | null
    isUpdated: boolean
}

export default function NewAuditPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isCreatingAudit, setIsCreatingAudit] = useState(false)
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])

    // Header State
    const [auditName, setAuditName] = useState(`AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`)
    const [warehouseId, setWarehouseId] = useState("")
    const [isBlind, setIsBlind] = useState(false)

    // Audit State (from backend)
    const [currentAudit, setCurrentAudit] = useState<Audit | null>(null)

    // Staging / Scan State
    const [scanCode, setScanCode] = useState("")
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
    const [countInput, setCountInput] = useState<number>(0)

    // Local Items (mapped from audit)
    const [items, setItems] = useState<LocalAuditItem[]>([])

    // Focus Refs
    const countRef = useRef<HTMLInputElement>(null)
    const scanRef = useRef<HTMLInputElement>(null)

    // --- Load Warehouses ---
    useEffect(() => {
        const loadWarehouses = async () => {
            try {
                const data = await WarehousesService.getAll()
                setWarehouses(data || [])
            } catch (error) {
                console.error("Error loading warehouses", error)
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudieron cargar las bodegas."
                })
            }
        }
        loadWarehouses()
    }, [toast])

    // --- Create Audit & Load Snapshot ---
    const loadSystemSnapshot = async () => {
        if (!warehouseId) {
            toast({
                variant: "destructive",
                title: "Selecciona bodega",
                description: "Debes seleccionar una bodega primero."
            })
            return
        }

        setIsCreatingAudit(true)
        try {
            // 1. Create audit in backend (this snapshots real stock)
            const audit = await AuditsService.create({
                warehouseId,
                name: auditName
            })

            // 2. Load full audit with items
            const fullAudit = await AuditsService.getById(audit.id)
            setCurrentAudit(fullAudit)

            // 3. Map to local items
            const localItems: LocalAuditItem[] = (fullAudit.items || []).map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                sku: item.product.sku,
                systemStock: Number(item.systemStock) || 0,
                countedStock: item.countedStock !== null ? Number(item.countedStock) : null,
                variance: item.variance !== null ? Number(item.variance) : null,
                isUpdated: item.countedStock !== null
            }))

            setItems(localItems)

            toast({
                title: "Auditoría Creada",
                description: `Se cargaron ${localItems.length} productos del sistema.`
            })
        } catch (error: any) {
            console.error("Error creating audit", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error?.response?.data?.message || "No se pudo crear la auditoría."
            })
        } finally {
            setIsCreatingAudit(false)
        }
    }

    // --- Search & Scan Logic ---
    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (!scanCode.trim()) return

            // Find in current list by SKU (partial match)
            const foundIndex = items.findIndex(i =>
                i.sku.toLowerCase().includes(scanCode.toLowerCase()) ||
                i.productName.toLowerCase().includes(scanCode.toLowerCase())
            )

            if (foundIndex !== -1) {
                setActiveItemIndex(foundIndex)
                setCountInput(items[foundIndex].countedStock ?? 0)
                setScanCode("")
                setTimeout(() => {
                    countRef.current?.focus()
                    countRef.current?.select()
                }, 50)
            } else {
                toast({
                    variant: "destructive",
                    title: "No encontrado",
                    description: "Producto no está en esta auditoría. Carga el snapshot primero."
                })
            }
        }
    }

    const clearStaging = () => {
        setScanCode("")
        setActiveItemIndex(null)
        setCountInput(0)
        scanRef.current?.focus()
    }

    const updateItemCount = async () => {
        if (activeItemIndex === null || !currentAudit) return

        const item = items[activeItemIndex]
        const variance = countInput - item.systemStock

        // Update locally first (optimistic)
        setItems(prev => prev.map((i, idx) => {
            if (idx === activeItemIndex) {
                return {
                    ...i,
                    countedStock: countInput,
                    variance,
                    isUpdated: true
                }
            }
            return i
        }))

        // Update in backend
        try {
            await AuditsService.updateItem(currentAudit.id, item.id, {
                quantityCounted: countInput
            })
        } catch (error) {
            console.error("Error updating item", error)
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: "El conteo se guardó localmente pero hubo un error en el servidor."
            })
        }

        clearStaging()
    }

    const handleStagingKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            updateItemCount()
        }
    }

    // --- Submit Logic ---
    const handleConfirm = async () => {
        if (!currentAudit) {
            toast({
                variant: "destructive",
                title: "Sin auditoría",
                description: "Primero carga el snapshot del sistema."
            })
            return
        }

        // Check if all items have been counted
        const uncounted = items.filter(i => i.countedStock === null).length
        if (uncounted > 0) {
            toast({
                variant: "destructive",
                title: "Items sin contar",
                description: `Hay ${uncounted} productos sin conteo físico.`
            })
            return
        }

        setIsLoading(true)
        try {
            await AuditsService.close(currentAudit.id)

            toast({
                title: "Auditoría Finalizada",
                description: "Los ajustes de inventario han sido registrados."
            })
            router.push('/inventory')
        } catch (error: any) {
            console.error("Error closing audit", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error?.response?.data?.message || "No se pudo cerrar la auditoría."
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Metrics
    const countedItems = items.filter(i => i.countedStock !== null).length
    const accuracy = items.length > 0
        ? Math.round((items.filter(i => i.variance === 0).length / items.length) * 100)
        : 100

    const activeItem = activeItemIndex !== null ? items[activeItemIndex] : null

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
                                disabled={!!currentAudit}
                            />
                        </div>
                    </div>

                    {/* Warehouse Selector */}
                    <div className="md:col-span-5 space-y-2">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bodega Objetivo</Label>
                        <Select value={warehouseId} onValueChange={setWarehouseId} disabled={!!currentAudit}>
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
                            disabled={!warehouseId || !!currentAudit || isCreatingAudit}
                            className="h-10 border-dashed border-slate-300 text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                        >
                            {isCreatingAudit ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            )}
                            {currentAudit ? "Cargado" : "Cargar Todo"}
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
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escanear Producto</Label>
                        <div className="relative">
                            <Barcode className={`absolute left-3 top-3 h-4 w-4 ${activeItem ? 'text-amber-500' : 'text-slate-400'}`} />
                            <Input
                                ref={scanRef}
                                value={scanCode}
                                onChange={(e) => {
                                    setScanCode(e.target.value)
                                    if (e.target.value === "") setActiveItemIndex(null)
                                }}
                                onKeyDown={handleScan}
                                className={cn(
                                    "pl-10 h-10 transition-all rounded-xl",
                                    activeItem
                                        ? "border-amber-500 ring-4 ring-amber-500/10 bg-amber-50/20 text-amber-900 font-semibold"
                                        : "bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                                )}
                                placeholder="Buscar por SKU o nombre..."
                                autoComplete="off"
                                disabled={!currentAudit}
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
                            <span>{activeItem ? activeItem.productName : "Escanea un producto..."}</span>
                            {activeItem && <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-amber-100 text-amber-700">{activeItem.sku}</span>}
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
                            onClick={updateItemCount}
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
                                <th className="px-6 py-4 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Producto</th>
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
                                            <p className="text-xs mt-1 text-slate-400">Selecciona bodega y carga el snapshot</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className={cn(
                                        "hover:bg-amber-50/20 transition-colors group cursor-pointer",
                                        activeItemIndex === idx && "bg-amber-50/40"
                                    )}
                                    onClick={() => {
                                        setActiveItemIndex(idx)
                                        setCountInput(item.countedStock ?? 0)
                                        setTimeout(() => countRef.current?.focus(), 50)
                                    }}
                                >
                                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.sku}</td>
                                    <td className="px-6 py-4 text-slate-700 font-medium">
                                        <div className="flex items-center gap-2">
                                            {item.productName}
                                            {item.isUpdated && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-500">
                                        {isBlind ? "---" : item.systemStock}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800 bg-amber-50/30">
                                        {item.countedStock !== null ? item.countedStock : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.variance !== null ? (
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-bold",
                                                item.variance === 0 ? "bg-emerald-100 text-emerald-700" :
                                                    item.variance < 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {item.variance > 0 ? "+" : ""}{item.variance}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {/* Row indicator or action */}
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
                                <div className="text-2xl font-bold text-slate-800">{countedItems} / {items.length}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Precisión</div>
                                <div className={cn("text-2xl font-bold", accuracy === 100 ? "text-emerald-600" : "text-amber-600")}>
                                    {items.length > 0 && countedItems > 0 ? accuracy : 0}%
                                </div>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="bg-slate-900 hover:bg-black text-white font-bold px-8 h-12 shadow-lg shadow-slate-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                            disabled={items.length === 0 || countedItems !== items.length || isLoading}
                            onClick={handleConfirm}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Procesando...
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
