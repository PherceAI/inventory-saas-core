'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from "next/link";
import { Product, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Download,
    Plus,
    ArrowRightLeft,
    ClipboardCheck,
    FileText,
    ArrowDownToLine,
    Package
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductInboundModal } from "@/components/modules/inventory/product-inbound-modal";
import { ProductTransferModal } from "@/components/modules/inventory/product-transfer-modal";
import { CreateAuditModal } from "@/components/modules/inventory/create-audit-modal";
import { CreatePurchaseOrderModal } from "@/components/modules/inventory/create-purchase-order-modal";
import { ProductsService } from "@/services/products.service";

const ActionButton = React.forwardRef(({ icon: Icon, label, desc, sectionColor, ...props }: any, ref: any) => {
    // Mapa de estilos basados en color semántico
    const colorStyles: Record<string, { bg: string, text: string, border: string, iconBg: string }> = {
        emerald: { bg: 'hover:bg-emerald-50/50', text: 'group-hover:text-emerald-700', border: 'hover:border-emerald-200', iconBg: 'bg-emerald-100/50 text-emerald-600' },
        blue: { bg: 'hover:bg-blue-50/50', text: 'group-hover:text-blue-700', border: 'hover:border-blue-200', iconBg: 'bg-blue-100/50 text-blue-600' },
        indigo: { bg: 'hover:bg-indigo-50/50', text: 'group-hover:text-indigo-700', border: 'hover:border-indigo-200', iconBg: 'bg-indigo-100/50 text-indigo-600' },
        amber: { bg: 'hover:bg-amber-50/50', text: 'group-hover:text-amber-700', border: 'hover:border-amber-200', iconBg: 'bg-amber-100/50 text-amber-600' },
        slate: { bg: 'hover:bg-slate-50/80', text: 'group-hover:text-slate-800', border: 'hover:border-slate-300', iconBg: 'bg-slate-100 text-slate-600' },
        violet: { bg: 'hover:bg-violet-50/50', text: 'group-hover:text-violet-700', border: 'hover:border-violet-200', iconBg: 'bg-violet-100/50 text-violet-600' },
    };

    const style = colorStyles[sectionColor] || colorStyles.slate;

    return (
        <button
            ref={ref}
            {...props}
            className={`group flex h-full w-full flex-col justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${style.border} ${style.bg}`}
        >
            <div className={`w-fit rounded-xl p-3 transition-colors ${style.iconBg}`}>
                <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
                <p className={`font-bold text-slate-700 transition-colors ${style.text}`}>{label}</p>
                <p className="mt-1 text-xs font-medium text-slate-400 group-hover:text-slate-500">{desc}</p>
            </div>
        </button>
    );
});
ActionButton.displayName = "ActionButton";

export default function InventoryPage() {
    const [data, setData] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ProductsService.getAll({ limit: 100 });
                const products = response.data || response || [];

                // Map API response to table format
                const mapped: Product[] = products.map((p: any) => {
                    // Calculate stock level from batches if available
                    const stockLevel = p.batches?.reduce(
                        (sum: number, batch: any) => sum + Number(batch.quantityCurrent || 0),
                        0
                    ) ?? p.stockLevel ?? 0;

                    const minStock = p.stockMin ?? 10;
                    const stockStatus = stockLevel === 0
                        ? 'Out of Stock'
                        : stockLevel < minStock
                            ? 'Low Stock'
                            : 'In Stock';

                    return {
                        id: p.id,
                        sku: p.sku || '-',
                        name: p.name,
                        stockLevel,
                        minStock,
                        price: p.priceDefault || p.costAverage || 0,
                        status: stockStatus as "In Stock" | "Low Stock" | "Out of Stock",
                        category: p.category?.name || p.categoryName || '-',
                    };
                });
                setData(mapped);
            } catch (error) {
                console.error('Error fetching products:', error);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full flex-col gap-8 p-2">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
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
        <div className="flex h-full flex-col gap-8">
            {/* 1. Header Section */}
            <div className='flex items-end justify-between'>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario General</h1>
                    <p className="mt-2 text-slate-500">Gestión centralizada de productos y existencias.</p>
                </div>
            </div>

            {/* 2. Action Buttons Bar - Premium Tiles */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <Link href="/inventory/inbound/new">
                    <ActionButton
                        icon={ArrowDownToLine}
                        label="Entrada Stock"
                        desc="Registrar ingresos"
                        sectionColor="emerald"
                    />
                </Link>
                <Link href="/inventory/transfer/new">
                    <ActionButton
                        icon={ArrowRightLeft}
                        label="Traslados"
                        desc="Mover entre almacenes"
                        sectionColor="blue"
                    />
                </Link>
                <Link href="/inventory/products/new">
                    <ActionButton
                        icon={Plus}
                        label="Nuevo Producto"
                        desc="Crear SKU en catálogo"
                        sectionColor="indigo"
                    />
                </Link>
                <Link href="/inventory/audit/new">
                    <ActionButton
                        icon={ClipboardCheck}
                        label="Auditoría"
                        desc="Cuadre de inventario"
                        sectionColor="amber"
                    />
                </Link>
                <Link href="/inventory/orders/new">
                    <ActionButton
                        icon={FileText}
                        label="Orden Compra"
                        desc="Reaprovisionamiento"
                        sectionColor="violet"
                    />
                </Link>
            </div>


            {/* 3. Main Data Surface */}
            {data.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No hay productos en tu inventario"
                    description="Agrega tu primer producto para comenzar a gestionar tu stock, movimientos y auditorías."
                    ctaLabel="Agregar Primer Producto"
                    ctaHref="/dashboard/products/new"
                />
            ) : (
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
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
