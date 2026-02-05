'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, Warehouse, FileText, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    hasWarehouses: boolean;
}

const quickStartSteps = [
    {
        icon: Warehouse,
        title: "Configura tu almacén",
        description: "Ya tienes un almacén por defecto. Personalízalo o agrega más.",
        href: "/settings/inventory",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        completed: true, // First warehouse is auto-created
    },
    {
        icon: Package,
        title: "Agrega tu primer producto",
        description: "Crea productos con SKU, categorías y niveles de stock.",
        href: "/inventory/products/new",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        completed: false,
    },
    {
        icon: Users,
        title: "Registra proveedores",
        description: "Agrega a tus proveedores para órdenes de compra.",
        href: "/suppliers",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        completed: false,
    },
    {
        icon: FileText,
        title: "Crea una orden de compra",
        description: "Genera órdenes y recibe mercancía automáticamente.",
        href: "/inventory/orders/new",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        completed: false,
    },
];

export function EmptyDashboardState({ hasWarehouses }: EmptyStateProps) {
    // Adjust first step based on warehouse status
    const steps = quickStartSteps.map((step, index) => ({
        ...step,
        completed: index === 0 ? hasWarehouses : step.completed,
    }));

    return (
        <div className="flex flex-col gap-8">
            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-50 to-teal-50 p-8 md:p-12">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-primary mb-4">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">¡Bienvenido!</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Tu sistema de inventario está listo
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mb-6">
                        Comienza a configurar tu empresa en pocos minutos. Sigue estos pasos
                        para tener tu inventario funcionando.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button size="lg" className="gap-2" asChild>
                            <Link href="/inventory/products/new">
                                <Package className="h-4 w-4" />
                                Agregar primer producto
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="gap-2" asChild>
                            <Link href="/settings">
                                Configurar empresa
                            </Link>
                        </Button>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-gradient-to-tr from-emerald-200/50 to-transparent rounded-full blur-2xl translate-y-1/2" />
            </div>

            {/* Quick Start Guide */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Guía de inicio rápido</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {steps.map((step, index) => (
                        <Card
                            key={step.title}
                            className={`border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${step.completed ? 'opacity-60' : ''}`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`rounded-xl p-3 ${step.bgColor} ${step.color}`}>
                                        <step.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-slate-400">Paso {index + 1}</span>
                                            {step.completed && (
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    ✓ Listo
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                                        <p className="text-sm text-slate-500 mb-3">{step.description}</p>
                                        {!step.completed && (
                                            <Link
                                                href={step.href}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                            >
                                                Comenzar <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Help Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                            <span className="text-2xl">📚</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Documentación</h3>
                        <p className="text-sm text-slate-500 mb-3">Aprende a usar todas las funciones.</p>
                        <Button variant="ghost" size="sm" className="text-primary">
                            Ver guías
                        </Button>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Soporte</h3>
                        <p className="text-sm text-slate-500 mb-3">¿Necesitas ayuda? Contáctanos.</p>
                        <Button variant="ghost" size="sm" className="text-primary">
                            Abrir chat
                        </Button>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                            <span className="text-2xl">🎥</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Video Tutorial</h3>
                        <p className="text-sm text-slate-500 mb-3">Mira cómo configurar todo en 5 min.</p>
                        <Button variant="ghost" size="sm" className="text-primary">
                            Ver video
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
