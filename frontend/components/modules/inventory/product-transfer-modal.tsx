"use client"

import { useState, useRef, useEffect } from "react"
import {
    ArrowRightLeft,
    Plus,
    Barcode,
    Trash2,
    AlertCircle,
    ArrowRight,
    Building2,
    PackageSearch
} from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// --- Types ---
interface TransferItem {
    id: string
    productId: string
    productName: string
    sku: string
    quantity: number
    currentStock: number // Para validar que no traslade más de lo que hay
}

// --- Mock Data ---
const MOCK_INVENTORY = {
    "PROD-001": { id: "p1", name: "Laptop Gamer X1", sku: "PROD-001", stock: 45 },
    "ING-004-A": { id: "p2", name: "Harina de Trigo Premium", sku: "ING-004-A", stock: 2500 },
    "ACC-099": { id: "p3", name: "Mouse Wireless Pro", sku: "ACC-099", stock: 12 },
}

interface ProductTransferModalProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ProductTransferModal({ children }: ProductTransferModalProps) {
    const [open, setOpen] = useState(false)

    // --- Header State (Global Context) ---
    const [originWarehouse, setOriginWarehouse] = useState("")
    const [destWarehouse, setDestWarehouse] = useState("")

    // --- Staging Area State (Scan & Add) ---
    const [scanCode, setScanCode] = useState("")
    const [activeProduct, setActiveProduct] = useState<any>(null)
    const [transferQty, setTransferQty] = useState(1)

    // --- Queue State ---
    const [items, setItems] = useState<TransferItem[]>([])

    // --- Refs ---
    const scanRef = useRef<HTMLInputElement>(null)
    const qtyRef = useRef<HTMLInputElement>(null)

    // --- Logic ---
    const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const product = MOCK_INVENTORY[scanCode as keyof typeof MOCK_INVENTORY]

            if (product) {
                setActiveProduct(product)
                // Auto-focus quantity
                setTimeout(() => qtyRef.current?.select(), 0)
            } else {
                // Error visual simple (shake/red border logic implementation later)
                console.log("Producto no encontrado")
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
        if (transferQty > activeProduct.stock) {
            alert(`Stock insuficiente. Máximo: ${activeProduct.stock}`)
            return
        }

        const newItem: TransferItem = {
            id: crypto.randomUUID(),
            productId: activeProduct.id,
            productName: activeProduct.name,
            sku: activeProduct.sku,
            quantity: transferQty,
            currentStock: activeProduct.stock
        }

        setItems([...items, newItem])
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}

            {/* Main Container: Wide, Clean White, Rounded */}
            <DialogContent className="w-full max-w-[95vw] md:max-w-6xl max-h-[90vh] p-0 flex flex-col gap-0 rounded-2xl border-none shadow-2xl bg-white overflow-hidden my-auto outline-none">

                {/* 1. Header Section (Context) */}
                <div className="bg-white px-8 py-5 border-b border-slate-100 shrink-0">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <ArrowRightLeft className="h-6 w-6" />
                            </div>
                            <div>
                                Traslado de Inventario
                                <span className="block text-sm font-normal text-slate-400 mt-0.5">Mueve existencias entre bodegas</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Ruta de Traslado - Horizontal Banner Style */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1 w-full space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Bodega Origen
                            </Label>
                            <Select value={originWarehouse} onValueChange={setOriginWarehouse}>
                                <SelectTrigger className="bg-white border-slate-200 h-11 font-medium text-slate-700">
                                    <SelectValue placeholder="Seleccionar origen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="main">Bodega Central</SelectItem>
                                    <SelectItem value="kitchen">Cocina Principal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="hidden md:flex items-center justify-center pt-5 px-2 text-slate-300">
                            <ArrowRight className="w-6 h-6" />
                        </div>

                        <div className="flex-1 w-full space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Bodega Destino
                            </Label>
                            <Select value={destWarehouse} onValueChange={setDestWarehouse}>
                                <SelectTrigger className="bg-white border-slate-200 h-11 font-medium text-slate-700">
                                    <SelectValue placeholder="Seleccionar destino..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="main">Bodega Central</SelectItem>
                                    <SelectItem value="kitchen">Bar Terraza</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* 2. Staging Area (Scan & Add) */}
                <div className="px-8 py-6 bg-slate-50/30 border-b border-slate-100 z-10">
                    <div className="grid grid-cols-1 md:flex md:flex-row gap-4 items-end">

                        {/* Scan Input */}
                        <div className="col-span-1 md:flex-[2] space-y-1.5">
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
                                        "pl-10 h-11 transition-all",
                                        activeProduct ? "border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/20" : "bg-white"
                                    )}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Product Display */}
                        <div className="col-span-1 md:flex-[3] space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto Identificado</Label>
                            <div className={cn(
                                "h-11 px-4 rounded-xl border flex items-center justify-between text-sm transition-all shadow-sm",
                                activeProduct
                                    ? "bg-white border-blue-200 text-slate-800"
                                    : "bg-slate-50 border-slate-200 text-slate-400 italic"
                            )}>
                                <span className={cn("font-medium", !activeProduct && "font-normal")}>
                                    {activeProduct ? activeProduct.name : "Esperando escaneo..."}
                                </span>
                                {activeProduct && (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                                        Stock: {activeProduct.stock}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quantity Input */}
                        <div className="col-span-1 md:w-32 space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad</Label>
                            <Input
                                ref={qtyRef}
                                type="number"
                                min={1}
                                max={activeProduct?.stock || 9999}
                                value={transferQty}
                                onChange={(e) => setTransferQty(Number(e.target.value))}
                                onKeyDown={handleStagingKeyDown}
                                disabled={!activeProduct}
                                className="h-11 text-center font-bold text-lg bg-white"
                            />
                        </div>

                        {/* Add Button */}
                        <div className="col-span-1 md:w-auto">
                            <Button
                                onClick={addItemToQueue}
                                disabled={!activeProduct}
                                className={cn(
                                    "h-11 px-8 w-full md:w-auto rounded-xl font-bold uppercase tracking-wide transition-all shadow-md active:scale-95",
                                    activeProduct
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                                        : "bg-slate-200 text-slate-400"
                                )}
                            >
                                <Plus className="w-5 h-5 md:mr-2" />
                                <span className="hidden md:inline">Agregar</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. Queue List (Table) */}
                <div className="flex-1 overflow-y-auto px-8 py-4 bg-white">
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-4 font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-32">Código</th>
                                    <th className="py-3 px-4 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Producto</th>
                                    <th className="py-3 px-4 font-semibold text-slate-500 text-[10px] uppercase tracking-wider text-center w-32">Cant. Traslado</th>
                                    <th className="py-3 px-4 font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-300">
                                                <PackageSearch className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="font-medium">Lista de traslado vacía</p>
                                                <p className="text-xs">Usa el formulario de arriba para agregar ítems</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-3 font-mono text-slate-600 text-xs">{item.sku}</td>
                                            <td className="py-3 font-medium text-slate-900">{item.productName}</td>
                                            <td className="py-3 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-xs">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => removeFromQueue(item.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                </div>

                {/* 4. Footer (Action) */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="text-sm font-medium text-slate-500">
                        Total Ítems: <span className="text-slate-900 font-bold">{items.length}</span>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            disabled={items.length === 0}
                        >
                            Confirmar Traslado
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}
