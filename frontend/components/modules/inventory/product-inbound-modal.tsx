"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
    Plus,
    Receipt,
    Barcode,
    Trash2,
    Calendar as CalendarIcon,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Types ---
interface InboundItem {
    id: string
    productId: string
    productName: string
    sku: string
    quantity: number
    unitCost: number
    discount: number
    taxRate: number
    isFree: boolean
}

// --- Mock Data (To be replaced by API) ---
const MOCK_PRODUCTS = {
    "PROD-001": { id: "p1", name: "Laptop Gamer X1", sku: "PROD-001", cost: 950.00 },
    "ACC-099": { id: "p2", name: "Mouse Wireless Pro", sku: "ACC-099", cost: 25.50 },
    "PART-102": { id: "p3", name: "Monitor 27 4K", sku: "PART-102", cost: 210.00 },
    "CAB-005": { id: "p4", name: "Cable HDMI 2.1 Premium", sku: "CAB-005", cost: 12.00 },
}

export function ProductInboundModal({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)

    // Header State
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [supplier, setSupplier] = useState("")

    // Staging Area State (The "Pre-Configuration" Zone)
    const [scanCode, setScanCode] = useState("")
    const [activeProduct, setActiveProduct] = useState<any>(null) // The product found by scan
    const [qtyInput, setQtyInput] = useState(1)
    const [costInput, setCostInput] = useState(0)
    const [discountInput, setDiscountInput] = useState(0)
    const [taxRateInput, setTaxRateInput] = useState(0.15) // Default 15%
    const [isFreeInput, setIsFreeInput] = useState(false)

    // Queue State
    const [items, setItems] = useState<InboundItem[]>([])

    // Focus Refs
    const qtyRef = useRef<HTMLInputElement>(null)
    const scanRef = useRef<HTMLInputElement>(null)

    // --- Search & Scan Logic ---
    const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const product = MOCK_PRODUCTS[scanCode as keyof typeof MOCK_PRODUCTS]

            if (product) {
                setActiveProduct(product)
                setCostInput(product.cost) // Load default cost
                // Move focus to quantity for quick entry
                qtyRef.current?.focus()
                qtyRef.current?.select()
            } else {
                // Error toast/effect here
                console.log("Producto no encontrado")
                // Shake effect or red border logic could go here
            }
        }
    }

    const clearStaging = () => {
        setScanCode("")
        setActiveProduct(null)
        setQtyInput(1)
        setCostInput(0)
        setDiscountInput(0)
        setIsFreeInput(false)
        // Refocus scan for next item
        scanRef.current?.focus()
    }

    const addItemToQueue = () => {
        if (!activeProduct) return

        const newItem: InboundItem = {
            id: crypto.randomUUID(),
            productId: activeProduct.id,
            productName: activeProduct.name,
            sku: activeProduct.sku,
            quantity: qtyInput,
            unitCost: costInput,
            discount: discountInput,
            taxRate: taxRateInput,
            isFree: isFreeInput
        }

        setItems([...items, newItem])
        clearStaging()
    }

    const removeFromQueue = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    // --- Totals Calculation ---
    const calculateTotals = () => {
        let subtotal = 0
        let totalDiscount = 0
        let totalTax = 0

        items.forEach(item => {
            const lineGross = item.quantity * item.unitCost
            const lineDiscount = item.isFree ? lineGross : item.discount
            const lineTaxable = Math.max(0, lineGross - lineDiscount)
            const lineTax = lineTaxable * item.taxRate

            subtotal += lineGross
            totalDiscount += lineDiscount
            totalTax += lineTax
        })

        const total = subtotal - totalDiscount + totalTax
        return { subtotal, totalDiscount, totalTax, total }
    }

    const { subtotal, totalDiscount, totalTax, total } = calculateTotals()

    // Key press handler for "Add" shortcut inside staging inputs
    const handleStagingKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addItemToQueue()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            {/* FIX: max-h-[85vh] prevents overflow on small laptop screens. flex & flex-col enable internal scrolling. */}
            <DialogContent className="w-full max-w-[95vw] md:max-w-6xl max-h-[90vh] p-0 flex flex-col gap-0 rounded-2xl border-none shadow-2xl bg-white overflow-hidden my-auto">

                {/* 1. Header Section (STICKY TOP) */}
                <div className="bg-white px-4 md:px-8 py-4 md:py-6 border-b border-slate-100 shrink-0">
                    <DialogHeader className="mb-4 md:mb-6">
                        <DialogTitle className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Plus className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                            Detalle de Ingreso
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Factura */}
                        <div className="md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">N° Factura</Label>
                            <div className="relative group">
                                <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 h-9 md:h-10 font-medium text-slate-700 text-sm"
                                    placeholder="F-000000"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Proveedor */}
                        <div className="md:col-span-6 space-y-1.5">
                            <Label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor</Label>
                            <Select value={supplier} onValueChange={setSupplier}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 h-9 md:h-10 text-sm">
                                    <SelectValue placeholder="Buscar proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="s1">TechWorld Inc.</SelectItem>
                                    <SelectItem value="s2">Global Supplies</SelectItem>
                                    <SelectItem value="s3">MegaPartes Ltd.</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fecha */}
                        <div className="md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Emisión</Label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="date"
                                    className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 h-9 md:h-10 text-sm"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SCROLLABLE CONTENT AREA (Flex-1 takes remaining height) */}
                <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">

                    {/* ADD ITEM STRIP */}
                    <div className="px-4 md:px-8 py-4 bg-white border-b border-slate-100 shadow-sm shrink-0 z-10">
                        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:items-end">

                            {/* SKU */}
                            <div className="col-span-1 md:flex-[2] space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código / SKU</Label>
                                <div className="relative flex items-center">
                                    <Barcode className={`absolute left-3 h-4 w-4 ${activeProduct ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <Input
                                        ref={scanRef}
                                        value={scanCode}
                                        onChange={(e) => {
                                            setScanCode(e.target.value)
                                            if (e.target.value === "") setActiveProduct(null)
                                        }}
                                        onKeyDown={handleScan}
                                        className={cn(
                                            "pl-9 md:pl-10 h-10 transition-all text-sm",
                                            activeProduct
                                                ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/30 text-emerald-900 font-semibold"
                                                : "bg-white border-slate-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                                        )}
                                        placeholder="Escanear..."
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Product Name */}
                            <div className="col-span-1 md:flex-[3] space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto</Label>
                                <div className={cn(
                                    "h-10 px-3 rounded-lg border flex items-center text-sm truncate transition-colors",
                                    activeProduct ? "bg-emerald-50/50 border-emerald-200 text-slate-900 font-medium" : "bg-slate-50 border-slate-200 text-slate-400 italic"
                                )}>
                                    {activeProduct ? activeProduct.name : "Esperando escaneo..."}
                                </div>
                            </div>

                            {/* Config Row (Mobile: separate row) */}
                            <div className="col-span-2 md:hidden h-px bg-slate-100 my-1"></div>

                            {/* Qty */}
                            <div className="col-span-1 md:w-20 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cant</Label>
                                <Input
                                    ref={qtyRef}
                                    type="number"
                                    className="h-10 text-center font-medium text-sm"
                                    min={1}
                                    disabled={!activeProduct}
                                    value={qtyInput}
                                    onChange={(e) => setQtyInput(Number(e.target.value))}
                                    onKeyDown={handleStagingKeyDown}
                                />
                            </div>

                            {/* Cost */}
                            <div className="col-span-1 md:w-28 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo U.</Label>
                                <Input
                                    type="number"
                                    className="h-10 text-right font-medium text-sm"
                                    disabled={!activeProduct}
                                    value={costInput}
                                    onChange={(e) => setCostInput(Number(e.target.value))}
                                    onKeyDown={handleStagingKeyDown}
                                />
                            </div>

                            {/* IVA */}
                            <div className="col-span-1 md:w-28 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IVA %</Label>
                                <Select
                                    disabled={!activeProduct}
                                    value={taxRateInput.toString()}
                                    onValueChange={(v) => setTaxRateInput(Number(v))}
                                >
                                    <SelectTrigger className="h-10 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0% (Exento)</SelectItem>
                                        <SelectItem value="0.15">15% (General)</SelectItem>
                                        <SelectItem value="0.10">10% (Reducido)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Add Button */}
                            <div className="col-span-1 md:w-auto pt-5 md:pt-0">
                                <Button
                                    className={cn(
                                        "w-full md:w-auto h-10 px-6 rounded-lg transition-all shadow-md active:scale-95 text-xs md:text-sm uppercase font-bold tracking-wide",
                                        activeProduct
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                    disabled={!activeProduct}
                                    onClick={addItemToQueue}
                                >
                                    <Plus className="h-4 w-4 md:mr-1" />
                                    <span className="hidden md:inline">Agregar</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* QUEUE TABLE (Scrolls vertically) */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[200px]">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 bg-slate-50 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wider md:w-32 hidden md:table-cell">Código</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Producto</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-16 md:w-24">Cant</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-24 hidden md:table-cell">Precio</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-20 hidden md:table-cell">IVA</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500 text-[10px] uppercase tracking-wider w-24 md:w-32">Total</th>
                                        <th className="px-4 py-3 w-10 md:w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 md:py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <AlertCircle className="h-8 w-8 md:h-10 md:w-10 mb-2 md:mb-3 opacity-20" />
                                                    <p className="font-medium text-sm">Cola vacía</p>
                                                    <p className="text-xs">Escanea productos para comenzar</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : items.map((item) => {
                                        const lineGross = item.quantity * item.unitCost
                                        const lineDiscount = item.isFree ? lineGross : item.discount
                                        const lineTaxable = Math.max(0, lineGross - lineDiscount)
                                        const lineTax = lineTaxable * item.taxRate
                                        const lineTotal = lineTaxable + lineTax

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-4 py-2.5 font-mono text-slate-600 font-medium text-xs hidden md:table-cell">{item.sku}</td>
                                                <td className="px-4 py-2.5 text-slate-900 font-medium text-xs md:text-sm">
                                                    <div className="truncate max-w-[150px] md:max-w-none">{item.productName}</div>
                                                    <div className="md:hidden text-[10px] text-slate-400">{item.sku}</div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center text-slate-900 text-xs md:text-sm">{item.quantity}</td>
                                                <td className="px-4 py-2.5 text-right text-slate-600 text-xs hidden md:table-cell">${item.unitCost.toFixed(2)}</td>
                                                <td className="px-4 py-2.5 text-right text-slate-500 text-xs hidden md:table-cell">{(item.taxRate * 100).toFixed(0)}%</td>
                                                <td className="px-4 py-2.5 text-right font-bold text-slate-900 text-xs md:text-sm">${lineTotal.toFixed(2)}</td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        onClick={() => removeFromQueue(item.id)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. Footer Section (STICKY BOTTOM) */}
                <div className="bg-white px-4 md:px-8 py-4 md:py-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] shrink-0 gap-4 md:gap-0">
                    <div className="text-xs md:text-sm text-slate-500 w-full md:w-auto text-center md:text-left">
                        <span className="font-semibold text-slate-800">{items.length}</span> líneas
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto">
                        <div className="flex gap-8 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400">Subtotal</div>
                                <div className="font-semibold text-slate-700 text-sm">${subtotal.toFixed(2)}</div>
                            </div>
                            <div className="text-right hidden md:block">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400">IVA</div>
                                <div className="font-semibold text-slate-700 text-sm">${totalTax.toFixed(2)}</div>
                            </div>
                            <div className="text-right pl-6 border-l border-slate-100">
                                <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold mb-0.5">TOTAL</div>
                                <div className="text-xl md:text-2xl font-bold text-slate-900">${total.toFixed(2)}</div>
                            </div>
                        </div>

                        <Button
                            className="w-full md:w-auto h-10 md:h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
                            disabled={items.length === 0}
                        >
                            Confirmar Ingreso
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}
