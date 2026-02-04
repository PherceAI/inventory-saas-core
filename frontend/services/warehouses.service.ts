import api from './api.service';

export interface Warehouse {
    id: string;
    name: string;
    code?: string;
    address?: string;
    isActive: boolean;
    isDefault?: boolean;
}

export interface CreateWarehouseDto {
    name: string;
    code?: string;
    address?: string;
    isDefault?: boolean;
}

export const WarehousesService = {
    getAll: async () => {
        const response = await api.get<Warehouse[]>('/warehouses');
        return response.data;
    },

    create: async (data: CreateWarehouseDto) => {
        const response = await api.post<Warehouse>('/warehouses', data);
        return response.data;
    }
};
