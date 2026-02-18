import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchaseOrdersService, CreatePurchaseOrderDto, AddOrderItemDto } from '@/services/purchase-orders.service';

export const purchaseOrderKeys = {
    all: ['purchase-orders'] as const,
    list: () => [...purchaseOrderKeys.all, 'list'] as const,
    detail: (id: string) => [...purchaseOrderKeys.all, 'detail', id] as const,
};

export function usePurchaseOrders() {
    return useQuery({
        queryKey: purchaseOrderKeys.list(),
        queryFn: () => PurchaseOrdersService.getAll(),
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePurchaseOrderDto) => PurchaseOrdersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
        },
    });
}

export function useAddPurchaseOrderItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, item }: { orderId: string; item: AddOrderItemDto }) =>
            PurchaseOrdersService.addItem(orderId, item),
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(orderId) });
            queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
        },
    });
}
