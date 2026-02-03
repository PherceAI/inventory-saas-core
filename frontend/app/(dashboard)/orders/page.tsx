'use client';

import { useEffect, useState } from 'react';
import { DataTable } from "@/components/ui/data-table";
import { columns, PurchaseOrder } from "./columns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getOrders } from "@/services/orders.service";

export default function OrdersPage() {
    const [data, setData] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const orders = await getOrders();
                // Map API response to table format
                const mapped: PurchaseOrder[] = (orders || []).map((o: any) => ({
                    id: o.id,
                    orderNumber: o.orderNumber || `PO-${o.id.substring(0, 6).toUpperCase()}`,
                    supplierName: o.supplier?.name || o.supplierName || '-',
                    status: (o.status || 'DRAFT') as PurchaseOrder['status'],
                    total: o.total || 0,
                    expectedAt: o.expectedAt,
                    createdAt: o.createdAt,
                }));
                setData(mapped);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-56 mb-2" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

            {/* Empty State or Data Table */}
            {data.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No hay órdenes de compra"
                    description="Crea tu primera orden de compra para solicitar productos a tus proveedores."
                    ctaLabel="Crear Primera Orden"
                    ctaHref="/dashboard/orders/new"
                />
            ) : (
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
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
