"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// Dropdown imports removed for initial build stability

// This type represents your Inventory Product shape.
export type Product = {
    id: string
    sku: string
    name: string
    category: string
    stockLevel: number
    minStock: number
    price: number
    status: "In Stock" | "Low Stock" | "Out of Stock"
}

export const columns: ColumnDef<Product>[] = [
    {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("sku")}</div>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="-ml-3"
                >
                    Producto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "category",
        header: "Categoría",
    },
    {
        accessorKey: "stockLevel",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const stock = parseFloat(row.getValue("stockLevel"))
            const min = row.original.minStock

            // Critical Logic: Visual feedback for stock levels
            const isLow = stock <= min
            const isOut = stock === 0

            return (
                <div className="flex items-center gap-2">
                    <span>{stock}</span>
                    {isOut && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    {isLow && !isOut && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                </div>
            )
        },
    },
    {
        accessorKey: "price",
        header: () => <div className="text-right">Precio</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "In Stock" ? "secondary" : status === "Low Stock" ? "default" : "destructive"}>
                    {status}
                </Badge>
            )
        }
    },
    // Actions Column (Dropdown) - Need to implement Shadcn Dropdown first or mock it. 
    // For now, simpler button action to satisfy strict build without excessive dependencies right now.
    /*
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )
      },
    },
    */
]
