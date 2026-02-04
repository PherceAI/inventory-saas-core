"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    Pencil,
    Trash2,
    Plus,
    GripVertical,
    Folder
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CategoryTreeNode } from "@/services/categories.service"

interface CategoryTreeItemProps {
    category: CategoryTreeNode
    depth?: number
    onEdit: (category: CategoryTreeNode) => void
    onDelete: (category: CategoryTreeNode) => void
    onAddSub: (parentId: string) => void
}

export function CategoryTreeItem({
    category,
    depth = 0,
    onEdit,
    onDelete,
    onAddSub
}: CategoryTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const hasChildren = category.children && category.children.length > 0

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 bg-slate-100 border border-dashed border-slate-300 rounded-md h-12 mb-2"
            />
        )
    }

    return (
        <div style={style} className="mb-2">
            <div
                ref={setNodeRef}
                className={cn(
                    "group flex items-center justify-between p-2 rounded-lg border bg-white hover:border-primary/20 transition-all",
                    !category.isActive && "opacity-60 bg-slate-50"
                )}
                style={{ marginLeft: `${depth * 1.5}rem` }}
            >
                <div className="flex items-center gap-2 flex-1">
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
                        <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "h-6 w-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500",
                            !hasChildren && "invisible"
                        )}
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-md", category.parentId ? "bg-slate-100" : "bg-primary/10")}>
                            <Folder className={cn("h-4 w-4", category.parentId ? "text-slate-500" : "text-primary")} />
                        </div>
                        <div>
                            <span className="font-medium text-sm text-slate-700">{category.name}</span>
                            {!category.isActive && <Badge variant="outline" className="ml-2 text-[10px] h-5">Incativa</Badge>}
                        </div>
                    </div>
                </div>

                {/* Counts & Actions */}
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400 font-medium">
                        {category._count?.products || 0} productos
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddSub(category.id)}>
                                <Plus className="mr-2 h-4 w-4" /> Añadir Subcategoría
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(category)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Recursive Children */}
            {hasChildren && isExpanded && (
                <div className="mt-2">
                    {category.children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            category={child}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
