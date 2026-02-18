"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CategoriesService, Category, CategoryTreeNode } from "@/services/categories.service"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    parentId: z.string().optional(),
    isActive: z.boolean(),
})

interface CategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: Category | null // If present, we are editing
    parentToAssign?: string | null // Pre-fill parent ID
    categories: CategoryTreeNode[]
    onSuccess: () => void
}

export function CategoryDialog({
    open,
    onOpenChange,
    category,
    parentToAssign,
    categories,
    onSuccess
}: CategoryDialogProps) {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            parentId: "root", // 'root' represents null in Select
            isActive: true,
        },
    })

    // Reset form when opening/changing capability
    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
                description: category.description || "",
                parentId: category.parentId || "root",
                isActive: category.isActive ?? true,
            })
        } else {
            form.reset({
                name: "",
                description: "",
                parentId: parentToAssign || "root",
                isActive: true,
            })
        }
    }, [category, parentToAssign, form, open])

    // Flatten tree for select options with depth indicator
    const flattenCategories = (nodes: CategoryTreeNode[], depth = 0): { id: string, name: string, depth: number }[] => {
        let result: { id: string, name: string, depth: number }[] = []
        for (const node of nodes) {
            // Prevent selecting itself or its children as parent when editing
            if (category && (node.id === category.id)) continue

            result.push({ id: node.id, name: node.name, depth })
            if (node.children) {
                result = [...result, ...flattenCategories(node.children, depth + 1)]
            }
        }
        return result
    }

    const flatOptions = flattenCategories(categories)

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true)
            const payload = {
                ...values,
                parentId: values.parentId === "root" ? undefined : values.parentId, // Convert 'root' back to undefined/null
            }

            if (category) {
                await CategoriesService.update(category.id, payload)
                toast({ title: "Categoría actualizada" })
            } else {
                await CategoriesService.create(payload)
                toast({ title: "Categoría creada" })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "No se pudo guardar la categoría",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{category ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
                    <DialogDescription>
                        {category ? "Modifica los detalles de la categoría existente." : "Crea una nueva categoría para organizar tus productos."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Bebidas" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descripción opcional..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="parentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría Padre</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar padre" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="root" className="font-semibold text-primary">
                                                / (Raíz)
                                            </SelectItem>
                                            {flatOptions.map((opt) => (
                                                <SelectItem key={opt.id} value={opt.id}>
                                                    <span style={{ paddingLeft: `${opt.depth * 1.5}rem` }}>
                                                        {opt.depth > 0 && "└─ "} {opt.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {category && (
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Activo</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
