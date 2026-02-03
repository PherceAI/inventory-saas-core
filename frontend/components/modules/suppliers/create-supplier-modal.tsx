"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Building2, MapPin, CreditCard, User } from "lucide-react";
import { CreateSupplierDto } from "@/services/suppliers.service";

const formSchema = z.object({
    name: z.string().min(2, "Razón social requerida"),
    taxId: z.string().min(10, "RUC debe tener al menos 10 dígitos").optional().or(z.literal("")),
    contactName: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    paymentTermDays: z.coerce.number().min(0).default(30),
    currency: z.string().default("USD"),
});

// Manual definition to avoid inference issues with default()
type FormValues = {
    name: string;
    taxId?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTermDays: number;
    currency: string;
};

interface CreateSupplierModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateSupplierDto) => Promise<void>;
}

export function CreateSupplierModal({ open, onOpenChange, onSubmit }: CreateSupplierModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            name: "",
            taxId: "",
            contactName: "",
            email: "",
            phone: "",
            address: "",
            paymentTermDays: 30,
            currency: "USD",
        }
    });

    const onFormSubmit = async (data: FormValues) => {
        try {
            setIsSubmitting(true);
            await onSubmit({
                ...data,
                taxId: data.taxId || undefined,
                email: data.email || undefined,
                paymentTermDays: Number(data.paymentTermDays),
            });
            reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 bg-gray-50/50 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-blue-100 rounded-lg text-primary">
                            <Building2 className="w-5 h-5" />
                        </div>
                        Nuevo Proveedor
                    </DialogTitle>
                    <DialogDescription>
                        Registra un nuevo socio comercial. Los campos marcados con * son obligatorios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col">
                    <Tabs defaultValue="general" className="w-full">
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">Información General</TabsTrigger>
                                <TabsTrigger value="contact">Contacto</TabsTrigger>
                                <TabsTrigger value="commercial">Comercial</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 pb-0">
                            <TabsContent value="general" className="space-y-4 m-0">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Razón Social *</Label>
                                        <Input id="name" placeholder="Ej: Distribuidora La Favorita S.A." {...register("name")} />
                                        {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">RUC / Identificación Fiscal</Label>
                                            <Input id="taxId" placeholder="Ej: 1790016919001" {...register("taxId")} />
                                            {errors.taxId && <span className="text-xs text-red-500">{errors.taxId.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Dirección Matriz</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input id="address" className="pl-9" placeholder="Av. Amazonas N-123" {...register("address")} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4 m-0">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contactName">Persona de Contacto</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input id="contactName" className="pl-9" placeholder="Ej: María González" {...register("contactName")} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Teléfono</Label>
                                            <Input id="phone" placeholder="+593 99 123 4567" {...register("phone")} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <Input id="email" type="email" placeholder="pedidos@empresa.com" {...register("email")} />
                                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="commercial" className="space-y-4 m-0">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentTermDays">Días de Crédito</Label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input id="paymentTermDays" type="number" className="pl-9" {...register("paymentTermDays")} />
                                            </div>
                                            <p className="text-[10px] text-gray-500">0 para pago de contado</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Moneda</Label>
                                            <Input value="USD" disabled className="bg-gray-50" />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <DialogFooter className="p-6 pt-4 border-t mt-6 bg-gray-50/50">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Proveedor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
