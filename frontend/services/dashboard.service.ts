import api from './api.service';

export interface DashboardStats {
    products: {
        total: number;
        lowStock: number;
        outOfStock: number;
    };
    suppliers: {
        total: number;
        active: number;
    };
    purchaseOrders: {
        total: number;
        pending: number;
        received: number;
    };
    inventory: {
        totalValue: number;
        totalItems: number;
        movements: number;
    };
    warehouses: {
        total: number;
    };
    recentActivity: {
        id: string;
        type: 'movement' | 'order' | 'product';
        description: string;
        amount?: number;
        createdAt: string;
    }[];
}

/**
 * Get empty stats (for new tenants or error states)
 */
export const getEmptyStats = (): DashboardStats => ({
    products: { total: 0, lowStock: 0, outOfStock: 0 },
    suppliers: { total: 0, active: 0 },
    purchaseOrders: { total: 0, pending: 0, received: 0 },
    inventory: { totalValue: 0, totalItems: 0, movements: 0 },
    warehouses: { total: 0 },
    recentActivity: [],
});

/**
 * Fetch dashboard statistics from the backend
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return empty stats on error - this is fine for new tenants
        return getEmptyStats();
    }
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-MX').format(value);
};
