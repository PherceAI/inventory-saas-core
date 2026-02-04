"use client"

import { useState, useRef, useEffect } from "react"
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    User,
    Percent,
    ScanBarcode,
    Package,
    Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ProductsService } from "@/services/products.service"
import Link from "next/link"

interface Product {
    id: string
    name: string
    price: number
    category: string
    image: string
    stock: number
}

interface CartItem {
    id: string
    product: Product
    quantity: number
}

export default function PosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<string[]>(["All"])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [cart, setCart] = useState<CartItem[]>([])
    const [customer, setCustomer] = useState("Público General")
    const scanInputRef = useRef<HTMLInputElement>(null)

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true)
                const response = await ProductsService.getAll({ limit: 100 })
                const productsData = response.data || response || []

                // Map API response to POS product format
                const mapped: Product[] = productsData.map((p: any) => {
                    const stockLevel = p.batches?.reduce(
                        (sum: number, batch: any) => sum + Number(batch.quantityCurrent || 0),
                        0
                    ) ?? p.stockLevel ?? 0

                    return {
                        id: p.id,
                        name: p.name,
                        price: Number(p.priceDefault) || Number(p.costAverage) || 0,
                        category: p.category?.name || 'Sin categoría',
                        image: getProductEmoji(p.category?.name || ''),
                        stock: stockLevel
                    }
                })

                setProducts(mapped)

                // Extract unique categories
                const uniqueCategories = ['All', ...new Set(mapped.map(p => p.category))]
                setCategories(uniqueCategories)
            } catch (error) {
                console.error('Error fetching products:', error)
                setProducts([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [])

    // Helper to assign emoji based on category
    const getProductEmoji = (category: string): string => {
        const emojiMap: Record<string, string> = {
            'Electrónica': '💻',
            'Accesorios': '🖱️',
            'Monitores': '🖥️',
            'Audio': '🎧',
            'Cámaras': '📷',
            'Muebles': '💺',
            'Alimentos': '🍔',
            'Bebidas': '🥤',
            'Limpieza': '🧹',
            'Oficina': '📎',
        }
        return emojiMap[category] || '📦'
    }

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.id.includes(searchQuery)
        const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    // Cart Actions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { id: crypto.randomUUID(), product, quantity: 1 }]
        })
    }

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId))
    }

    const clearCart = () => setCart([])

    // Calculations
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
    const taxRate = 0.16
    const tax = subtotal * taxRate
    const total = subtotal + tax

    // Empty state when no products
    if (!isLoading && products.length === 0) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.16))] w-full items-center justify-center bg-slate-50/50">
                <div className="text-center max-w-md p-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">No hay productos configurados</h2>
                    <p className="text-slate-500 mb-6">
                        Para usar el Punto de Venta, primero necesitas agregar productos a tu inventario.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button asChild className="gap-2">
                            <Link href="/dashboard/products/new">
                                <Plus className="h-4 w-4" />
                                Agregar Productos
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="gap-2">
                            <Link href="/dashboard/inventory">
                                <Settings className="h-4 w-4" />
                                Ir a Inventario
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-slate-50/50 overflow-hidden">
                <div className="flex-1 flex flex-col border-r border-slate-200 h-full overflow-hidden">
                    <div className="bg-white p-4 border-b border-slate-100 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-8 w-20" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <Skeleton key={i} className="h-48" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-[400px] bg-white p-4">
                    <Skeleton className="h-12 w-full mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-slate-50/50 overflow-hidden">

            {/* LEFT SIDE: PRODUCT CATALOG (65% width) */}
            <div className="flex-1 flex flex-col border-r border-slate-200 h-full overflow-hidden">

                {/* 1. Top Bar: Search & Categories */}
                <div className="bg-white p-6 border-b border-slate-100 flex-shrink-0 space-y-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                ref={scanInputRef}
                                className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-slate-900 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)] ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow bg-slate-50/50 focus:bg-white"
                                placeholder="Buscar por nombre, SKU o escanear código..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center">
                                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 h-7 font-mono text-[10px] font-medium text-slate-500">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 p-0 text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 shadow-sm">
                            <ScanBarcode className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border",
                                    selectedCategory === cat
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                {cat === 'All' ? 'Todo' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="group relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all text-left flex flex-col h-52 active:bg-slate-50"
                            >
                                <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                    Stock: {product.stock}
                                </div>
                                <div className="flex-1 flex items-center justify-center text-5xl mb-2">
                                    {product.image}
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{product.category}</div>
                                    <div className="font-semibold text-slate-800 line-clamp-2 leading-tight mb-2 text-sm">{product.name}</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
                                        <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-400">
                                <Search className="h-10 w-10 mb-2 opacity-20" />
                                <p>No se encontraron productos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: CART / TICKET (35% width) */}
            <div className="w-[400px] bg-white flex flex-col border-l border-slate-200 z-10 flex-shrink-0 h-full shadow-sm">

                {/* 1. Customer Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cliente</div>
                            <div className="font-semibold text-slate-900 cursor-pointer hover:underline decoration-dashed decoration-slate-300 underline-offset-4 text-sm">
                                {customer}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 h-8 w-8">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* 2. Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 content-start space-y-2 bg-white">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4">
                            <ShoppingCart className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-medium text-center max-w-[150px]">Carrito vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center group p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                <div className="h-10 w-10 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-center text-lg">
                                    {item.product.image}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-900 text-sm truncate">{item.product.name}</div>
                                    <div className="text-xs text-slate-500">${Number(item.product.price).toFixed(2)} x {item.quantity}</div>
                                </div>
                                <div className="font-bold text-slate-800 text-sm">
                                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="h-6 w-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="h-6 w-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 ml-1"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 3. Calculations & Payment Section */}
                <div className="bg-white p-6 border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Subtotal</span>
                            <span className="font-bold text-slate-700">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">IVA (16%)</span>
                            <span className="font-bold text-slate-700">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <span className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5" /> Descuento aplicado</span>
                            <span>-$0.00</span>
                        </div>
                        <Separator className="bg-slate-100 my-4" />
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total a pagar</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <Button variant="outline" className="h-14 col-span-1 rounded-xl border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors" onClick={clearCart}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button className="h-14 col-span-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5">
                            <span className="text-xs font-medium text-blue-100 tracking-wide uppercase">Confirmar Cobro</span>
                            <span className="text-lg font-bold">Pagar ${total.toFixed(2)}</span>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
