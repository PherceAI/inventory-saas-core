import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, FileSpreadsheet } from "lucide-react"

async function getData() {
    // MOCK DATA - To be replaced with API call
    return [
        {
            id: "1",
            orderNumber: "PO-2025-001",
            supplierName: "TechWorld Inc.",
            status: "DRAFT",
            total: 0,
            expectedAt: null,
            createdAt: "2025-01-28T10:00:00Z"
        },
        {
            id: "2",
            orderNumber: "PO-2025-002",
            supplierName: "Global Supplies Ltd.",
            status: "ORDERED",
            total: 4500.50,
            expectedAt: "2025-02-15T00:00:00Z",
            createdAt: "2025-01-29T14:30:00Z"
        },
        {
            id: "3",
            orderNumber: "PO-2025-003",
            supplierName: "Insumos del Valle",
            status: "RECEIVED",
            total: 1250.00,
            expectedAt: "2025-01-30T00:00:00Z",
            createdAt: "2025-01-20T09:15:00Z"
        },
        {
            id: "4",
            orderNumber: "PO-2025-004",
            supplierName: "TechWorld Inc.",
            status: "CANCELLED",
            total: 800.00,
            expectedAt: null,
            createdAt: "2025-01-31T11:20:00Z"
        },
    ]
}

export default async function OrdersPage() {
    const data = await getData()

    return (
        <div className="flex h-full flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Órdenes de Compra</h1>
                    <p className="text-slate-500 text-base">Gestión de abastecimiento y pedidos a proveedores.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Nueva Orden
                </Button>
            </div>

            {/* Data Surface */}
            <Card className="border-none shadow-sm overflow-hidden rounded-xl bg-white">
                <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">Historial de Órdenes</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{data.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-slate-600">
                                <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Reporte
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-slate-600">
                                <Download className="mr-2 h-3.5 w-3.5" /> Exportar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <DataTable
                            columns={columns}
                            data={data}
                            searchKey="orderNumber"
                            customFilters={
                                <div className="flex gap-2">
                                    <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                                        <option>Estado</option>
                                        <option>Borrador</option>
                                        <option>Pendiente</option>
                                        <option>Recibido</option>
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
