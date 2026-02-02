import { promises as fs } from "fs"
import { Metadata } from "next"
import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Download,
    Plus,
    Search,
    ArrowRightLeft,
    ClipboardCheck,
    FileText,
    ArrowDownToLine,
    Filter
} from "lucide-react"
import { ProductInboundModal } from "@/components/modules/inventory/product-inbound-modal"

export const metadata: Metadata = {
    title: "Inventario | Antigravity SaaS",
    description: "Gestión avanzada de inventario",
}

// Mock Data Generator (Enhanced)
async function getData() {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return [
        { id: "728ed52f", sku: "PROD-001", name: "Laptop Gamer X1", stockLevel: 45, minStock: 10, price: 1250.00, status: "In Stock", category: "Electrónica" },
        { id: "489e1d42", sku: "ACC-099", name: "Mouse Wireless Pro", stockLevel: 5, minStock: 15, price: 49.99, status: "Low Stock", category: "Accesorios" },
        { id: "99aa82b1", sku: "PART-102", name: "Monitor 27 4K", stockLevel: 0, minStock: 5, price: 320.00, status: "Out of Stock", category: "Monitores" },
        ...Array.from({ length: 15 }).map((_, i) => ({
            id: `mock-${i}`,
            sku: `MOCK-${100 + i}`,
            name: `Componente Premium ${i + 1}`,
            stockLevel: Math.floor(Math.random() * 100),
            minStock: 10,
            price: Math.floor(Math.random() * 500) + 10,
            status: Math.random() > 0.8 ? "Low Stock" : "In Stock",
            category: ["Partes", "Accesorios", "Cables"][Math.floor(Math.random() * 3)]
        }))
    ] as any[]
}

export default async function InventoryPage() {
    const data = await getData()

    return (
        <div className="flex h-full flex-col gap-6">
            {/* 1. Header Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario General</h1>
                <p className="text-slate-500 text-base">Gestión centralizada de productos y existencias.</p>
            </div>

            {/* 2. Action Buttons Bar */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <ProductInboundModal>
                    <ActionButton
                        icon={ArrowDownToLine}
                        label="Ingreso de Productos"
                        desc="Registrar entradas"
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                </ProductInboundModal>
                <ActionButton
                    icon={ArrowRightLeft}
                    label="Traslado"
                    desc="Entre bodegas"
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <ActionButton
                    icon={Plus}
                    label="Nuevo Producto"
                    desc="Crear SKU"
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    primary
                />
                <ActionButton
                    icon={ClipboardCheck}
                    label="Realizar Auditoría"
                    desc="Verificar stock"
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <ActionButton
                    icon={FileText}
                    label="Orden de Compra"
                    desc="Generar pedido"
                    color="text-slate-600"
                    bg="bg-slate-50"
                />
            </div>

            {/* 3. Main Data Surface (Unified Search + Table) */}
            <Card className="border-none shadow-sm overflow-hidden rounded-xl bg-white">
                <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">Todos los productos</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{data.length}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-slate-600">
                            <Download className="mr-2 h-3.5 w-3.5" /> Exportar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <DataTable
                            columns={columns}
                            data={data}
                            searchKey="name"
                            customFilters={
                                <div className="flex gap-2">
                                    <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>Proveedor</option>
                                        <option>TechWorld Inc.</option>
                                        <option>Global Supplies</option>
                                    </select>
                                    <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>Categoría</option>
                                        <option>Electrónica</option>
                                        <option>Accesorios</option>
                                        <option>Monitores</option>
                                    </select>
                                </div>
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ActionButton({ icon: Icon, label, desc, color, bg, primary }: any) {
    return (
        <button className={`group flex items-center gap-4 rounded-xl border p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-95 ${primary ? 'border-primary/20 bg-primary/5' : 'border-slate-100 bg-white'}`}>
            <div className={`rounded-lg p-2.5 ${bg} ${color} transition-colors group-hover:bg-white`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className={`font-bold text-sm ${primary ? 'text-primary' : 'text-slate-700'}`}>{label}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{desc}</p>
            </div>
        </button>
    )
}
