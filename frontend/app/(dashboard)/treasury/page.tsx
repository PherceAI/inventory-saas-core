"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { columns } from "./columns"
import { AccountsPayableService, AccountPayable, PayableSummary } from "@/services/accounts-payable.service"
import {
    DollarSign,
    AlertTriangle,
    Clock,
    CheckCircle2,
    TrendingUp,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function TreasuryPage() {
    const [data, setData] = useState<AccountPayable[]>([])
    const [summary, setSummary] = useState<PayableSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const [listRes, summaryRes] = await Promise.all([
                    AccountsPayableService.getAll({ limit: 100 }),
                    AccountsPayableService.getSummary()
                ])
                setData(listRes.data || [])
                setSummary(summaryRes)
            } catch (error) {
                console.error("Error fetching treasury data", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return <div className="p-8 space-y-8">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <Skeleton className="h-96 rounded-xl" />
        </div>
    }

    return (
        <div className="flex h-full flex-col gap-8 p-6 bg-slate-50/50">
            {/* Header */}
            <div className='flex items-end justify-between'>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tesorería</h1>
                    <p className="mt-2 text-slate-500">Gestión de cuentas por pagar y flujo de caja.</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Reporte
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Al día (Current) */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Por Pagar (Al día)
                        </CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${Number(summary?.current.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {summary?.current.count} facturas pendientes
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Por vencer (Due Soon) */}
                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Próximos Vencimientos
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${Number(summary?.dueSoon.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {summary?.dueSoon.count} facturas vencen &lt; 7 días
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Vencido (Overdue) */}
                <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all bg-red-50/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">
                            Vencido (Urgente)
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${Number(summary?.overdue.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-red-400 mt-1">
                            {summary?.overdue.count} facturas vencidas
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Pagado (Total) */}
                <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">
                            Pagado Histórico
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${Number(summary?.paid.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {summary?.paid.count} facturas liquidadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="border-none shadow-sm overflow-hidden rounded-xl bg-white">
                <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">Listado de Obligaciones</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{data.length}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <DataTable
                            columns={columns}
                            data={data}
                            searchKey="invoiceNumber"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
