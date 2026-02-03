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
import { CreateProductModal } from "@/components/modules/inventory/create-product-modal";
import { CreateAuditModal } from "@/components/modules/inventory/create-audit-modal";
import { CreatePurchaseOrderModal } from "@/components/modules/inventory/create-purchase-order-modal";
import { ProductsService } from "@/services/products.service";

const ActionButton = React.forwardRef(({ icon: Icon, label, desc, color, bg, primary, ...props }: any, ref: any) => {
    return (
        <button
            ref={ref}
            {...props}
            className={`group flex items-center gap-4 rounded-xl border p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-95 ${primary ? 'border-primary/20 bg-primary/5' : 'border-slate-100 bg-white'}`}
        >
            <div className={`rounded-lg p-2.5 ${bg} ${color} transition-colors group-hover:bg-white`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className={`font-bold text-sm ${primary ? 'text-primary' : 'text-slate-700'}`}>{label}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{desc}</p>
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
            <div className="flex h-full flex-col gap-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20" />
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
        <div className="flex h-full flex-col gap-6">
            {/* 1. Header Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario General</h1>
                <p className="text-slate-500 text-base">Gestión centralizada de productos y existencias.</p>
            </div>

            {/* 2. Action Buttons Bar */}

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
                <ProductTransferModal>
                    <ActionButton
                        icon={ArrowRightLeft}
                        label="Traslado"
                        desc="Entre bodegas"
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                </ProductTransferModal>
                <CreateProductModal>
                    <ActionButton
                        icon={Plus}
                        label="Nuevo Producto"
                        desc="Crear SKU"
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                        primary
                    />
                </CreateProductModal>
                <CreateAuditModal>
                    <ActionButton
                        icon={ClipboardCheck}
                        label="Realizar Auditoría"
                        desc="Verificar stock"
                        color="text-amber-600"
                        bg="bg-amber-50"
                    />
                </CreateAuditModal>
                <CreatePurchaseOrderModal>
                    <ActionButton
                        icon={FileText}
                        label="Orden de Compra"
                        desc="Generar pedido"
                        color="text-slate-600"
                        bg="bg-slate-50"
                    />
                </CreatePurchaseOrderModal>
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
