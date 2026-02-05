import api from './api.service';

export interface CreateAuditDto {
    warehouseId: string;
    name?: string;
    notes?: string;
    scheduledAt?: string;
}

export interface UpdateAuditItemDto {
    quantityCounted: number;
    notes?: string;
}

export interface AuditItem {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
        sku: string;
    };
    systemStock: number;
    countedStock: number | null;
    variance: number | null;
    notes?: string;
    isAdjusted?: boolean;
}

export interface Audit {
    id: string;
    code: string;
    name?: string;
    warehouseId: string;
    warehouse?: { id: string; name: string };
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    scheduledAt?: string;
    startedAt?: string;
    completedAt?: string;
    totalVariance?: number;
    varianceCost?: number;
    notes?: string;
    items?: AuditItem[];
    _count?: { items: number };
}

export const AuditsService = {
    /**
     * Create a new audit - this will snapshot system stock for the warehouse
     */
    create: async (data: CreateAuditDto): Promise<Audit> => {
        const response = await api.post('/audits', data);
        return response.data;
    },

    /**
     * Get all audits with optional filters
     */
    getAll: async (params?: { warehouseId?: string; status?: string }): Promise<Audit[]> => {
        const response = await api.get('/audits', { params });
        return response.data;
    },

    /**
     * Get single audit with items (snapshot)
     */
    getById: async (id: string): Promise<Audit> => {
        const response = await api.get(`/audits/${id}`);
        return response.data;
    },

    /**
     * Update a single item's counted stock
     */
    updateItem: async (auditId: string, itemId: string, data: UpdateAuditItemDto): Promise<AuditItem> => {
        const response = await api.patch(`/audits/${auditId}/items/${itemId}`, data);
        return response.data;
    },

    /**
     * Close audit and generate inventory adjustments
     */
    close: async (id: string): Promise<Audit> => {
        const response = await api.post(`/audits/${id}/close`);
        return response.data;
    }
};
