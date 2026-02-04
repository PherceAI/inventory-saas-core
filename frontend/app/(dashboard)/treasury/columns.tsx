"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountPayable, PayableStatus } from "@/services/accounts-payable.service"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const columns: ColumnDef<AccountPayable>[] = [
    {
        accessorKey: "invoiceNumber",
        header: "Factura",
        cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("invoiceNumber") || "-"}</div>,
    },
    {
        accessorKey: "supplier.name",
        header: "Proveedor",
        cell: ({ row }) => <div className="font-medium text-slate-700">{row.original.supplier?.name}</div>,
    },
    {
        accessorKey: "issueDate",
        header: "Emisión",
        cell: ({ row }) => {
            const date = new Date(row.getValue("issueDate"))
            return <div className="text-slate-500 text-xs">{format(date, "dd MMM yyyy", { locale: es })}</div>
        }
    },
    {
        accessorKey: "dueDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Vencimiento
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("dueDate"))
            return <div className="text-slate-500 text-xs font-medium">{format(date, "dd MMM yyyy", { locale: es })}</div>
        }
    },
    {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "balanceAmount",
        header: () => <div className="text-right">Pendiente</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("balanceAmount"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="text-right font-bold text-slate-900">{formatted}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as PayableStatus

            const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                [PayableStatus.CURRENT]: "secondary", // Azulito/Gris
                [PayableStatus.DUE_SOON]: "default", // Usaremos default (negro) o warning si hubiera
                [PayableStatus.OVERDUE]: "destructive", // Rojo
                [PayableStatus.PAID]: "outline", // Verde custom o outline
                [PayableStatus.CANCELLED]: "outline",
            }

            const labelMap: Record<string, string> = {
                [PayableStatus.CURRENT]: "Al día",
                [PayableStatus.DUE_SOON]: "Por vencer",
                [PayableStatus.OVERDUE]: "Vencido",
                [PayableStatus.PAID]: "Pagado",
                [PayableStatus.CANCELLED]: "Cancelado",
            }

            // Custom styles for specific badges to match the requested aesthetic better
            let className = ""
            if (status === PayableStatus.PAID) className = "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            if (status === PayableStatus.DUE_SOON) className = "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
            if (status === PayableStatus.CURRENT) className = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"

            return (
                <Badge variant={variantMap[status]} className={className}>
                    {labelMap[status]}
                </Badge>
            )
        }
    },
]
