import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Package, Users, Activity, TrendingUp, TrendingDown, MoreHorizontal, ArrowRight, Download, Calendar } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo, Admin</h1>
                    <p className="text-slate-500 mt-1">Aquí tienes el resumen de lo que está pasando en tu sistema hoy.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>01 Feb, 2026</span>
                    </div>
                    <Button variant="default" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Reporte
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Ingresos Totales"
                    value="$45,231.89"
                    trend="+20.1%"
                    trendUp={true}
                    icon={DollarSign}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <KPICard
                    title="Inventario Bajo"
                    value="12 Items"
                    trend="-2.5%"
                    trendUp={false}
                    icon={Package}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
                <KPICard
                    title="Proveedores Activos"
                    value="573"
                    trend="+4.5%"
                    trendUp={true}
                    icon={Users}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <KPICard
                    title="Pedidos Pendientes"
                    value="2,350"
                    trend="+12%"
                    trendUp={true}
                    icon={Activity}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Section */}
                <Card className="col-span-4 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">Resumen Financiero</CardTitle>
                            <p className="text-sm text-slate-500">Ingresos vs Gastos este año</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pl-6 pb-6">
                        {/* CSS Chart Placeholder - Looks like Oripio */}
                        <div className="mt-8 grid h-[240px] grid-cols-12 items-end gap-2 sm:gap-4">
                            {[65, 45, 75, 55, 80, 70, 90, 60, 75, 85, 95, 80].map((h, i) => (
                                <div key={i} className="flex h-full flex-col items-center justify-end gap-2">
                                    <div
                                        className="w-full max-w-[24px] rounded-t-md bg-primary transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/20"
                                        style={{ height: `${h}%`, minHeight: '4px' }}
                                    ></div>
                                    <span className="text-[10px] font-medium text-slate-400">
                                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed Section */}
                <Card className="col-span-3 border-none shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800">Actividad Reciente</CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:text-primary">Ver todo</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${i % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {i % 2 === 0 ? <DollarSign className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 leading-none">
                                            {i % 2 === 0 ? 'Pago Recibido' : 'Nuevo Pedido #1024'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {i % 2 === 0 ? 'De Cliente Corporativo' : 'Proveedor TechWorld Inc.'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-900">{i % 2 === 0 ? '+$1,250' : '$850'}</p>
                                        <p className="text-xs text-slate-400">Hace {i * 15}m</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="mt-6 w-full text-xs font-medium text-slate-500">
                            Cargar más actividades
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Third Row */}
            <div className="grid gap-6 md:grid-cols-3">
                <FeatureCard
                    title="Gestión Rápida"
                    desc="Accesos directos a funciones comunes"
                    action="Ir a Configuración"
                />
                <FeatureCard
                    title="Soporte Técnico"
                    desc="Contacta con el equipo de soporte"
                    action="Abrir Ticket"
                />
                <div className="rounded-2xl bg-gradient-to-br from-primary to-emerald-600 p-6 text-white shadow-sm">
                    <h3 className="text-lg font-bold">¿Necesitas Ayuda?</h3>
                    <p className="mt-2 text-sm text-emerald-100 opacity-90">Revisa la documentación completa para aprender a usar el sistema.</p>
                    <Button variant="secondary" className="mt-4 w-full bg-white/20 text-white hover:bg-white/30 border-none">
                        Ver Documentación
                    </Button>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, trend, trendUp, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border-none shadow-sm hover:shadow-sm transition-colors duration-200">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
                    </div>
                    <div className={`rounded-xl p-2.5 ${bgColor} ${color}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trend}
                    </div>
                    <span className="text-xs text-slate-400">vs mes anterior</span>
                </div>
            </CardContent>
        </Card>
    )
}

function FeatureCard({ title, desc, action }: any) {
    return (
        <Card className="border-none shadow-sm hover:translate-y-[-2px] transition-transform">
            <CardContent className="p-6">
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary cursor-pointer hover:underline">
                    {action} <ArrowRight className="h-4 w-4" />
                </div>
            </CardContent>
        </Card>
    )
}
