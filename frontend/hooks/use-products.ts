import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products.service';

export interface ProductData {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    categoryId: string;
    stockMin: number;
    stockLevel?: number;
    priceDefault?: number;
    costAverage?: number;
    category?: { name: string };
    categoryName?: string;
    batches?: any[];
    [key: string]: any;
}

export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await ProductsService.getAll({ limit: 100 });
            // Handle both pagination wrapper and direct array response
            return (response.data || response || []) as ProductData[];
        },
    });
}
