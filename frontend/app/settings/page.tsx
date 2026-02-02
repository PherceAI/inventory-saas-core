import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Construction } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configuración</h1>
            </div>
            <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 text-slate-400">
                <Construction className="mb-4 h-12 w-12 opacity-20" />
                <h3 className="text-lg font-medium">Módulo en Construcción</h3>
                <p className="text-sm">Preferencias de sistema y gestión de usuarios estarán disponibles pronto.</p>
            </div>
        </div>
    )
}
