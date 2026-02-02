"use client"

import { useState, useEffect } from "react"
import {
    ClipboardCheck,
    Warehouse,
    AlertCircle,
    Play,
    Search,
    Save,
    RotateCcw,
    CheckCircle2
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface CreateAuditModalProps {
    children?: React.ReactNode
}

// Mock Data for "Batch" simulation
const MOCK_INVENTORY = [
    { id: 1, sku: "VOD-GREY-750", name: "Vodka Grey Goose 750ml", batch: "L-2023-A", expiry: "2025-12-01", systemStock: 24 },
    { id: 2, sku: "VOD-GREY-750", name: "Vodka Grey Goose 750ml", batch: "L-2024-B", expiry: "2026-06-15", systemStock: 12 },
    { id: 3, sku: "RUM-ZAC-23", name: "Ron Zacapa 23 Años", batch: "BATCH-001", expiry: null, systemStock: 8 },
    { id: 4, sku: "MIX-COK-355", name: "Coca Cola Lata 355ml", batch: "L-JAN-01", expiry: "2024-08-01", systemStock: 150 },
    { id: 5, sku: "MIX-COK-355", name: "Coca Cola Lata 355ml", batch: "L-FEB-02", expiry: "2024-09-01", systemStock: 85 },
    { id: 6, sku: "AGU-MAN-500", name: "Agua Manantial 500ml", batch: "W-2099", expiry: "2025-01-01", systemStock: 200 },
]

export function CreateAuditModal({ children }: CreateAuditModalProps) {
    const [open, setOpen] = useState(false)
    const [isBlind, setIsBlind] = useState(false)
    const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>(undefined)

    // State to simulate "Loading" items when warehouse is selected
    const [items, setItems] = useState<typeof MOCK_INVENTORY>([])
    const [isLoading, setIsLoading] = useState(false)

    // Helper for checkbox
    const handleCheck = (setter: (val: boolean) => void) => (checked: boolean | string) => {
        if (typeof checked === 'boolean') setter(checked)
    }

    // Effect: Load items when warehouse changes
    useEffect(() => {
        if (selectedWarehouse) {
            setIsLoading(true)
            // Simulate network delay
            setTimeout(() => {
                setItems(MOCK_INVENTORY)
                setIsLoading(false)
            }, 600)
        } else {
            setItems([])
        }
    }, [selectedWarehouse])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}

            <DialogContent className="w-full max-w-[95vw] lg:max-w-6xl p-0 flex flex-col gap-0 rounded-2xl border-none shadow-2xl bg-white overflow-hidden outline-none h-[85vh]">

                {/* 1. HEADER: Horizontal Configuration (Wide) */}
                <div className="bg-white px-6 py-5 border-b border-slate-100 shrink-0">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shadow-sm">
                                <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <div>
                                Auditoría de Inventario
                                <span className="block text-sm font-normal text-slate-400 mt-0.5">
                                    Gestión masiva por lotes y ubicación.
                                </span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Horizontal Controls Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre Referencia</Label>
                                <Input
                                    defaultValue={`AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`}
                                    className="h-10 bg-white border-slate-200 font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bodega Objetivo</Label>
                                <Select onValueChange={setSelectedWarehouse}>
                                    <SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Warehouse className="w-4 h-4 text-slate-400" />
                                            <SelectValue placeholder="Seleccionar ubicación..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="main">Bodega Central A1</SelectItem>
                                        <SelectItem value="kitchen">Depósito Cocina</SelectItem>
                                        <SelectItem value="bar">Barra Principal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3 h-10 mt-auto pb-1">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent hover:bg-white hover:border-slate-200 transition-all cursor-pointer w-full" onClick={() => setIsBlind(!isBlind)}>
                                    <Checkbox checked={isBlind} onCheckedChange={handleCheck(setIsBlind)} id="blind" className="data-[state=checked]:bg-amber-600 border-slate-300" />
                                    <div className="space-y-0 leading-none">
                                        <Label htmlFor="blind" className="font-semibold text-slate-700 cursor-pointer text-sm">Conteo Ciego</Label>
                                        <p className="text-[10px] text-slate-400">Ocultar stock teórico</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CONTENT: Smart Grid (Batch Processing) */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">

                    {/* Toolbar Table */}
                    <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <Input placeholder="Buscar SKU o Lote..." className="pl-9 h-9 w-64 bg-white text-sm" />
                            </div>
                            <Separator orientation="vertical" className="h-6" />
                            <div className="text-sm text-slate-500">
                                <span className="font-medium text-slate-900">{items.length}</span> Lotes Encontrados
                            </div>
                        </div>
                        {selectedWarehouse && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 pr-3 py-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Snapshot de Inventario Activo
                            </Badge>
                        )}
                    </div>

                    {/* Data Grid */}
                    <ScrollArea className="flex-1 w-full">
                        {!selectedWarehouse ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[300px]">
                                <div className="p-4 bg-slate-100 rounded-full">
                                    <Warehouse className="w-8 h-8 opacity-50" />
                                </div>
                                <p>Selecciona una bodega para cargar los lotes disponibles.</p>
                            </div>
                        ) : isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[300px]">
                                <RotateCcw className="w-8 h-8 animate-spin text-amber-500" />
                                <p>Cargando snapshot del sistema...</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0 z-10 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-slate-200 w-[15%]">SKU / Código</th>
                                        <th className="px-6 py-3 border-b border-slate-200 w-[25%]">Producto</th>
                                        <th className="px-6 py-3 border-b border-slate-200 w-[15%]">Lote ID</th>
                                        <th className="px-6 py-3 border-b border-slate-200 w-[15%] text-center">
                                            {isBlind ? "Stock Sistema" : "Stock Sistema"}
                                        </th>
                                        <th className="px-6 py-3 border-b border-slate-200 w-[20%] text-center bg-amber-50/50 border-amber-100 text-amber-700">Cant. Real (Físico)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-3 font-mono text-slate-600 font-medium">
                                                {item.sku}
                                            </td>
                                            <td className="px-6 py-3 text-slate-700">
                                                <div className="font-medium">{item.name}</div>
                                                {item.expiry && <div className="text-[10px] text-slate-400">Vence: {item.expiry}</div>}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge variant="secondary" className="font-mono text-[10px] text-slate-500 bg-slate-100">
                                                    {item.batch}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {isBlind ? (
                                                    <span className="text-slate-300 text-xs italic">---</span>
                                                ) : (
                                                    <span className="font-semibold text-slate-700">{item.systemStock}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-2 bg-amber-50/10 group-hover:bg-amber-50/30 transition-colors border-l border-r border-transparent group-hover:border-slate-100">
                                                <div className="flex justify-center">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-9 w-24 text-center bg-white border-slate-200 focus:border-amber-400 focus:ring-amber-200"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </ScrollArea>

                </div>

                {/* 3. FOOTER: Action Bar */}
                <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Los cambios no guardados se perderán si cierras esta ventana.</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 rounded-xl border-slate-200">
                            Cancelar
                        </Button>
                        <Button className="h-11 px-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-500/20" disabled={!selectedWarehouse}>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Conteo
                        </Button>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
