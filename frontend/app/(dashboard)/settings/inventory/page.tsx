"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ArrowLeft,
    Building2,
    Plus,
    Trash2,
    Loader2,
    MapPin,
    Tag,
    Star,
    Warehouse as WarehouseIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { WarehousesService, Warehouse, CreateWarehouseDto } from "@/services/warehouses.service"

export default function InventorySettingsPage() {
    const router = useRouter()
    const { toast } = useToast()

    // State
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Form State
    const [formData, setFormData] = useState<CreateWarehouseDto>({
        name: "",
        code: "",
        address: "",
        isDefault: false
    })

    // Load warehouses
    useEffect(() => {
        loadWarehouses()
    }, [])

    const loadWarehouses = async () => {
        try {
            setIsLoading(true)
            const data = await WarehousesService.getAll()
            setWarehouses(data || [])
        } catch (error) {
            console.error("Error loading warehouses", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar las bodegas."
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast({
                variant: "destructive",
                title: "Campo requerido",
                description: "El nombre de la bodega es obligatorio."
            })
            return
        }

        setIsCreating(true)
        try {
            await WarehousesService.create(formData)
            toast({
                title: "Bodega creada",
                description: `"${formData.name}" ha sido agregada exitosamente.`
            })
            setFormData({ name: "", code: "", address: "", isDefault: false })
            setShowForm(false)
            loadWarehouses()
        } catch (error: any) {
            console.error("Error creating warehouse", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error?.response?.data?.message || "No se pudo crear la bodega."
            })
        } finally {
            setIsCreating(false)
        }
    }

    const resetForm = () => {
        setFormData({ name: "", code: "", address: "", isDefault: false })
        setShowForm(false)
    }

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/settings')}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <span className="bg-amber-50 p-2.5 rounded-xl">
                            <WarehouseIcon className="h-6 w-6 text-amber-600" />
                        </span>
                        Reglas de Inventario
                    </h1>
                    <p className="text-slate-500 mt-1 ml-14">Límites de stock, alertas y preferencias de bodega.</p>
                </div>
            </div>

            {/* Warehouses Section */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-slate-400" />
                                Bodegas
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Administra las ubicaciones de almacenamiento de tu inventario.
                            </CardDescription>
                        </div>
                        {!showForm && (
                            <Button
                                onClick={() => setShowForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Bodega
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Create Form */}
                    {showForm && (
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 space-y-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800">Nueva Bodega</h3>
                                <button
                                    onClick={resetForm}
                                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag className="w-3 h-3" />
                                        Nombre *
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Bodega Central"
                                        className="h-10 rounded-xl bg-white border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                                    />
                                </div>

                                {/* Code */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag className="w-3 h-3" />
                                        Código
                                        <span className="text-[10px] font-normal text-slate-300">(Opcional)</span>
                                    </Label>
                                    <Input
                                        value={formData.code || ""}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Ej: BOD-001"
                                        className="h-10 rounded-xl bg-white border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    Dirección
                                    <span className="text-[10px] font-normal text-slate-300">(Opcional)</span>
                                </Label>
                                <Input
                                    value={formData.address || ""}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Ej: Av. Principal #123, Zona Industrial"
                                    className="h-10 rounded-xl bg-white border-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                                />
                            </div>

                            {/* Is Default */}
                            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Bodega por defecto</p>
                                        <p className="text-xs text-slate-400">Se usará como ubicación principal para nuevos productos.</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.isDefault || false}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                    className="rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={isCreating || !formData.name.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        "Guardar Bodega"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Warehouses List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No hay bodegas registradas</p>
                            <p className="text-sm text-slate-400 mt-1">Crea tu primera bodega para comenzar a organizar tu inventario.</p>
                            {!showForm && (
                                <Button
                                    onClick={() => setShowForm(true)}
                                    variant="outline"
                                    className="mt-4 rounded-xl"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear Bodega
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {warehouses.map((warehouse) => (
                                <div
                                    key={warehouse.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-colors",
                                        warehouse.isDefault
                                            ? "bg-amber-50/50 border-amber-200"
                                            : "bg-white border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-2.5 rounded-lg",
                                            warehouse.isDefault ? "bg-amber-100" : "bg-slate-100"
                                        )}>
                                            <Building2 className={cn(
                                                "w-5 h-5",
                                                warehouse.isDefault ? "text-amber-600" : "text-slate-400"
                                            )} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-slate-800">{warehouse.name}</h4>
                                                {warehouse.isDefault && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                                                        Por Defecto
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {warehouse.code && (
                                                    <span className="text-xs font-mono text-slate-400">{warehouse.code}</span>
                                                )}
                                                {warehouse.address && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {warehouse.address}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {!warehouse.isDefault && (
                                        <button
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar bodega"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Future: Stock Alerts Section */}
            <Card className="border-slate-200 shadow-sm opacity-60">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">Alertas de Stock</CardTitle>
                    <CardDescription>
                        Configura notificaciones cuando el inventario esté bajo. <span className="text-slate-400">(Próximamente)</span>
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}
