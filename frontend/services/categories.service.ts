import api from './api.service';

export interface Category {
    id: string;
    name: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    _count?: {
        products: number;
        children?: number;
    };
}

export interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[];
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}

export const CategoriesService = {
    /**
     * Get all ACTIVE categories only (default for dropdowns, forms)
     */
    getAll: async (): Promise<Category[]> => {
        const response = await api.get('/categories', {
            params: { isActive: true } // Explicit filter for defense in depth
        });
        // Backend returns paginated response { data: [], meta: {} }
        const result = response.data;
        return Array.isArray(result) ? result : (result.data || []);
    },

    /**
     * Get all categories including inactive (for admin views)
     */
    getAllIncludingInactive: async (): Promise<Category[]> => {
        const response = await api.get('/categories', {
            params: { includeInactive: true }
        });
        const result = response.data;
        return Array.isArray(result) ? result : (result.data || []);
    },

    getTree: async (): Promise<CategoryTreeNode[]> => {
        const response = await api.get('/categories/tree');
        return response.data;
    },

    getById: async (id: string): Promise<Category> => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    create: async (data: CreateCategoryDto): Promise<Category> => {
        const response = await api.post('/categories', data);
        return response.data;
    },

    update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    }
};

