'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Package, Users, Warehouse, FileText, ArrowRight,
    Sparkles, PlayCircle, BookOpen, MessageCircle,
    CheckCircle2, Circle, Trophy
} from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    hasWarehouses: boolean;
}

const quickStartSteps = [
    {
        icon: Warehouse,
        title: "Configura tu almacén",
        description: "Personaliza tus ubicaciones para organizar mejor tu inventario.",
        href: "/settings/inventory",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
        completed: true,
    },
    {
        icon: Package,
        title: "Agrega tu primer producto",
        description: "Registra items con SKU, precios y niveles de stock.",
        href: "/inventory/products/new",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        borderColor: "border-emerald-200",
        completed: false,
    },
    {
        icon: Users,
        title: "Registra proveedores",
        description: "Centraliza la información de tus aliados comerciales.",
        href: "/suppliers",
        color: "text-sky-600",
        bgColor: "bg-sky-100",
        borderColor: "border-sky-200",
        completed: false,
    },
    {
        icon: FileText,
        title: "Crea una orden de compra",
        description: "Genera documentos profesionales para reabastecimiento.",
        href: "/inventory/orders/new",
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        borderColor: "border-amber-200",
        completed: false,
    },
];

export function EmptyDashboardState({ hasWarehouses }: EmptyStateProps) {
    // Dynamic completion state logic
    // Refined logic: If hasWarehouses is true, step 1 is done.
    const steps = quickStartSteps.map((step, index) => {
        const isStep1 = index === 0;
        return {
            ...step,
            completed: isStep1 ? hasWarehouses : step.completed,
        };
    });

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Hero Section - Premium Gradient */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 md:p-12 shadow-2xl ring-1 ring-white/10">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-200 ring-1 ring-inset ring-blue-500/20 mb-6">
                            <Sparkles className="h-4 w-4 text-blue-400" />
                            <span>Sistema Configurado y Listo</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Bienvenido a tu panel de control
                        </h1>
                        <p className="text-lg text-blue-100/80 max-w-xl leading-relaxed mb-8">
                            Has dado el primer paso hacia una gestión eficiente.
                            Completa la configuración inicial para desbloquear todo el potencial de tu inventario.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20" asChild>
                                <Link href="/inventory/products/new">
                                    Comenzar ahora
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                                <Link href="/settings">
                                    Ajustes de empresa
                                </Link>
                            </Button>
                        </div>
                    </div>
                    {/* Gamification Badge */}
                    <div className="hidden md:flex flex-col items-center justify-center bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl min-w-[200px]">
                        <div className="relative">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    className="text-white/10"
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="48"
                                    cy="48"
                                />
                                <circle
                                    className="text-blue-500 transition-all duration-1000 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="48"
                                    cy="48"
                                />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white">
                                {progress}%
                            </div>
                        </div>
                        <p className="mt-4 text-sm font-medium text-blue-200">Progreso Inicial</p>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl" />
            </div>

            {/* Tour / Quick Start Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Tu Ruta de Éxito</h2>
                        <p className="text-slate-500">Sigue estos pasos recomendados para configurar tu cuenta</p>
                    </div>
                    {progress === 100 && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-medium">
                            <Trophy className="h-5 w-5" />
                            <span>¡Todo listo!</span>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {steps.map((step, index) => (
                        <div
                            key={step.title}
                            className={`group relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${step.completed ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
                                }`}
                        >
                            <div className="flex items-start gap-5">
                                <div className={`rounded-xl p-4 transition-colors ${step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                    {step.completed ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`font-bold text-lg ${step.completed ? 'text-slate-800' : 'text-slate-900'}`}>
                                            {step.title}
                                        </h3>
                                        {!step.completed && (
                                            <span className="text-xs font-bold text-slate-300 px-2 py-1 bg-slate-50 rounded-md uppercase tracking-wider">
                                                Paso {index + 1}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-500 mb-4 leading-relaxed">
                                        {step.description}
                                    </p>
                                    {!step.completed && (
                                        <Button variant="ghost" className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-700 hover:bg-transparent group-hover:translate-x-1 transition-transform" asChild>
                                            <Link href={step.href} className="flex items-center gap-2">
                                                Configurar ahora <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Support & Resources Grid */}
            <div className="grid gap-6 md:grid-cols-3 mt-4">
                <Link href="/docs" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-slate-50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Documentación</h3>
                                <p className="text-xs text-slate-500 mt-1">Guías detalladas</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/help" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-slate-50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:text-emerald-600 group-hover:scale-110 transition-all">
                                <MessageCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Soporte 24/7</h3>
                                <p className="text-xs text-slate-500 mt-1">Chat en vivo</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/tutorials" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-slate-50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 group-hover:text-amber-600 group-hover:scale-110 transition-all">
                                <PlayCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Video Tutoriales</h3>
                                <p className="text-xs text-slate-500 mt-1">Aprende en 5 min</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
