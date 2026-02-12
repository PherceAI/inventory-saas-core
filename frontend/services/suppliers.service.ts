import api from './api.service';

export interface Supplier {
    id: string;
    code: string;
    name: string;
    taxId?: string; // RUC
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTermDays: number;
    currency: string;
    rating?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplierDto {
    name: string;
    taxId?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTermDays?: number;
    currency?: string;
    code?: string;
}

export const SuppliersService = {
    getAll: async () => {
        const response = await api.get<{ data: Supplier[] }>('/suppliers', {
            params: { limit: 100 } // Get all for dropdowns for now
        });
        return response.data.data; // Extract array from pagination wrapper
    },

    create: async (data: CreateSupplierDto) => {
        const response = await api.post<Supplier>('/suppliers', data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/suppliers/${id}`);
    }
};
