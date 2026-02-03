"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Box,
    AlertTriangle,
    DollarSign,
    Save,
    Loader2,
    ArrowLeft
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductsService } from "@/services/products.service"
import { Card, CardContent } from "@/components/ui/card"

export default function NewProductPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        description: "",
        categoryId: "c1", // Mock default
        familyId: "",
        barcode: "",
        stockMin: 0,
        stockIdeal: 0,
        stockMax: 0,
        costAverage: 0,
        priceDefault: 0,
    })

    const [isService, setIsService] = useState(false)
    const [hasExpiry, setHasExpiry] = useState(false)
    const [trackBatches, setTrackBatches] = useState(true)

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        // Basic Validation
        if (!formData.name || !formData.sku) {
            alert("Por favor completa Nombre y SKU")
            return
        }

        try {
            setIsLoading(true)

            await ProductsService.create({
                ...formData,
                categoryId: "550e8400-e29b-41d4-a716-446655440000", // Placeholder valid UUID
                isService,
                hasExpiry,
                trackBatches,
                isActive: true
            } as any)

            // Success feedback
            alert("Producto creado exitosamente")
            router.push('/inventory')

        } catch (error: any) {
            console.error("Error creating product:", error)
            alert("Error al crear: " + (error.response?.data?.message || error.message))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-10 w-10 text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nuevo Producto</h1>
                    <p className="text-slate-500 text-sm">Registra un nuevo ítem en el catálogo maestro.</p>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="flex-1 border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0 h-full flex flex-col">

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-5xl mx-auto flex flex-col gap-8">

                            {/* Section: Identidad */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Box className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800">Identidad Básica</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-8 space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500">Nombre del Producto <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Ej: Harina de Trigo Premium"
                                            className="h-11 bg-white border-slate-200 focus:border-indigo-500 transition-colors"
                                            value={formData.name}
                                            onChange={e => handleChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500">SKU (Único) <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Ej: ING-004-A"
                                            className="h-11 bg-white border-slate-200 font-mono focus:border-indigo-500 transition-colors"
                                            value={formData.sku}
                                            onChange={e => handleChange('sku', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-12 space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500">Descripción</Label>
                                        <textarea
                                            placeholder="Detalles técnicos, presentación, uso..."
                                            className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
                                            value={formData.description}
                                            onChange={e => handleChange('description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Section: Inventario & Alertas */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                        <div className="p-2 bg-amber-50 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800">Alertas de Stock</h3>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-red-500 uppercase">Mínimo</Label>
                                            <Input
                                                type="number"
                                                className="h-10 text-center bg-red-50/30 border-red-100 focus:border-red-300 focus-visible:ring-red-200 font-medium text-red-700"
                                                value={formData.stockMin}
                                                onChange={e => handleChange('stockMin', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-blue-500 uppercase">Ideal</Label>
                                            <Input
                                                type="number"
                                                className="h-10 text-center bg-blue-50/30 border-blue-100 focus:border-blue-300 focus-visible:ring-blue-200 font-medium text-blue-700"
                                                value={formData.stockIdeal}
                                                onChange={e => handleChange('stockIdeal', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Máximo</Label>
                                            <Input
                                                type="number"
                                                className="h-10 text-center bg-white border-slate-200 focus:border-slate-400"
                                                value={formData.stockMax}
                                                onChange={e => handleChange('stockMax', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Section: Finanzas */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <DollarSign className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800">Finanzas Iniciales</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500">Costo Promedio</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-7 h-10 bg-white border-slate-200 font-medium text-slate-700"
                                                    value={formData.costAverage}
                                                    onChange={e => handleChange('costAverage', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500">Precio Venta</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-7 h-10 bg-white border-slate-200 font-medium text-slate-700"
                                                    value={formData.priceDefault}
                                                    onChange={e => handleChange('priceDefault', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                        <Button variant="outline" onClick={() => router.back()} className="h-11 px-6 rounded-xl border-slate-200 hover:bg-white text-slate-600 font-medium">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Producto
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
