import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

async function getData() {
    // MOCK DATA - To be replaced with API call
    return [
        {
            id: "1",
            code: "SUP-001",
            name: "TechWorld Inc.",
            contactName: "John Doe",
            email: "contact@techworld.com",
            paymentTermDays: 30,
            isActive: true,
            rating: 4.8
        },
        {
            id: "2",
            code: "SUP-002",
            name: "Global Supplies Ltd.",
            contactName: "Maria Garcia",
            email: "mgarcia@globalsupplies.com",
            paymentTermDays: 15,
            isActive: true,
            rating: 3.5
        },
        {
            id: "3",
            code: "SUP-003",
            name: "Insumos del Valle",
            contactName: "Pedro Páramo",
            email: "pedro@insumos.com",
            paymentTermDays: 0,
            isActive: false,
            rating: 2.0
        },
    ]
}

export default async function SuppliersPage() {
    const data = await getData()

    return (
        <div className="flex h-full flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Proveedores</h1>
                    <p className="text-slate-500 text-base">Gestión de relaciones y cuentas por pagar.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Data Surface */}
            <Card className="border-none shadow-sm overflow-hidden rounded-xl bg-white">
                <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">Total Proveedores</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{data.length}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-slate-600">
                            <Download className="mr-2 h-3.5 w-3.5" /> Exportar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <DataTable columns={columns} data={data} searchKey="name" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
