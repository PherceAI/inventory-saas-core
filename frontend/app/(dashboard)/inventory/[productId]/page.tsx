import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Package, History, BarChart3 } from "lucide-react"
import Link from "next/link"

// Implement Components for Tabs
function BatchesTab() {
    return (
        <Card className="border-none shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle className="text-lg">Lotes Activos</CardTitle>
                <CardDescription>Rastreo de inventario por lotes y vencimientos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border p-4 text-center text-sm text-muted-foreground bg-slate-50 border-dashed">
                    Tabla de Lotes (Integración pendiente con BatchService)
                </div>
            </CardContent>
        </Card>
    )
}

function HistoryTab() {
    return (
        <Card className="border-none shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle className="text-lg">Historial de Movimientos</CardTitle>
                <CardDescription>Registro inmutable de entradas y salidas.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border p-4 text-center text-sm text-muted-foreground bg-slate-50 border-dashed">
                    Tabla de Movimientos (Integración pendiente con InventoryMovement)
                </div>
            </CardContent>
        </Card>
    )
}

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
    // MOCK DATA for View
    const product = {
        name: "Laptop Pro X1",
        sku: "TECH-LP-001",
        category: "Electrónica",
        stock: 45,
        price: 1200.00,
        cost: 850.00
    }

    return (
        <div className="flex h-full flex-col gap-6">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/inventory">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{product.sku}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                    </div>
                </div>
                <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" /> Editar
                </Button>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="shadow-none border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Stock Total</CardTitle>
                        <Package className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{product.stock}</div>
                        <p className="text-xs text-muted-foreground">Unidades disponibles</p>
                    </CardContent>
                </Card>
                <Card className="shadow-none border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Precio Venta</CardTitle>
                        <span className="text-green-600">$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">${product.price}</div>
                        <p className="text-xs text-muted-foreground">Default price</p>
                    </CardContent>
                </Card>
                <Card className="shadow-none border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Costo Promedio</CardTitle>
                        <BarChart3 className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">${product.cost}</div>
                        <p className="text-xs text-muted-foreground">Weighted Average</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Deep Data */}
            <Tabs defaultValue="batches" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="batches">Lotes (Stock Real)</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                    <TabsTrigger value="settings">Configuración</TabsTrigger>
                </TabsList>
                <div className="mt-4 space-y-4">
                    <TabsContent value="batches">
                        <BatchesTab />
                    </TabsContent>
                    <TabsContent value="history">
                        <HistoryTab />
                    </TabsContent>
                    <TabsContent value="settings">
                        <Card className="border-none shadow-sm rounded-xl">
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Opciones avanzadas del producto...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
