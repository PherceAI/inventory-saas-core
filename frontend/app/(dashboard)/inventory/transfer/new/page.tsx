"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowRightLeft,
    Plus,
    Barcode,
    Trash2,
    Building2,
    AlertCircle,
    ArrowLeft,
    Loader2,
    ArrowRight,
    PackageSearch
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Services
import { ProductsService } from "@/services/products.service"
import { WarehousesService, Warehouse } from "@/services/warehouses.service"
import { InventoryService } from "@/services/inventory.service"

// --- Types ---
interface TransferItem {
    id: string
    productId: string
    productName: string
    sku: string
    quantity: number
    currentStock: number
}

export default function NewTransferPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])

    // Header State
    const [originWarehouse, setOriginWarehouse] = useState("")
    const [destWarehouse, setDestWarehouse] = useState("")

    // Staging Area State
    const [scanCode, setScanCode] = useState("")
    const [activeProduct, setActiveProduct] = useState<any>(null)
    const [transferQty, setTransferQty] = useState(1)

    // Queue State
    const [items, setItems] = useState<TransferItem[]>([])

    // Focus Refs
    const scanRef = useRef<HTMLInputElement>(null)
    const qtyRef = useRef<HTMLInputElement>(null)

    // --- Load Data (Warehouses) ---
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

    // --- Search & Scan Logic ---
    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const term = scanCode.trim()
            if (!term) return

            // Show loading state if needed via toast or UI icon
            try {
                // Determine implicit search strategy? Service handles it.
                // findByTerm expects "term" but in frontend service implementation creates /products/${term} which maps to backend findByTerm logic
                const result = await ProductsService.findByTerm(term)

                let product = null
                if (Array.isArray(result)) {
                    // Start strict, then fallback
                    const exact = result.find((p: any) => p.sku === term || p.barcode === term)
                    product = exact || result[0]
                } else {
                    product = result
                }

                if (product) {
                    // Logic to extract total stock from "currentStock" which comes from backend aggregations
                    const stock = product.currentStock ? Number(product.currentStock) : (product.stock || 0);

                    setActiveProduct({ ...product, stock })
                    setTransferQty(1)
                    setScanCode("")

                    setTimeout(() => {
                        qtyRef.current?.focus()
                        qtyRef.current?.select()
                    }, 50)
                } else {
                    toast({ variant: "destructive", title: "No encontrado", description: "Código no existe en inventario." })
                    setActiveProduct(null)
                }
            } catch (err) {
                console.error(err)
                toast({ variant: "destructive", title: "No encontrado", description: "Producto no encontrado." })
                setActiveProduct(null)
                // Keep focus on scan so they can retry
                setTimeout(() => scanRef.current?.select(), 50)
            }
        }
    }

    const clearStaging = () => {
        setScanCode("")
        setActiveProduct(null)
        setTransferQty(1)
        scanRef.current?.focus()
    }

    const addItemToQueue = () => {
        if (!activeProduct) return

        // Basic validation: Don't transfer more than available?
        // Optional: Allow override (it's a management decision usually)
        if (transferQty > activeProduct.stock) {
            toast({
                variant: "destructive",
                title: "Stock Insuficiente",
                description: `Solo hay ${activeProduct.stock} unidades en inventario.`
            })
            // For now, we block it.
            return;
        }

        const newItem: TransferItem = {
            id: crypto.randomUUID(),
            productId: activeProduct.id,
            productName: activeProduct.name,
            sku: activeProduct.sku,
            quantity: transferQty,
            currentStock: activeProduct.stock
        }

        setItems(prev => [...prev, newItem])
        clearStaging()
    }

    const removeFromQueue = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const handleStagingKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addItemToQueue()
        }
    }

    // --- Submit Logic (Confirmar Traslado) ---
    const handleConfirm = async () => {
        if (!originWarehouse || !destWarehouse) {
            toast({
                variant: "destructive",
                title: "Faltan datos",
                description: "Seleccione bodega de origen y destino."
            })
            return
        }
        if (originWarehouse === destWarehouse) {
            toast({
                variant: "destructive",
                title: "Error de Logística",
                description: "La bodega de origen y destino no pueden ser la misma."
            })
            return
        }
        if (items.length === 0) {
            toast({
                variant: "destructive",
                title: "Lista vacía",
                description: "Agregue al menos un producto para trasladar."
            })
            return
        }

        setIsLoading(true)
        try {
            // Build payload
            // Build payload
            const payload = {
                originWarehouseId: originWarehouse,
                destinationWarehouseId: destWarehouse,
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity
                })),
                notes: "Traslado generado desde frontend"
            }

            // Real call to backend
            await InventoryService.registerTransfer(payload)

            // Simulating success for now as requested by user flow focus
            await new Promise(r => setTimeout(r, 1000))

            toast({
                title: "Traslado Exitoso",
                description: "El movimiento de inventario ha sido registrado."
            })
            router.push('/inventory')

        } catch (error) {
            console.error("Error creating transfer", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo registrar el traslado."
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full flex-col bg-slate-50/50 p-6 space-y-6 overflow-hidden">
            {/* 1. Header Card - Floating & Rounded */}
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
                            <span className="bg-blue-50 p-2 rounded-lg">
                                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                            </span>
                            Nuevo Traslado
                        </h1>
                        <p className="text-slate-500 text-sm ml-12">Mover productos entre bodegas</p>
                    </div>
                </div>

                {/* Warehouse Fields - Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-12">
                    {/* Origin */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Bodega Origen
                        </Label>
                        <Select value={originWarehouse} onValueChange={setOriginWarehouse}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 h-10 rounded-xl transition-all hover:bg-white text-slate-700 font-medium">
                                <SelectValue placeholder="Seleccionar origen..." />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Destination */}
                    <div className="space-y-2 relative">
                        <div className="hidden md:block absolute -left-6 top-8 text-slate-300 pointer-events-none">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Bodega Destino
                        </Label>
                        <Select value={destWarehouse} onValueChange={setDestWarehouse}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 h-10 rounded-xl transition-all hover:bg-white text-slate-700 font-medium">
                                <SelectValue placeholder="Seleccionar destino..." />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* 2. Content Area - Card 2 */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100">

                {/* Staging Strip */}
                <div className="p-5 border-b border-slate-50 flex flex-wrap md:flex-nowrap gap-4 items-end bg-white">
                    {/* Scan Input */}
                    <div className="w-full md:flex-[2.5] space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código / SKU</Label>
                        <div className="relative group">
                            <Barcode className={cn(
                                "absolute left-3 top-3 h-4 w-4 transition-colors",
                                activeProduct ? "text-blue-500" : "text-slate-400"
                            )} />
                            <Input
                                ref={scanRef}
                                value={scanCode}
                                onChange={(e) => {
                                    setScanCode(e.target.value)
                                    if (e.target.value === "") setActiveProduct(null)
                                }}
                                onKeyDown={handleScan}
                                placeholder="Escanear producto..."
                                className={cn(
                                    "pl-10 h-10 transition-all rounded-xl",
                                    activeProduct ? "border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/20 text-blue-900 font-semibold" : "bg-slate-50 border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 hover:bg-white"
                                )}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Product Name */}
                    <div className="w-full md:flex-[3] space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto</Label>
                        <div className={cn(
                            "h-10 px-4 rounded-xl border flex items-center justify-between text-sm transition-all shadow-sm",
                            activeProduct
                                ? "bg-blue-50/30 border-blue-200 text-slate-900 font-medium"
                                : "bg-slate-50 border-slate-200 text-slate-400 italic"
                        )}>
                            <span className="truncate max-w-[200px]">{activeProduct ? activeProduct.name : "Esperando escaneo..."}</span>
                            {activeProduct && (
                                <span className="text-[10px] bg-white/50 text-blue-700 px-2 py-0.5 rounded-md font-bold border border-blue-100">
                                    Stock: {activeProduct.stock}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="w-24 space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cant</Label>
                        <Input
                            ref={qtyRef}
                            type="number"
                            min={1}
                            max={activeProduct?.stock || 9999}
                            value={transferQty}
                            onChange={(e) => setTransferQty(Number(e.target.value))}
                            onKeyDown={handleStagingKeyDown}
                            disabled={!activeProduct}
                            className="h-10 text-center font-bold text-slate-700 rounded-xl bg-slate-50 border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                        />
                    </div>

                    {/* Add Button */}
                    <div className="pt-0 pb-0.5 pl-2">
                        <Button
                            onClick={addItemToQueue}
                            disabled={!activeProduct}
                            className={cn(
                                "h-10 px-6 rounded-xl transition-all shadow-sm active:scale-95 text-xs uppercase font-bold tracking-wide",
                                activeProduct
                                    ? "bg-slate-900 hover:bg-black text-white shadow-slate-900/10"
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            )}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                        </Button>
                    </div>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm/5">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider w-32">Código</th>
                                <th className="px-6 py-4 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider w-24">Cant. Traslado</th>
                                <th className="px-4 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100">
                                                <PackageSearch className="w-10 h-10 opacity-20" />
                                            </div>
                                            <p className="font-medium text-slate-400">Lista de traslado vacía</p>
                                            <p className="text-xs mt-1 text-slate-400">Escanea productos para agregarlos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.sku}</td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{item.productName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => removeFromQueue(item.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="bg-white px-8 py-6 border-t border-slate-50 flex justify-between items-center shrink-0">
                    <div className="text-sm font-medium text-slate-400">
                        Total Ítems: <span className="text-slate-900 font-bold">{items.length}</span>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:scale-[1.02]"
                            disabled={items.length === 0 || isLoading}
                            onClick={handleConfirm}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                "Confirmar Traslado"
                            )}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
