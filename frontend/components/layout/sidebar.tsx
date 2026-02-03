"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    Settings,
    BarChart3,
    Truck,
    Store,
    Hexagon,
    LogOut,
    Building2,
    ChevronDown,
    Crown,
    Shield,
    User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { TenantWithRole } from "@/services/auth.service"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Punto de Venta", href: "/pos", icon: Store },
    { name: "Inventario", href: "/inventory", icon: Package },
    { name: "Proveedores", href: "/suppliers", icon: Users },
    { name: "Pedidos", href: "/orders", icon: ShoppingCart },
    { name: "Flota", href: "/fleet", icon: Truck },
    { name: "Reportes", href: "/reports", icon: BarChart3 },
    { name: "Configuración", href: "/settings", icon: Settings },
]

const roleIcons: Record<string, React.ReactNode> = {
    OWNER: <Crown size={12} className="text-amber-500" />,
    ADMIN: <Shield size={12} className="text-blue-500" />,
    MANAGER: <Shield size={12} className="text-green-500" />,
    SUPERVISOR: <User size={12} className="text-slate-500" />,
    OPERATOR: <User size={12} className="text-slate-400" />,
    AUDITOR: <User size={12} className="text-purple-500" />,
    VIEWER: <User size={12} className="text-slate-300" />,
}

const roleLabels: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    SUPERVISOR: 'Supervisor',
    OPERATOR: 'Operador',
    AUDITOR: 'Auditor',
    VIEWER: 'Solo lectura',
}

export function AppSidebar() {
    const pathname = usePathname()
    const { user, currentTenant, tenants, logout, selectTenant } = useAuth()
    const [showTenantMenu, setShowTenantMenu] = useState(false)

    const handleTenantSelect = (tenant: TenantWithRole) => {
        selectTenant(tenant)
        setShowTenantMenu(false)
    }

    const getInitials = (firstName?: string, lastName?: string) => {
        const first = firstName?.charAt(0)?.toUpperCase() || ''
        const last = lastName?.charAt(0)?.toUpperCase() || ''
        return first + last || 'U'
    }

    return (
        <div className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white text-slate-900 shadow-sm z-20">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-slate-50">
                <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                        <Hexagon className="h-5 w-5 fill-current" />
                    </div>
                    <span className="text-xl">Clarigo</span>
                </Link>
            </div>

            {/* Current Tenant */}
            {currentTenant && (
                <div className="px-4 py-3 border-b border-slate-50">
                    <div className="relative">
                        <button
                            onClick={() => tenants.length > 1 && setShowTenantMenu(!showTenantMenu)}
                            className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                                tenants.length > 1 ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
                            )}
                        >
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                    {currentTenant.name}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    {roleIcons[currentTenant.role]}
                                    <span>{roleLabels[currentTenant.role] || currentTenant.role}</span>
                                </div>
                            </div>
                            {tenants.length > 1 && (
                                <ChevronDown size={16} className={cn(
                                    "text-slate-400 transition-transform",
                                    showTenantMenu && "rotate-180"
                                )} />
                            )}
                        </button>

                        {/* Tenant Dropdown */}
                        {showTenantMenu && tenants.length > 1 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                                <p className="px-3 py-2 text-xs font-medium text-slate-400 uppercase">
                                    Cambiar empresa
                                </p>
                                {tenants
                                    .filter(t => t.id !== currentTenant.id)
                                    .map((tenant) => (
                                        <button
                                            key={tenant.id}
                                            onClick={() => handleTenantSelect(tenant)}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors"
                                        >
                                            <Building2 size={14} className="text-slate-400" />
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-slate-700">{tenant.name}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    {roleIcons[tenant.role]}
                                                    <span>{roleLabels[tenant.role]}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn("h-4.5 w-4.5 transition-transform group-hover:scale-105", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-50">
                <div className="flex items-center gap-3 p-2">
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-100 bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                            {getInitials(user?.firstName, user?.lastName)}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
