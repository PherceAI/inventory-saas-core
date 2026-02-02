import api from './api.service';

export interface Supplier {
    id: string;
    name: string;
    // Add other fields as needed
}

export const SuppliersService = {
    getAll: async () => {
        const response = await api.get<Supplier[]>('/suppliers');
        return response.data;
    },

    // Potentially add create/update methods later
};
