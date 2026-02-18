"use client"

import { useState, useEffect } from "react"
import {
    FileText,
    Search,
    Trash2,
    CalendarIcon,
    CreditCard,
    Building2,
    ShoppingCart,
    ArrowRight,
    Sparkles,
    AlertTriangle,
    Package,
    Store
} from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Services
import { SuppliersService, Supplier } from "@/services/suppliers.service"
import { ProductsService, Product } from "@/services/products.service"
import { PurchaseOrdersService } from "@/services/purchase-orders.service"

interface CreatePurchaseOrderModalProps {
    children?: React.ReactNode
}

// Extended Product Types for frontend display
interface ProcessedProduct extends Product {
    currentStock: number;
    // batches is handled inside processing
}

type OrderItem = {
    productId: string
    sku: string
    name: string
    quantity: number
    unitCost: number
    taxRate: number
    discount: number
}

export function CreatePurchaseOrderModal({ children }: CreatePurchaseOrderModalProps) {
    const [open, setOpen] = useState(false)
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [selectedSupplier, setSelectedSupplier] = useState<string>("")
    const [items, setItems] = useState<OrderItem[]>([])

    // Catalog state
    const [availableProducts, setAvailableProducts] = useState<ProcessedProduct[]>([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(false)

    // Fetch Suppliers on Open
    useEffect(() => {
        if (open) {
            SuppliersService.getAll().then(setSuppliers).catch(console.error)
        }
    }, [open])

    // Fetch Products when Supplier Changes
    useEffect(() => {
        if (!selectedSupplier) {
            setAvailableProducts([])
            return
        }

        setIsLoadingProducts(true)
        // Fetch all products (limit 100 for MVP) and filter client-side if needed
        // Note: Real backend should have filtering by supplier or "Low Stock"
        ProductsService.getAll({ limit: 100 }).then(response => {
            const processed: ProcessedProduct[] = response.data.map((p: any) => ({
                ...p,
                // Calculate stock from batches
                currentStock: p.batches?.reduce((sum: number, b: any) => sum + Number(b.quantityCurrent), 0) || 0,
                cost: Number(p.costAverage) || 0, // Ensure numeric
                stockMin: Number(p.stockMin) || 0
            }))

            // Filter by preferred supplier if possible, OR just show all but prioritize low stock
            // For now, we show all products (as you might buy from anyone) but we could sort/filter
            // Let's filter slightly to match the "Smart" feel: 
            // If the product has a preferredSupplier, match it. If not, include it.
            const supplierProducts = processed.filter(p =>
                !p.preferredSupplier || p.preferredSupplier.id === selectedSupplier
            )

            setAvailableProducts(supplierProducts)
        }).catch(console.error)
            .finally(() => setIsLoadingProducts(false))
    }, [selectedSupplier])

    // Derived state
    const lowStockCount = availableProducts.filter(p => p.currentStock <= p.stockMin).length

    // Function to "Magic Fill"
    const autoFillOrder = () => {
        const LOW_STOCK_ITEMS = availableProducts
            .filter(p => p.currentStock <= p.stockMin)
            .map(p => ({
                productId: p.id,
                sku: p.sku,
                name: p.name,
                quantity: Math.max(1, (p.stockMin - p.currentStock) + 5), // Basic formula
                unitCost: Number(p.costAverage),
                taxRate: 0.12, // Default tax
                discount: 0
            }))

        // Merge with existing items to avoid duplicates
        const newItems = [...items]
        LOW_STOCK_ITEMS.forEach(newItem => {
            if (!newItems.find(i => i.productId === newItem.productId)) {
                newItems.push(newItem)
            }
        })
        setItems(newItems)
    }

    const addItem = (product: ProcessedProduct) => {
        const existing = items.find(i => i.productId === product.id)
        if (existing) return;

        setItems([...items, {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
            unitCost: Number(product.costAverage),
            taxRate: 0.12,
            discount: 0
        }])
    }

    const removeItem = (productId: string) => {
        setItems(items.filter(i => i.productId !== productId))
    }

    const updateItem = (productId: string, field: keyof OrderItem, value: number) => {
        setItems(items.map(i =>
            i.productId === productId ? { ...i, [field]: value } : i
        ))
    }

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0)
    const totalTax = items.reduce((acc, item) => acc + (item.quantity * item.unitCost * item.taxRate), 0)
    const total = subtotal + totalTax

    // Handle Confirm Order
    const handleConfirmOrder = async () => {
        if (!selectedSupplier || items.length === 0) return

        try {
            // 1. Create DRAFT Order
            const order = await PurchaseOrdersService.create({
                supplierId: selectedSupplier,
                notes: "Generated via Smart Order UI",
                // Dates and payment terms could be added here
            })

            // 2. Add Items
            // Use Promise.all to add items in parallel
            await Promise.all(items.map(item =>
                PurchaseOrdersService.addItem(order.id, {
                    productId: item.productId,
                    quantityOrdered: item.quantity,
                    unitPrice: item.unitCost,
                    taxRate: item.taxRate
                })
            ))

            // 3. Send Order (Optional: User might want to keep it as DRAFT)
            // For now, we leave it as draft or send it based on flow. 
            // The "Generar Pedido" implies creation. Let's redirect to list or close modal.

            // alert("Order Created Successfully!")
            setOpen(false)
            setItems([])
            setSelectedSupplier("")

            // Optionally trigger refresh of parent list
            window.location.reload() // Simple reload for MVP

        } catch (error) {
            console.error("Failed to create order", error)
            alert("Error creating order. Please try again.")
        }
    }

    useEffect(() => {
        if (!open) {
            setItems([])
            setSelectedSupplier("")
            setAvailableProducts([])
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}

            <DialogContent className="w-screen h-screen max-w-none rounded-none border-none p-0 flex flex-col gap-0 bg-[#FAFAFA] shadow-none my-0">

                {/* 1. Header: CLEAN & MINIMAL */}
                <div className="bg-white px-10 py-8 shrink-0 z-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                        <DialogTitle className="text-3xl font-bold text-slate-800 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <Store className="h-8 w-8" />
                            </div>
                            <div>
                                Nueva Compra
                                <span className="block text-sm font-medium text-slate-400 mt-1 font-sans">
                                    Reabastecimiento inteligente de inventario
                                </span>
                            </div>
                        </DialogTitle>
                    </div>

                    {/* Main Selector - Floating style */}
                    <div className="bg-white p-2 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-4 pl-6">
                        <div className="flex-1 py-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Proveedor</Label>
                            <Select onValueChange={(val) => { setSelectedSupplier(val); setItems([]) }}>
                                <SelectTrigger className="h-10 border-none bg-transparent text-lg font-semibold text-slate-800 shadow-none px-0 focus:ring-0">
                                    <div className="flex items-center gap-2">
                                        <Building2 className={cn("w-5 h-5", selectedSupplier ? "text-emerald-500" : "text-slate-300")} />
                                        <SelectValue placeholder="Seleccione una empresa..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="border-none shadow-xl rounded-xl">
                                    {suppliers.length > 0 ? (
                                        suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="text-base py-3 cursor-pointer rounded-lg hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700">{s.name}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-slate-400">Cargando proveedores...</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Stats - Minimalist Divider */}
                        {selectedSupplier && (
                            <div className="flex gap-8 pr-8 items-center border-l border-slate-100 pl-8 py-1">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-800 leading-none">{availableProducts.length}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Productos</div>
                                </div>
                                <div className="text-right">
                                    <div className={cn("text-2xl font-bold leading-none", lowStockCount > 0 ? "text-amber-500" : "text-emerald-500")}>{lowStockCount}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Alertas</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Workspace */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT: Suggestions Sidebar */}
                    <div className="w-[400px] flex flex-col bg-[#FAFAFA] border-r border-slate-100">
                        {selectedSupplier && (
                            <>
                                <div className="px-6 py-4 flex justify-between items-end">
                                    <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-1">Catálogo Disponible</h3>
                                    {lowStockCount > 0 && items.length === 0 && (
                                        <Button
                                            onClick={autoFillOrder}
                                            variant="ghost"
                                            className="h-8 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                            Auto-llenar ({lowStockCount})
                                        </Button>
                                    )}
                                </div>

                                <ScrollArea className="flex-1 px-6 pb-6">
                                    <div className="space-y-3">
                                        {isLoadingProducts ? (
                                            <div className="text-center py-10 text-slate-400">Cargando catálogo...</div>
                                        ) : availableProducts.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400">No hay productos asociados</div>
                                        ) : availableProducts.map((p) => {
                                            const isLow = p.currentStock <= p.stockMin
                                            const isAdded = items.some(i => i.productId === p.id)

                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => addItem(p)}
                                                    className={cn(
                                                        "group relative flex flex-col gap-3 p-5 rounded-2xl transition-all cursor-pointer border-2",
                                                        isAdded
                                                            ? "bg-white border-emerald-500 shadow-md"
                                                            : "bg-white border-transparent hover:border-slate-200 shadow-sm hover:shadow-md"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className={cn("text-sm font-bold", isAdded ? "text-emerald-800" : "text-slate-700")}>{p.name}</span>
                                                        {isLow && (
                                                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 uppercase font-bold">Stock</span>
                                                                <span className={cn("font-medium", isLow ? "text-amber-500" : "text-slate-600")}>{p.currentStock} un.</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 uppercase font-bold">Mínimo</span>
                                                                <span className="font-medium text-slate-600">{p.stockMin} un.</span>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">${Number(p.costAverage).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </>
                        )}
                        {!selectedSupplier && (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
                                <Store className="w-12 h-12 mb-4 text-slate-400" />
                                <p className="font-medium text-slate-500">Esperando proveedor...</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Order Canvas */}
                    <div className="flex-1 flex flex-col bg-white relative z-0 rounded-tl-[30px] shadow-[-10px_-10px_30px_rgba(0,0,0,0.02)] overflow-hidden border-t border-l border-slate-50">
                        {/* Header Info */}
                        <div className="h-20 flex items-center px-8 justify-between shrink-0">
                            <div className="flex gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha Entrega</span>
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <CalendarIcon className="w-4 h-4 text-emerald-500" />
                                        30/05/2026
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pago</span>
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <CreditCard className="w-4 h-4 text-emerald-500" />
                                        Crédito 30 días
                                    </div>
                                </div>
                            </div>
                            {items.length > 0 && (
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 px-3 py-1">
                                    {items.length} ítems confirmados
                                </Badge>
                            )}
                        </div>

                        {/* Table Area */}
                        <div className="flex-1 overflow-auto px-8 relative">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-2 rotate-12">
                                        <ShoppingCart className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-400">Tu pedido aparecerá aquí</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="py-4 w-[40%] font-bold">Producto</th>
                                            <th className="py-4 w-[15%] text-center font-bold">Cant.</th>
                                            <th className="py-4 w-[15%] text-right font-bold">Costo</th>
                                            <th className="py-4 w-[20%] text-right font-bold">Total</th>
                                            <th className="w-[10%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items.map((item) => (
                                            <tr key={item.productId} className="group">
                                                <td className="py-5 pr-4">
                                                    <div className="font-bold text-slate-800 text-base">{item.name}</div>
                                                    <div className="text-[11px] text-slate-400 font-medium mt-1">{item.sku}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="h-10 w-20 text-center bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 font-bold text-slate-800 rounded-xl"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right text-slate-500 font-medium">
                                                    ${item.unitCost.toFixed(2)}
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-800 text-lg">
                                                    ${(item.quantity * item.unitCost * (1 + item.taxRate)).toFixed(2)}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => removeItem(item.productId)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer Totals (Clean & Big) */}
                        <div className="h-24 bg-white border-t border-slate-50 flex items-center justify-between px-10 shrink-0">
                            <div className="text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Estimado</span>
                                <div className="text-3xl font-bold text-slate-900 tracking-tight">${total.toFixed(2)}</div>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 rounded-2xl text-slate-500 font-bold hover:bg-slate-50">
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmOrder} className="h-12 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 transition-all duration-300" disabled={items.length === 0}>
                                    Confirmar Orden
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}
