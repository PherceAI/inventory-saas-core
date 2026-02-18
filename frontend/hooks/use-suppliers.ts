import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuppliersService, CreateSupplierDto } from '@/services/suppliers.service';

export const supplierKeys = {
    all: ['suppliers'] as const,
    list: () => [...supplierKeys.all, 'list'] as const,
};

export function useSuppliers() {
    return useQuery({
        queryKey: supplierKeys.list(),
        queryFn: () => SuppliersService.getAll(),
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSupplierDto) => SuppliersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.all });
        },
    });
}
