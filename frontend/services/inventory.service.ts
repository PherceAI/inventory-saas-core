import api from './api.service';

export interface CreateInboundDto {
    productId: string;
    warehouseId: string;
    quantity: number;
    unitCost: number;
    supplierId?: string;
    batchNumber?: string;
    expiresAt?: string;
    notes?: string;
    // New fields for logic fix
    invoiceNumber?: string;
    issueDate?: string;
    createPayable?: boolean;
    paymentTermDays?: number;
}

export const InventoryService = {
    registerInbound: async (data: CreateInboundDto) => {
        const response = await api.post('/inventory/inbound', data);
        return response.data;
    },

    registerOutbound: async (data: any) => {
        const response = await api.post('/inventory/outbound', data);
        return response.data;
    },

    registerTransfer: async (data: any) => {
        const response = await api.post('/inventory/transfer', data);
        return response.data;
    },

    getAllMovements: async (params?: any) => {
        const response = await api.get('/inventory/movements', { params });
        return response.data;
    }
};
