"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    FileText,
    Search,
    Trash2,
    Calendar as CalendarIcon,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Building2,
    DollarSign,
    CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Services
import { ProductsService } from "@/services/products.service"
import { PurchaseOrdersService } from "@/services/purchase-orders.service"
import { SuppliersService } from "@/services/suppliers.service"

interface OrderItem {
    id: string
    productId: string
    productName: string
    sku: string
    quantity: number
    unitCost: number
    taxRate: number
}

export default function NewPurchaseOrderPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [suppliers, setSuppliers] = useState<any[]>([])

    // Header State
    const [supplierId, setSupplierId] = useState("")
    const [deliveryDate, setDeliveryDate] = useState("")
    const [paymentTerms, setPaymentTerms] = useState("30")

    // Staging Area
    const [searchTerm, setSearchTerm] = useState("")
    const [activeProduct, setActiveProduct] = useState<any>(null)
    const [qtyInput, setQtyInput] = useState(1)
    const [costInput, setCostInput] = useState(0)

    // Order Items
    const [items, setItems] = useState<OrderItem[]>([])

    // Refs
    const qtyRef = useRef<HTMLInputElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    // Load Suppliers
    useEffect(() => {
        SuppliersService.getAll().then(setSuppliers).catch(console.error)
    }, [])

    // Search Logic
    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (!searchTerm.trim()) return

            try {
                const product = await ProductsService.findByTerm(searchTerm)
                if (product) {
                    setActiveProduct(product)
                    setCostInput(product.costAverage || 0)
                    setSearchTerm("")
                    setTimeout(() => qtyRef.current?.focus(), 50)
                } else {
                    toast({ variant: "destructive", title: "No encontrado", description: "Producto no encontrado." })
                    setActiveProduct(null)
                }
            } catch (error) {
                console.error(error)
            }
        }
    }

    const addItem = () => {
        if (!activeProduct) return

        const newItem: OrderItem = {
            id: crypto.randomUUID(),
            productId: activeProduct.id,
            productName: activeProduct.name,
            sku: activeProduct.sku,
            quantity: qtyInput,
            unitCost: costInput,
            taxRate: 0.15 // Default tax
        }

        setItems(prev => [...prev, newItem])

        // Reset Staging
        setActiveProduct(null)
        setQtyInput(1)
        setCostInput(0)
        searchRef.current?.focus()
    }

    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id))

    const handleConfirm = async () => {
        if (!supplierId || items.length === 0) return

        setIsLoading(true)
        try {
            const order = await PurchaseOrdersService.create({
                supplierId,
                expectedDeliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
                paymentTerms
            } as any)

            await Promise.all(items.map(item =>
                PurchaseOrdersService.addItem(order.id, item)
            ))

            toast({ title: "Orden Creada", description: "La orden de compra ha sido enviada." })
            router.push('/inventory')
        } catch (error) {
            console.error(error)
            toast({ variant: "destructive", title: "Error", description: "No se pudo crear la orden." })
        } finally {
            setIsLoading(false)
        }
    }

    // Totals
    const subtotal = items.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0)
    const tax = subtotal * 0.15
    const total = subtotal + tax

    return (
        <div className="flex h-full flex-col bg-slate-50/50 p-6 space-y-6 overflow-hidden">

            {/* 1. Header Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 shrink-0">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 rounded-xl text-slate-400 hover:text-slate-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="bg-blue-50 p-2 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </span>
                            Nueva Orden de Compra
                        </h1>
                        <p className="text-slate-500 text-sm ml-12">Reabastecimiento de inventario</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 ml-12">
                    <div className="md:col-span-5 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Entrega</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="date"
                                className="pl-10 bg-slate-50 border-slate-200 h-10 rounded-xl"
                                value={deliveryDate}
                                onChange={e => setDeliveryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-4 space-y-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Términos Pago</Label>
                        <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Contado</SelectItem>
                                <SelectItem value="30">Crédito 30 días</SelectItem>
                                <SelectItem value="60">Crédito 60 días</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* 2. Workspace Card */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100">

                {/* Search Strip */}
                <div className="p-5 border-b border-slate-50 flex gap-4 items-end bg-white">
                    <div className="w-full md:flex-[3] space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buscar Producto</Label>
                        <div className="relative">
                            <Search className={`absolute left-3 top-3 h-4 w-4 ${activeProduct ? 'text-blue-500' : 'text-slate-400'}`} />
                            <Input
                                ref={searchRef}
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); if (!e.target.value) setActiveProduct(null) }}
                                onKeyDown={handleSearch}
                                className={cn(
                                    "pl-10 h-10 transition-all rounded-xl",
                                    activeProduct ? "border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/20 text-blue-900 font-semibold" : "bg-slate-50 border-slate-200"
                                )}
                                placeholder="Escanear o buscar..."
                            />
                        </div>
                    </div>

                    <div className="w-full md:flex-[3] space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producto Seleccionado</Label>
                        <div className={cn(
                            "h-10 px-4 rounded-xl border flex items-center text-sm transition-colors",
                            activeProduct ? "bg-blue-50/30 border-blue-200 text-slate-900 font-medium" : "bg-slate-50 border-slate-200 text-slate-400 italic"
                        )}>
                            {activeProduct ? activeProduct.name : "..."}
                        </div>
                    </div>

                    <div className="w-24 space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cant.</Label>
                        <Input
                            ref={qtyRef}
                            type="number"
                            value={qtyInput}
                            onChange={e => setQtyInput(Number(e.target.value))}
                            className="h-10 text-center font-bold bg-slate-50 border-slate-200 rounded-xl"
                            disabled={!activeProduct}
                            onKeyDown={e => e.key === 'Enter' && addItem()}
                        />
                    </div>

                    <div className="w-32 space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo U.</Label>
                        <Input
                            type="number"
                            value={costInput}
                            onChange={e => setCostInput(Number(e.target.value))}
                            className="h-10 text-right bg-slate-50 border-slate-200 rounded-xl"
                            disabled={!activeProduct}
                            onKeyDown={e => e.key === 'Enter' && addItem()}
                        />
                    </div>

                    <div className="pt-0 pb-0.5 pl-2">
                        <Button
                            className={cn("h-10 px-6 rounded-xl font-bold uppercase tracking-wide text-xs", activeProduct ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-300")}
                            disabled={!activeProduct}
                            onClick={addItem}
                        >
                            Agregar
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider">Cant</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-400 text-[10px] uppercase tracking-wider">Costo U.</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-400 text-[10px] uppercase tracking-wider">Total</th>
                                <th className="px-4 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center text-slate-300">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-50 p-6 rounded-full mb-4 ring-1 ring-slate-100">
                                                <AlertCircle className="h-10 w-10 opacity-20" />
                                            </div>
                                            <p className="font-medium text-slate-400">Orden vacía</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-700">{item.productName}</div>
                                        <div className="text-xs text-slate-400 font-mono">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-700">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-slate-600">${item.unitCost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">${(item.quantity * item.unitCost).toFixed(2)}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="bg-white px-8 py-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-10">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Items</div>
                            <div className="text-xl font-bold text-slate-700">{items.length}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subtotal</div>
                            <div className="text-xl font-bold text-slate-700">${subtotal.toFixed(2)}</div>
                        </div>
                        <div className="text-right pl-8 border-l border-slate-100">
                            <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Total</div>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight">${total.toFixed(2)}</div>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 shadow-lg shadow-blue-500/20 rounded-xl"
                        disabled={items.length === 0 || isLoading}
                        onClick={handleConfirm}
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Orden"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
