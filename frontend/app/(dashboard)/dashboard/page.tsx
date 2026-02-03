'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DollarSign, Package, Users, Activity, ShoppingCart,
    MoreHorizontal, ArrowRight, Download, Calendar,
    Warehouse, AlertTriangle, PackageX
} from "lucide-react";
import { EmptyDashboardState } from "@/components/dashboard/empty-state";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
    getDashboardStats,
    DashboardStats,
    formatCurrency,
    formatNumber,
    getEmptyStats
} from "@/services/dashboard.service";

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const data = await getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                setError('No se pudieron cargar las estadísticas');
                setStats(getEmptyStats());
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Get current date in Spanish format
    const today = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Determine if this is a new/empty tenant
    const isEmpty = stats &&
        stats.products.total === 0 &&
        stats.suppliers.total === 0 &&
        stats.purchaseOrders.total === 0;

    // Show empty state for new tenants
    if (!isLoading && isEmpty) {
        return <EmptyDashboardState hasWarehouses={stats.warehouses.total > 0} />;
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Panel de control
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Resumen general de tu inventario y operaciones.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{today}</span>
                    </div>
                    <Button variant="default" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Valor del Inventario"
                    value={isLoading ? '...' : formatCurrency(stats?.inventory.totalValue ?? 0)}
                    subtitle="valor total en stock"
                    icon={DollarSign}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Productos en Stock Bajo"
                    value={isLoading ? '...' : `${stats?.products.lowStock ?? 0} items`}
                    subtitle={stats?.products.lowStock === 0 ? 'todo en orden' : 'requieren atención'}
                    icon={stats?.products.lowStock === 0 ? Package : AlertTriangle}
                    color={stats?.products.lowStock === 0 ? "text-blue-600" : "text-amber-600"}
                    bgColor={stats?.products.lowStock === 0 ? "bg-blue-50" : "bg-amber-50"}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Proveedores Activos"
                    value={isLoading ? '...' : formatNumber(stats?.suppliers.active ?? 0)}
                    subtitle={`de ${stats?.suppliers.total ?? 0} registrados`}
                    icon={Users}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Órdenes Pendientes"
                    value={isLoading ? '...' : formatNumber(stats?.purchaseOrders.pending ?? 0)}
                    subtitle={`de ${stats?.purchaseOrders.total ?? 0} totales`}
                    icon={ShoppingCart}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                    isLoading={isLoading}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl p-3 bg-slate-100 text-slate-600">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Productos</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {isLoading ? '...' : formatNumber(stats?.products.total ?? 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl p-3 bg-slate-100 text-slate-600">
                                <Warehouse className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Almacenes</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {isLoading ? '...' : formatNumber(stats?.warehouses.total ?? 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl p-3 bg-slate-100 text-slate-600">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Movimientos</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {isLoading ? '...' : formatNumber(stats?.inventory.movements ?? 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Products without stock warning */}
                {(stats?.products.outOfStock ?? 0) > 0 && (
                    <Card className="col-span-4 border-none shadow-sm border-l-4 border-l-rose-500">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl p-2 bg-rose-100 text-rose-600">
                                    <PackageX className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-800">
                                        Productos sin stock
                                    </CardTitle>
                                    <p className="text-sm text-slate-500">
                                        {stats?.products.outOfStock} productos necesitan reabastecimiento
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Button variant="outline" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                                Ver productos sin stock
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Activity Feed Section */}
                <Card className={`${(stats?.products.outOfStock ?? 0) > 0 ? 'col-span-3' : 'col-span-4'} border-none shadow-sm`}>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800">
                                Actividad Reciente
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:text-primary">
                                Ver todo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                                            <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            <div className="space-y-6">
                                {stats.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${activity.type === 'movement'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            {activity.type === 'movement'
                                                ? <Package className="h-5 w-5" />
                                                : <DollarSign className="h-5 w-5" />
                                            }
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-semibold text-slate-900 leading-none">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(activity.createdAt).toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {activity.amount && (
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {formatCurrency(activity.amount)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No hay actividad reciente</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Los movimientos de inventario aparecerán aquí
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                {(stats?.products.outOfStock ?? 0) === 0 && (
                    <Card className="col-span-3 border-none shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold text-slate-800">
                                Acciones Rápidas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-0 space-y-3">
                            <Button variant="outline" className="w-full justify-start gap-3">
                                <Package className="h-4 w-4 text-slate-500" />
                                Agregar producto
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-3">
                                <ShoppingCart className="h-4 w-4 text-slate-500" />
                                Nueva orden de compra
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-3">
                                <Activity className="h-4 w-4 text-slate-500" />
                                Registrar movimiento
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Help Section */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm hover:translate-y-[-2px] transition-transform cursor-pointer">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-slate-900">Gestión Rápida</h3>
                        <p className="mt-1 text-sm text-slate-500">Accesos directos a funciones comunes</p>
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                            Ir a Configuración <ArrowRight className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:translate-y-[-2px] transition-transform cursor-pointer">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-slate-900">Soporte Técnico</h3>
                        <p className="mt-1 text-sm text-slate-500">Contacta con el equipo de soporte</p>
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                            Abrir Ticket <ArrowRight className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
                <div className="rounded-2xl bg-gradient-to-br from-primary to-emerald-600 p-6 text-white shadow-sm">
                    <h3 className="text-lg font-bold">¿Necesitas Ayuda?</h3>
                    <p className="mt-2 text-sm text-emerald-100 opacity-90">
                        Revisa la documentación completa para aprender a usar el sistema.
                    </p>
                    <Button variant="secondary" className="mt-4 w-full bg-white/20 text-white hover:bg-white/30 border-none">
                        Ver Documentación
                    </Button>
                </div>
            </div>
        </div>
    );
}
