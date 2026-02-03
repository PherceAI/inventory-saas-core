
import Link from "next/link";
import {
    Users,
    Settings as SettingsIcon,
    CreditCard,
    Building2,
    Bell,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";

const settingsModules = [
    {
        title: "Equipo y Permisos",
        description: "Gestiona usuarios, roles y accesos al sistema.",
        icon: Users,
        href: "/settings/users",
        color: "text-blue-600 bg-blue-50"
    },
    {
        title: "Perfil de Empresa",
        description: "Logo, información fiscal y configuración regional.",
        icon: Building2,
        href: "/settings/company", // Placeholder pending implementation
        color: "text-purple-600 bg-purple-50"
    },
    {
        title: "Reglas de Inventario",
        description: "Límites de stock, alertas y preferencias de bodega.",
        icon: SettingsIcon,
        href: "/settings/inventory", // Placeholder pending implementation
        color: "text-amber-600 bg-amber-50"
    },
    {
        title: "Seguridad",
        description: "Contraseñas, sesiones y logs de actividad.",
        icon: ShieldCheck,
        href: "/settings/security", // Placeholder 
        color: "text-emerald-600 bg-emerald-50"
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configuración</h1>
                <p className="text-slate-500">Administra las preferencias generales de tu organización.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsModules.map((module) => (
                    <Link key={module.href} href={module.href} className="group">
                        <Card className="h-full p-6 transition-all hover:shadow-md hover:border-slate-300">
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-lg ${module.color}`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </div>

                            <div className="mt-4 space-y-2">
                                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
