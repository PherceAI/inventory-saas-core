
"use client";

import { useEffect, useState, useCallback } from "react";
import { UsersTable } from "@/components/modules/settings/users-table";
import { InviteUserModal, InviteUserFormValues } from "@/components/modules/settings/invite-user-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usersService, TenantUser } from "@/lib/api/users";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth.context";

export default function UsersSettingsPage() {
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();
    const { currentTenant, user: currentUser } = useAuth();

    const loadUsers = useCallback(async () => {
        if (!currentTenant?.id) return;

        try {
            setIsLoading(true);
            const data = await usersService.getUsers(currentTenant.id);
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error al cargar equipo",
                description: "No se pudieron obtener los usuarios del tenant.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [currentTenant?.id, toast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleInviteUser = async (data: InviteUserFormValues) => {
        if (!currentTenant?.id) return;

        try {
            await usersService.inviteUser(currentTenant.id, data);
            toast({
                title: "Invitación enviada",
                description: `Se ha creado el usuario para ${data.email}.`,
            });
            loadUsers(); // Refresh list
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: "Error al invitar",
                description: err.response?.data?.message || "Ocurrió un error inesperado.",
                variant: "destructive",
            });
            throw error; // Re-throw to handle form state in modal
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!currentTenant?.id) return;

        if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

        try {
            await usersService.removeUser(currentTenant.id, userId);
            toast({
                title: "Usuario eliminado",
                description: "El usuario ha perdido acceso al tenant.",
            });
            // Optimistic update or refresh
            setUsers(users.filter(u => u.userId !== userId));
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: "Error al eliminar",
                description: err.response?.data?.message || "No se pudo eliminar el usuario.",
                variant: "destructive",
            });
        }
    };

    if (!currentTenant) {
        return <div className="p-8">No hay tenant seleccionado.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Equipo y Acceso</h1>
                    <p className="text-muted-foreground">
                        Gestiona quién tiene acceso a <strong>{currentTenant.name}</strong>.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Invitar Miembro
                </Button>
            </div>

            <UsersTable
                users={users}
                isLoading={isLoading}
                onRemove={handleRemoveUser}
                currentUserId={currentUser?.id}
            />

            <InviteUserModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleInviteUser}
            />
        </div>
    );
}
