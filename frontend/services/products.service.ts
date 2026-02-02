import api from './api.service';

export interface CreateProductDto {
    name: string;
    sku: string;
    description?: string;
    categoryId: string;
    familyId?: string;
    barcode?: string;
    stockMin?: number;
    stockIdeal?: number;
    stockMax?: number;
    costAverage?: number;
    priceDefault?: number;
    isService?: boolean;
    hasExpiry?: boolean;
    trackBatches?: boolean;
    isActive?: boolean;
}

export const ProductsService = {
    // ... existing methods
    getAll: async (params?: { limit?: number; page?: number; term?: string }) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    findByTerm: async (term: string) => {
        const response = await api.get(`/products/${term}`);
        return response.data;
    },

    create: async (data: CreateProductDto) => {
        const response = await api.post('/products', data);
        return response.data;
    }
};
