import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService, CreateProductDto, Product } from '@/services/products.service';

export interface ProductWithBatches extends Product {
    batches?: any[];
    categoryName?: string;
    [key: string]: any;
}

export const productKeys = {
    all: ['products'] as const,
    list: (params?: any) => [...productKeys.all, 'list', params] as const,
    detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};

export function useProducts(params?: { limit?: number; page?: number; term?: string }) {
    return useQuery<ProductWithBatches[]>({
        queryKey: productKeys.list(params),
        queryFn: async () => {
            const data = await ProductsService.getAll(params);
            // Robust handling of response format
            if (Array.isArray(data)) return data as ProductWithBatches[];
            if (data && Array.isArray((data as any).data)) return (data as any).data as ProductWithBatches[];
            return [] as ProductWithBatches[];
        },
    });
}

export function useProduct(term: string) {
    return useQuery<ProductWithBatches>({
        queryKey: productKeys.detail(term),
        queryFn: () => ProductsService.findByTerm(term),
        enabled: !!term,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProductDto) => ProductsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });
}
