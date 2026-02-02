"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, ArrowUpDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Purchase Order Entity based on Schema
export type PurchaseOrder = {
    id: string
    orderNumber: string
    supplierName: string
    status: "DRAFT" | "PENDING" | "APPROVED" | "ORDERED" | "RECEIVED" | "CANCELLED"
    total: number
    expectedAt: string | null
    createdAt: string
}

export const columns: ColumnDef<PurchaseOrder>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "orderNumber",
        header: "Orden #",
        cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-700">{row.getValue("orderNumber")}</span>,
    },
    {
        accessorKey: "supplierName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Proveedor
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium text-slate-900">{row.getValue("supplierName")}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Fecha Creación",
        cell: ({ row }) => {
            const dateStr = row.getValue("createdAt") as string
            return <div className="text-sm text-muted-foreground capitalize">
                {format(new Date(dateStr), "MMM d, yyyy", { locale: es })}
            </div>
        },
    },
    {
        accessorKey: "expectedAt",
        header: "Entrega Esperada",
        cell: ({ row }) => {
            const dateStr = row.getValue("expectedAt") as string | null
            if (!dateStr) return <span className="text-muted-foreground">-</span>
            return <div className="text-sm font-medium text-slate-700 capitalize">
                {format(new Date(dateStr), "MMM d, yyyy", { locale: es })}
            </div>
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string

            const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                DRAFT: "secondary",
                PENDING: "outline",
                APPROVED: "default",
                ORDERED: "default",
                RECEIVED: "default",
                CANCELLED: "destructive",
            }

            const colorClassMap: Record<string, string> = {
                DRAFT: "bg-slate-100 text-slate-600 hover:bg-slate-100",
                PENDING: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50",
                APPROVED: "bg-blue-50 text-blue-600 hover:bg-blue-50",
                ORDERED: "bg-indigo-50 text-indigo-600 hover:bg-indigo-50",
                RECEIVED: "bg-emerald-50 text-emerald-600 hover:bg-emerald-50",
                CANCELLED: "bg-red-50 text-red-600 hover:bg-red-50",
            }

            return (
                <Badge variant={variantMap[status] || "secondary"} className={colorClassMap[status]}>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("total"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="text-right font-medium font-mono text-slate-900">{formatted}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    },
]
