import api from './api.service';

export enum PayableStatus {
    CURRENT = 'CURRENT',
    DUE_SOON = 'DUE_SOON',
    OVERDUE = 'OVERDUE',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED'
}

export interface AccountPayable {
    id: string;
    supplier: {
        id: string;
        name: string;
    };
    invoiceNumber: string | null;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: PayableStatus;
    issueDate: string;
    dueDate: string;
    notes?: string;
    purchaseOrder?: {
        id: string;
        orderNumber: string;
    };
}

export interface PayableSummary {
    current: { count: number; total: number };
    dueSoon: { count: number; total: number };
    overdue: { count: number; total: number };
    paid: { count: number; total: number };
}

export const AccountsPayableService = {
    getAll: async (params?: { page?: number; limit?: number; status?: string; supplierId?: string }) => {
        const response = await api.get('/accounts-payable', { params });
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get('/accounts-payable/summary');
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get(`/accounts-payable/${id}`);
        return response.data;
    },

    registerPayment: async (id: string, data: { amount: number; paymentMethod: string; reference?: string; notes?: string; paidAt?: string }) => {
        const response = await api.post(`/accounts-payable/${id}/payments`, data);
        return response.data;
    }
};
