import api from './api.service';

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierName: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    total: number;
    expectedAt: string | null;
    createdAt: string;
}

export interface PurchaseOrdersResponse {
    data: PurchaseOrder[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Get all purchase orders for the current tenant
 */
export const getOrders = async (): Promise<PurchaseOrder[]> => {
    try {
        const response = await api.get<PurchaseOrdersResponse>('/purchase-orders');
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return [];
    }
};

/**
 * Get a single purchase order by ID
 */
export const getOrderById = async (id: string): Promise<PurchaseOrder | null> => {
    try {
        const response = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        return null;
    }
};
