"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Receipt,
    Barcode,
    Trash2,
    Calendar as CalendarIcon,
    AlertCircle,
    ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function InboundPage() {
    const router = useRouter()

    // Header State
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [supplier, setSupplier] = useState("")

    // Staging Area State
    const [scanCode, setScanCode] = useState("")
    const [activeProduct, setActiveProduct] = useState<any>(null)
    const [qtyInput, setQtyInput] = useState(1)
    const [costInput, setCostInput] = useState(0)
    const [discountInput, setDiscountInput] = useState(0)
    const [taxRateInput, setTaxRateInput] = useState(0.15)
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
                qtyRef.current?.focus()
                qtyRef.current?.select()
            } else {
                console.log("Producto no encontrado")
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

    const handleStagingKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addItemToQueue()
        }
    }

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Page Header */}
            <div className="flex items-center gap-4 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-10 w-10 text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ingreso de Mercadería</h1>
                    <p className="text-slate-500 text-sm">Registrar entradas de stock por compra.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                {/* 1. Invoice Header (Sticky Top of Card) */}
                <div className="bg-white px-8 py-6 border-b border-slate-100 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Factura */}
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">N° Factura</Label>
                            <div className="relative group">
                                <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 h-10 font-medium text-slate-700"
                                    placeholder="F-000000"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Proveedor */}
                        <div className="md:col-span-6 space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedor</Label>
                            <Select value={supplier} onValueChange={setSupplier}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500 h-10">
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
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Emisión</Label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="date"
                                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 h-10"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Scrollable Body: Staging + Table */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">

                    {/* ADD ITEM STRIP */}
                    <div className="px-8 py-5 bg-white border-b border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] shrink-0 z-10">
                        <div className="flex gap-4 items-end">

                            {/* SKU */}
                            <div className="flex-[2] space-y-1.5">
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
                                            "pl-10 h-11 transition-all text-sm shadow-sm",
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
                            <div className="flex-[3] space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto</Label>
                                <div className={cn(
                                    "h-11 px-4 rounded-lg border flex items-center text-sm truncate transition-colors",
                                    activeProduct ? "bg-emerald-50/50 border-emerald-200 text-slate-900 font-medium" : "bg-slate-50 border-slate-200 text-slate-400 italic"
                                )}>
                                    {activeProduct ? activeProduct.name : "Esperando escaneo..."}
                                </div>
                            </div>

                            {/* Qty */}
                            <div className="w-24 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cant</Label>
                                <Input
                                    ref={qtyRef}
                                    type="number"
                                    className="h-11 text-center font-bold text-slate-800"
                                    min={1}
                                    disabled={!activeProduct}
                                    value={qtyInput}
                                    onChange={(e) => setQtyInput(Number(e.target.value))}
                                    onKeyDown={handleStagingKeyDown}
                                />
                            </div>

                            {/* Cost */}
                            <div className="w-32 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo U.</Label>
                                <Input
                                    type="number"
                                    className="h-11 text-right font-medium text-slate-700"
                                    disabled={!activeProduct}
                                    value={costInput}
                                    onChange={(e) => setCostInput(Number(e.target.value))}
                                    onKeyDown={handleStagingKeyDown}
                                />
                            </div>

                            {/* IVA */}
                            <div className="w-28 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IVA %</Label>
                                <Select
                                    disabled={!activeProduct}
                                    value={taxRateInput.toString()}
                                    onValueChange={(v) => setTaxRateInput(Number(v))}
                                >
                                    <SelectTrigger className="h-11 text-sm bg-white">
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
                            <div className="w-auto">
                                <Button
                                    className={cn(
                                        "h-11 px-6 rounded-lg transition-all shadow-md active:scale-95 uppercase font-bold tracking-wide",
                                        activeProduct
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                    disabled={!activeProduct}
                                    onClick={addItemToQueue}
                                >
                                    <Plus className="h-5 w-5 mr-1" />
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* QUEUE TABLE */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 bg-slate-50 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider w-32">Código</th>
                                        <th className="px-6 py-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider w-24">Cant</th>
                                        <th className="px-6 py-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-32">Precio</th>
                                        <th className="px-6 py-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-24">IVA</th>
                                        <th className="px-6 py-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-32">Total</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                                                        <AlertCircle className="h-8 w-8 opacity-40" />
                                                    </div>
                                                    <p className="font-medium text-sm text-slate-600">Cola vacía</p>
                                                    <p className="text-xs text-slate-400 mt-1">Escanea productos arriba para comenzar</p>
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
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-slate-600 font-medium text-xs">{item.sku}</td>
                                                <td className="px-6 py-4 text-slate-900 font-bold text-sm">{item.productName}</td>
                                                <td className="px-6 py-4 text-center bg-slate-50/50 text-slate-900 font-bold">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">${item.unitCost.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-slate-500 px-8">{(item.taxRate * 100).toFixed(0)}%</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 text-base">${lineTotal.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => removeFromQueue(item.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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

                {/* 3. Footer Section */}
                <div className="bg-white px-8 py-6 border-t border-slate-200 flex items-center justify-between shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
                    <div className="text-sm text-slate-500">
                        <span className="font-bold text-slate-800">{items.length}</span> líneas registradas
                    </div>

                    <div className="flex items-center gap-12">
                        <div className="flex gap-10">
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Subtotal</div>
                                <div className="font-semibold text-slate-700 text-lg">${subtotal.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">IVA</div>
                                <div className="font-semibold text-slate-700 text-lg">${totalTax.toFixed(2)}</div>
                            </div>
                            <div className="text-right pl-8 border-l border-slate-100">
                                <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-black mb-0.5">TOTAL</div>
                                <div className="text-3xl font-bold text-slate-900 tracking-tight">${total.toFixed(2)}</div>
                            </div>
                        </div>

                        <Button
                            className="h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all hover:translate-y-[-2px]"
                            disabled={items.length === 0}
                        >
                            Confirmar Ingreso
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
