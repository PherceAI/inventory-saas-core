
"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, UserCog, Shield, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { TenantUser } from "@/lib/api/users";

interface UsersTableProps {
    users: TenantUser[];
    isLoading: boolean;
    onRemove: (userId: string) => void;
    currentUserId?: string;
}

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    OWNER: "default",
    ADMIN: "default",
    MANAGER: "secondary",
    OPERATOR: "outline",
    VIEWER: "outline",
};

export function UsersTable({ users, isLoading, onRemove, currentUserId }: UsersTableProps) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando equipo...</div>;
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50/50">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Aún no tienes equipo</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
                    Invita a tus colaboradores para gestionar el inventario juntos.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="w-[300px]">Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Último Acceso</TableHead>
                        <TableHead>Miembro desde</TableHead>
                        <TableHead className="w-[80px] text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.userId} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                        {user.firstName[0]}{user.lastName[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">
                                            {user.firstName} {user.lastName}
                                            {user.userId === currentUserId && <span className="ml-2 text-xs text-muted-foreground">(Tú)</span>}
                                        </span>
                                        <span className="text-xs text-gray-500">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={roleColors[user.role] || "outline"} className="capitalize font-normal">
                                    {user.role === 'OWNER' && <Shield className="w-3 h-3 mr-1" />}
                                    {user.role.toLowerCase()}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                                {user.lastLoginAt
                                    ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true, locale: es })
                                    : "Nunca"}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                                {new Date(user.joinedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                {user.role !== 'OWNER' && user.userId !== currentUserId && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => { }}>
                                                <UserCog className="mr-2 h-4 w-4" /> Editar Rol
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onRemove(user.userId)}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
