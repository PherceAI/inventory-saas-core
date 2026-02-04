"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Tag, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoriesService, CategoryTreeNode } from "@/services/categories.service"
import { CategoryTree } from "./components/category-tree"
import { DeleteAlert } from "./components/delete-alert"
import { CategoryDialog } from "./components/category-dialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function CategoriesSettingsPage() {
    const { toast } = useToast()
    const [categories, setCategories] = useState<CategoryTreeNode[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null)
    const [parentToAssign, setParentToAssign] = useState<string | null>(null)

    const fetchCategories = async () => {
        try {
            setIsLoading(true)
            // Fetch ALL categories as tree (includes inactive if needed, but for now active tree)
            // Backend `getTree` currently returns hierarchical data
            const data = await CategoriesService.getTree()
            setCategories(data)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las categorías",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleCreate = () => {
        setSelectedCategory(null)
        setParentToAssign(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (category: CategoryTreeNode) => {
        setSelectedCategory(category)
        setParentToAssign(null) // Parent is already set in category
        setIsDialogOpen(true)
    }

    const handleAddSub = (parentId: string) => {
        setSelectedCategory(null)
        setParentToAssign(parentId)
        setIsDialogOpen(true)
    }

    // Delete Alert States
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryTreeNode | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = (category: CategoryTreeNode) => {
        setCategoryToDelete(category)
        setDeleteAlertOpen(true)
    }

    const confirmDelete = async () => {
        if (!categoryToDelete) return

        try {
            setIsDeleting(true)
            await CategoriesService.delete(categoryToDelete.id)
            toast({ title: "Categoría eliminada" })
            fetchCategories()
            setDeleteAlertOpen(false)
        } catch (error: any) {
            console.error(error)
            toast({
                title: "Error al eliminar",
                description: error.response?.data?.message || "No se pudo eliminar la categoría",
                variant: "destructive"
            })
            // Don't close text to let user retry or see error
        } finally {
            setIsDeleting(false)
        }
    }

    const handleReorder = () => {
        fetchCategories() // Refresh tree after DnD
    }

    // Filter tree clientside for search (simple implementation)
    // For deep tree filtering, we would need a recursive filter.
    // For now, let's just match top level or flatten? 
    // Or just filter visual top level for MVP if list is small.
    // Better: If search is present, flatten list and show matches?
    // Let's keep it simple: Show full tree, maybe highlight? 
    // Or just rely on backend search if we implemented it properly?
    // Backend `findAll` supports search but returns flat list. `getTree` does not support search yet.
    // Let's skip search filtering on the tree for this iteration to keep structure intact.

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Categorías</h1>
                    <p className="text-slate-500 mt-1">Organiza tu inventario en una estructura jerárquica.</p>
                </div>
                <Button onClick={handleCreate} className="shadow-lg shadow-primary/25">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
                </Button>
            </div>

            <Separator />

            {/* Content */}
            <div className="grid gap-6">
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Tag className="h-5 w-5 text-primary" />
                                Estructura del Catálogo
                            </CardTitle>
                            <div className="relative w-64 hidden md:block">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar..."
                                    className="pl-9 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <CardDescription>
                            Arrastra y suelta para reordenar las categorías. Usa el menú para más opciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                                <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                                    <Tag className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">Sin categorías</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                    No hay categorías definidas. Crea la primera para empezar.
                                </p>
                                <Button variant="outline" onClick={handleCreate}>
                                    Crear Categoría
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border p-4 shadow-sm min-h-[300px]">
                                <CategoryTree
                                    data={categories}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onAddSub={handleAddSub}
                                    onReorder={handleReorder}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CategoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                category={selectedCategory}
                parentToAssign={parentToAssign}
                categories={categories}
                onSuccess={fetchCategories}
            />

            <DeleteAlert
                open={deleteAlertOpen}
                onOpenChange={setDeleteAlertOpen}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Eliminar Categoría"
                description={`¿Estás seguro que deseas eliminar "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
            />
        </div>
    )
}
