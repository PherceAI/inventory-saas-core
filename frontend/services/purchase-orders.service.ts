import api from './api.service';

export interface CreatePurchaseOrderDto {
    supplierId: string;
    expectedDeliveryDate?: string;
    paymentTerms?: string;
    notes?: string;
}

export interface AddOrderItemDto {
    productId: string;
    quantityOrdered: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
}

export interface PurchaseOrder {
    id: string;
    status: string;
    supplierId: string;
    // ...
}

export const PurchaseOrdersService = {
    create: async (data: CreatePurchaseOrderDto) => {
        const response = await api.post<PurchaseOrder>('/purchase-orders', data);
        return response.data;
    },

    addItem: async (orderId: string, item: AddOrderItemDto) => {
        const response = await api.post<any>(`/purchase-orders/${orderId}/items`, item);
        return response.data;
    },

    send: async (orderId: string) => {
        const response = await api.post<any>(`/purchase-orders/${orderId}/send`);
        return response.data;
    },

    getAll: async () => {
        const response = await api.get<PurchaseOrder[]>('/purchase-orders');
        return response.data;
    }
};
