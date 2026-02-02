"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    Settings,
    BarChart3,
    Truck,
    Hexagon
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Inventario", href: "/inventory", icon: Package },
    { name: "Proveedores", href: "/suppliers", icon: Users },
    { name: "Pedidos", href: "/orders", icon: ShoppingCart },
    { name: "Flota", href: "/fleet", icon: Truck },
    { name: "Reportes", href: "/reports", icon: BarChart3 },
    { name: "Configuración", href: "/settings", icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white text-slate-900 shadow-sm z-20">
            <div className="flex h-16 items-center px-6 border-b border-slate-50">
                <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                        <Hexagon className="h-5 w-5 fill-current" />
                    </div>
                    <span className="text-xl">Antigravity</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
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
            <div className="p-4 border-t border-slate-50">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:bg-slate-50">
                    <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                        {/* Placeholder Avatar */}
                        <div className="h-full w-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">AU</div>
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900">Admin User</p>
                        <p className="text-xs text-slate-500">admin@pherce.com</p>
                    </div>
                </button>
            </div>
        </div>
    )
}
