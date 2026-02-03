"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuditPage() {
    const router = useRouter()
    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">Auditoría de Inventario</h1>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">Módulo de auditoría en construcción...</p>
            </div>
        </div>
    )
}
