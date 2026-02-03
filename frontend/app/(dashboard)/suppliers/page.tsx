'use client';

import { useEffect, useState } from 'react';
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateSupplierModal } from "@/components/modules/suppliers/create-supplier-modal";
import { SuppliersService, Supplier, CreateSupplierDto } from "@/services/suppliers.service";
import { useToast } from "@/hooks/use-toast";

interface SupplierRow {
    id: string;
    code: string;
    name: string;
    contactName: string;
    email: string;
    paymentTermDays: number;
    isActive: boolean;
    rating: number;
}

export default function SuppliersPage() {
    const [data, setData] = useState<SupplierRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const suppliers = await SuppliersService.getAll();
            // Map API response to table format
            const mapped: SupplierRow[] = (suppliers || []).map((s: any) => ({
                id: s.id,
                code: s.code || `SUP-${s.id.substring(0, 4).toUpperCase()}`,
                name: s.name,
                contactName: s.contactName || '-',
                email: s.email || '-',
                paymentTermDays: s.paymentTermDays || 0,
                isActive: s.isActive ?? true,
                rating: s.rating || 0,
            }));
            setData(mapped);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los proveedores.",
                variant: "destructive"
            });
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateSupplier = async (data: CreateSupplierDto) => {
        try {
            await SuppliersService.create(data);
            toast({
                title: "Proveedor creado",
                description: `Se ha registrado a ${data.name} exitosamente.`,
            });
            fetchData(); // Refresh list
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo crear el proveedor. Verifica si el código o RUC ya existen.",
                variant: "destructive"
            });
            throw error; // Re-throw so modal stays open or handles state
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Proveedores</h1>
                    <p className="text-slate-500 text-base">Gestión de relaciones y cuentas por pagar.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Empty State or Data Table */}
            {data.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No hay proveedores registrados"
                    description="Agrega tu primer proveedor para comenzar a gestionar órdenes de compra y pagos."
                    ctaLabel="Agregar Proveedor"
                    ctaAction={() => setIsCreateModalOpen(true)}
                />
            ) : (
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
            )}

            <CreateSupplierModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSubmit={handleCreateSupplier}
            />
        </div>
    );
}
