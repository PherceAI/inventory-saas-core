"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Plus,
    Receipt,
    Barcode,
    Trash2,
    Calendar as CalendarIcon,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Package
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Services
import { ProductsService } from "@/services/products.service"
import { InventoryService } from "@/services/inventory.service"
import { SuppliersService } from "@/services/suppliers.service"
import { WarehousesService, Warehouse } from "@/services/warehouses.service"

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

export default function NewInboundPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])

    // Header State
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [supplierId, setSupplierId] = useState("")
    const [warehouseId, setWarehouseId] = useState("")
    const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0])

    // Staging Area State
    const [scanCode, setScanCode] = useState("")
    const [activeProduct, setActiveProduct] = useState<any>(null)

    // Financials
    const [qtyInput, setQtyInput] = useState(1)
    const [basePriceInput, setBasePriceInput] = useState(0)
    const [discountInput, setDiscountInput] = useState(0)
    const [taxRateInput, setTaxRateInput] = useState(0) // Percentage 0-100 for UI ease

    // Logistics
    const [batchInput, setBatchInput] = useState("")
    const [expiryInput, setExpiryInput] = useState("")
    const [isFreeInput, setIsFreeInput] = useState(false)

    // Queue State
    const [items, setItems] = useState<any[]>([]) // Using any for flexibility with extended fields

    // Focus Refs
    const qtyRef = useRef<HTMLInputElement>(null)
    const scanRef = useRef<HTMLInputElement>(null)

    // --- Load Data ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [suppliersData, warehousesData] = await Promise.all([
                    SuppliersService.getAll(),
                    WarehousesService.getAll()
                ])
                setSuppliers(suppliersData || [])
                setWarehouses(warehousesData || [])

                // Set default warehouse (first one or the one marked as default)
                if (warehousesData && warehousesData.length > 0) {
                    const defaultWh = warehousesData.find(w => w.isDefault) || warehousesData[0]
                    setWarehouseId(defaultWh.id)
                }
            } catch (error) {
                console.error("Error loading initial data", error)
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudieron cargar los datos iniciales."
                })
            }
        }
        loadInitialData()
    }, [toast])

    // --- Search & Scan Logic ---
    const [isSearching, setIsSearching] = useState(false)

    const searchProduct = async (term: string) => {
        if (!term.trim()) return

        try {
            setIsSearching(true)
            const result = await ProductsService.findByTerm(term)
            let product = null

            if (Array.isArray(result)) {
                const exactMatch = result.find((p: any) => p.sku === term || p.barcode === term)
                product = exactMatch || result[0]
            } else {
                product = result
            }

            if (product) {
                setActiveProduct(product)
                // Default values from product
                setBasePriceInput(Number(product.costAverage) || 0)
                setTaxRateInput(0) // Default tax could come from product settings later
                setScanCode("")

                // Focus quantity
                setTimeout(() => {
                    qtyRef.current?.focus()
                    qtyRef.current?.select()
                }, 50)
            } else {
                toast({
                    variant: "destructive",
                    title: "No encontrado",
                    description: `No se encontró producto con código: ${term}`
                })
                setActiveProduct(null)
            }
        } catch (err) {
            console.error(err)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se encontró el producto."
            })
            setActiveProduct(null)
            setScanCode("")
            scanRef.current?.focus()
        } finally {
            setIsSearching(false)
        }
    }

    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            await searchProduct(scanCode)
        }
    }

    const handleBlur = async () => {
        if (scanCode.trim() && !activeProduct) {
            await searchProduct(scanCode)
        }
    }

    const clearStaging = () => {
        setScanCode("")
        setActiveProduct(null)
        setQtyInput(1)
        setBasePriceInput(0)
        setDiscountInput(0)
        setTaxRateInput(0)
        setBatchInput("")
        setExpiryInput("")
        setIsFreeInput(false)
        scanRef.current?.focus()
    }

    // Calculated fields (Live Preview)
    const calculatedSubtotal = qtyInput * basePriceInput
    const calculatedTax = (calculatedSubtotal - discountInput) * (taxRateInput / 100)
    const calculatedTotal = (calculatedSubtotal - discountInput) + calculatedTax
    const calculatedUnitCost = qtyInput > 0 ? calculatedTotal / qtyInput : 0

    const addItemToQueue = () => {
        if (!activeProduct) return

        const newItem = {
            id: crypto.randomUUID(),
            productId: activeProduct.id,
            productName: activeProduct.name,
            sku: activeProduct.sku,
            quantity: qtyInput,
            // Logistics
            batchNumber: batchInput || undefined,
            expiresAt: expiryInput || undefined,
            // Financials stored for display
            basePrice: basePriceInput,
            discount: discountInput,
            taxRate: taxRateInput,
            // Effective unit cost for Backend
            unitCost: calculatedUnitCost,
            totalLine: calculatedTotal,
            isFree: isFreeInput
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

    // --- Submit Logic (Confirmar Ingreso) ---
    const handleConfirm = async () => {
        if (!supplierId) {
            toast({ variant: "destructive", title: "Falta Proveedor", description: "Seleccione un proveedor." })
            return
        }
        if (!warehouseId) {
            toast({ variant: "destructive", title: "Falta Almacén", description: "No hay almacenes disponibles." })
            return
        }
        if (items.length === 0) {
            toast({ variant: "destructive", title: "Lista vacía", description: "Agregue productos." })
            return
        }

        setIsLoading(true)
        try {
            await Promise.all(items.map(item =>
                InventoryService.registerInbound({
                    productId: item.productId,
                    warehouseId: warehouseId,
                    quantity: item.quantity,
                    unitCost: item.unitCost, // Sends the CALCULATED effective cost
                    supplierId: supplierId,
                    notes: `Factura: ${invoiceNumber} | Ref: ${item.sku}`,

                    // --- NEW FIELDS SUPPORTED BY BACKEND ---
                    batchNumber: item.batchNumber || undefined, // Send undefined if empty
                    expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : undefined,

                    // Automation
                    invoiceNumber: invoiceNumber || undefined,
                    createPayable: true,
                    paymentTermDays: 30
                })
            ))

            toast({ title: "Ingreso Exitoso", description: "Stock, lotes y cuentas por pagar generados." })
            router.push('/inventory')

        } catch (error: any) {
            console.error("Error registering inbound", error)
            const errorMessage = error?.response?.data?.message || error?.message || "Hubo un problema al procesar."
            toast({ variant: "destructive", title: "Error", description: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }

    // --- Totals ---
    const globalTotal = items.reduce((acc, item) => acc + item.totalLine, 0)
    const globalCount = items.length

    return (
        <div className="flex h-full flex-col bg-slate-50/50 p-6 space-y-6 overflow-hidden">
            {/* 1. Header Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-5 shrink-0">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 -ml-2 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-blue-50 p-2 rounded-lg"><Plus className="h-5 w-5 text-blue-600" /></span>
                            Detalle de Ingreso
                        </h1>
                        <p className="text-slate-500 text-sm ml-12">Registrar nueva factura y recepción de lotes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 ml-12">
                    <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">N° Factura</Label>
                        <div className="relative group">
                            <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input className="pl-10 bg-slate-50 border-slate-200 h-10 rounded-lg" placeholder="F-000000" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                        </div>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-lg"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Emisión</Label>
                        <Input type="date" className="bg-slate-50 border-slate-200 h-10 rounded-lg" value={emissionDate} onChange={(e) => setEmissionDate(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-slate-100">

                {/* Advanced Staging Bar */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 space-y-4">

                    {/* Row 1: Search */}
                    <div className="flex gap-4">
                        <div className="flex-[2] relative">
                            {isSearching ?
                                <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-blue-500" /> :
                                <Barcode className={`absolute left-3 top-3 h-4 w-4 ${activeProduct ? 'text-blue-500' : 'text-slate-400'}`} />
                            }
                            <Input
                                ref={scanRef}
                                value={scanCode}
                                onChange={(e) => { setScanCode(e.target.value); if (e.target.value === "") setActiveProduct(null); }}
                                onKeyDown={handleScan}
                                onBlur={handleBlur}
                                placeholder="Escanear producto..."
                                className={cn("pl-10 h-10 rounded-lg", activeProduct && "border-blue-500 ring-2 ring-blue-500/10")}
                            />
                        </div>
                        <div className="flex-[3]">
                            <div className={cn("h-10 px-4 rounded-lg border flex items-center text-sm truncate bg-white", activeProduct ? "border-blue-200 text-slate-900 font-medium" : "border-slate-200 text-slate-400")}>
                                {activeProduct ? activeProduct.name : "Nombre del producto..."}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Details */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-20">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Cant.</Label>
                            <Input ref={qtyRef} type="number" className="h-9 bg-white rounded-lg" min={1} value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} disabled={!activeProduct} />
                        </div>
                        <div className="w-28">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Costo Base</Label>
                            <Input type="number" className="h-9 bg-white rounded-lg" value={basePriceInput} onChange={e => setBasePriceInput(Number(e.target.value))} disabled={!activeProduct} />
                        </div>
                        <div className="w-20">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Desc ($)</Label>
                            <Input type="number" className="h-9 bg-white text-red-500 rounded-lg" value={discountInput} onChange={e => setDiscountInput(Number(e.target.value))} disabled={!activeProduct} />
                        </div>
                        <div className="w-16">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase">IVA %</Label>
                            <Input type="number" className="h-9 bg-white rounded-lg" value={taxRateInput} onChange={e => setTaxRateInput(Number(e.target.value))} disabled={!activeProduct} />
                        </div>

                        {/* Logistics Fields */}
                        <div className="w-32 pl-2 border-l border-slate-200">
                            <Label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><Package className="h-3 w-3" /> Lote</Label>
                            <Input className="h-9 bg-white font-mono text-xs rounded-lg" placeholder="Auto" value={batchInput} onChange={e => setBatchInput(e.target.value)} disabled={!activeProduct} />
                        </div>
                        <div className="w-36">
                            <Label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Vencimiento</Label>
                            <Input type="date" className="h-9 bg-white text-xs rounded-lg" value={expiryInput} onChange={e => setExpiryInput(e.target.value)} disabled={!activeProduct} />
                        </div>

                        {/* Totals Preview */}
                        <div className="flex-1 text-right flex flex-col justify-end px-2">
                            <div className="text-[10px] text-slate-400">Total Línea</div>
                            <div className="text-lg font-bold text-slate-900">${calculatedTotal.toFixed(2)}</div>
                        </div>

                        <Button className="h-9 px-6 bg-slate-900 text-white rounded-lg hover:bg-black" disabled={!activeProduct} onClick={addItemToQueue}>
                            <Plus className="h-4 w-4 mr-1" /> Agregar
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left font-bold text-slate-400 text-[10px] uppercase">SKU / Lote</th>
                                <th className="px-6 py-3 text-left font-bold text-slate-400 text-[10px] uppercase">Producto</th>
                                <th className="px-6 py-3 text-center font-bold text-slate-400 text-[10px] uppercase">Cant</th>
                                <th className="px-6 py-3 text-right font-bold text-slate-400 text-[10px] uppercase">Costo Final</th>
                                <th className="px-6 py-3 text-right font-bold text-slate-400 text-[10px] uppercase">Total</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 group">
                                    <td className="px-6 py-3">
                                        <div className="font-mono text-xs font-bold text-slate-700">{item.sku}</div>
                                        {item.batchNumber && <div className="text-[10px] text-blue-600 bg-blue-50 inline-block px-1.5 rounded-md mt-1">{item.batchNumber}</div>}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-slate-900">{item.productName}</div>
                                        {item.expiresAt && <div className="text-[10px] text-amber-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Exp: {item.expiresAt}</div>}
                                    </td>
                                    <td className="px-6 py-3 text-center text-slate-600">{item.quantity}</td>
                                    <td className="px-6 py-3 text-right text-slate-600">
                                        <div>${item.unitCost.toFixed(2)}</div>
                                        <div className="text-[10px] text-slate-400">
                                            Base: {item.basePrice} | Desc: {item.discount} | IVA: {item.taxRate}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-900">${item.totalLine.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => removeFromQueue(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400 text-sm">Escanea productos para comenzar...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-slate-500 text-sm"><span className="font-bold text-slate-900">{globalCount}</span> líneas</div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Total a Pagar</div>
                            <div className="text-3xl font-bold text-slate-900">${globalTotal.toFixed(2)}</div>
                        </div>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-lg px-8" onClick={handleConfirm} disabled={isLoading || items.length === 0}>
                            {isLoading ? <Loader2 className="animate-spin" /> : "Confirmar Ingreso"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
