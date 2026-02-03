
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, ShieldAlert } from "lucide-react";

const formSchema = z.object({
    firstName: z.string().min(2, "Nombre requerido"),
    lastName: z.string().min(2, "Apellido requerido"),
    email: z.string().email("Email inválido"),
    role: z.enum(["ADMIN", "MANAGER", "OPERATOR", "VIEWER"]),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

// Export this type so the parent page can use it
export type InviteUserFormValues = z.infer<typeof formSchema>;


interface InviteUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: InviteUserFormValues) => Promise<void>;
}

export function InviteUserModal({ open, onOpenChange, onSubmit }: InviteUserModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<InviteUserFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: "OPERATOR",
        }
    });

    const selectedRole = watch("role");

    const onFormSubmit = async (data: InviteUserFormValues) => {
        try {
            setIsSubmitting(true);
            await onSubmit(data);
            reset();
            onOpenChange(false);
        } catch (error) {
            // Error handling is up to the parent
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Crea una cuenta para un nuevo miembro del equipo. Se le enviará un correo con sus credenciales (Simulado).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" placeholder="Juan" {...register("firstName")} />
                            {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" placeholder="Pérez" {...register("lastName")} />
                            {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Corporativo</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input id="email" className="pl-9" placeholder="juan.perez@empresa.com" {...register("email")} />
                        </div>
                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña Temporal</Label>
                        <Input id="password" type="password" placeholder="••••••" {...register("password")} />
                        <p className="text-xs text-gray-500">El usuario podrá cambiarla al iniciar sesión.</p>
                        {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                    </div>

                    <div className="space-y-4 pt-2">
                        <Label>Rol de Acceso</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Custom Radio-like Selection Cards */}
                            <div
                                className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 ${selectedRole === 'ADMIN' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                onClick={() => setValue('role', 'ADMIN')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-sm">Administrador</span>
                                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                                </div>
                                <p className="text-xs text-gray-500">Acceso total a configuración, usuarios y finanzas.</p>
                            </div>

                            <div
                                className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 ${selectedRole === 'OPERATOR' ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                                onClick={() => setValue('role', 'OPERATOR')}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-sm">Operador</span>
                                    <Badge variant="outline" className="text-[10px] h-5">Bodega</Badge>
                                </div>
                                <p className="text-xs text-gray-500">Solo puede registrar movimientos de inventario.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Invitación
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
