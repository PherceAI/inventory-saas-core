
import api from '@/services/api.service';

export interface TenantUser {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
    lastLoginAt: string | null;
    joinedAt: string;
}

export interface InviteUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password?: string;
}

export const usersService = {
    getUsers: async (tenantId: string) => {
        const { data } = await api.get<TenantUser[]>(`/tenants/${tenantId}/users`);
        return data;
    },

    inviteUser: async (tenantId: string, payload: InviteUserPayload) => {
        const { data } = await api.post(`/tenants/${tenantId}/users`, payload);
        return data;
    },

    removeUser: async (tenantId: string, userId: string) => {
        const { data } = await api.delete(`/tenants/${tenantId}/users/${userId}`);
        return data;
    }
};
