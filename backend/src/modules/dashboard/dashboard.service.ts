import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import { Decimal } from '@prisma/client/runtime/library';

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
        createdAt: Date;
    }[];
}

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get dashboard statistics for a tenant
     * Returns all zeros for new tenants (no seed data)
     */
    async getStats(tenantId: string): Promise<DashboardStats> {
        this.logger.debug(`Fetching dashboard stats for tenant: ${tenantId}`);

        // Run all queries in parallel for performance
        const [
            productsCount,
            lowStockProducts,
            outOfStockProducts,
            suppliersCount,
            activeSuppliersCount,
            purchaseOrdersCount,
            pendingOrdersCount,
            receivedOrdersCount,
            warehousesCount,
            inventoryValue,
            totalBatches,
            recentMovements,
        ] = await Promise.all([
            // Products
            this.prisma.product.count({ where: { tenantId, isActive: true } }),
            this.countLowStockProducts(tenantId),
            this.countOutOfStockProducts(tenantId),

            // Suppliers
            this.prisma.supplier.count({ where: { tenantId } }),
            this.prisma.supplier.count({ where: { tenantId, isActive: true } }),

            // Purchase Orders
            this.prisma.purchaseOrder.count({ where: { tenantId } }),
            this.prisma.purchaseOrder.count({
                where: { tenantId, status: { in: ['PENDING', 'APPROVED', 'ORDERED'] } },
            }),
            this.prisma.purchaseOrder.count({
                where: { tenantId, status: 'RECEIVED' },
            }),

            // Warehouses
            this.prisma.warehouse.count({ where: { tenantId, isActive: true } }),

            // Inventory value (sum of batch quantities * unit cost)
            this.calculateInventoryValue(tenantId),
            this.prisma.batch.count({
                where: { tenantId, isExhausted: false },
            }),

            // Recent movements for activity feed
            this.getRecentActivity(tenantId),
        ]);

        const stats: DashboardStats = {
            products: {
                total: productsCount,
                lowStock: lowStockProducts,
                outOfStock: outOfStockProducts,
            },
            suppliers: {
                total: suppliersCount,
                active: activeSuppliersCount,
            },
            purchaseOrders: {
                total: purchaseOrdersCount,
                pending: pendingOrdersCount,
                received: receivedOrdersCount,
            },
            inventory: {
                totalValue: inventoryValue,
                totalItems: totalBatches,
                movements: await this.prisma.inventoryMovement.count({
                    where: { tenantId },
                }),
            },
            warehouses: {
                total: warehousesCount,
            },
            recentActivity: recentMovements,
        };

        this.logger.debug(`Dashboard stats: ${JSON.stringify(stats)}`);
        return stats;
    }

    /**
     * Count products where current stock < stockMin
     */
    private async countLowStockProducts(tenantId: string): Promise<number> {
        // Get products with their batch quantities
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true },
            select: {
                id: true,
                stockMin: true,
                batches: {
                    where: { isExhausted: false },
                    select: { quantityCurrent: true },
                },
            },
        });

        let lowStockCount = 0;
        for (const product of products) {
            const totalStock = product.batches.reduce(
                (sum, batch) => sum + Number(batch.quantityCurrent),
                0,
            );
            if (totalStock > 0 && totalStock < Number(product.stockMin)) {
                lowStockCount++;
            }
        }
        return lowStockCount;
    }

    /**
     * Count products with zero stock
     */
    private async countOutOfStockProducts(tenantId: string): Promise<number> {
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true },
            select: {
                id: true,
                batches: {
                    where: { isExhausted: false },
                    select: { quantityCurrent: true },
                },
            },
        });

        let outOfStockCount = 0;
        for (const product of products) {
            const totalStock = product.batches.reduce(
                (sum, batch) => sum + Number(batch.quantityCurrent),
                0,
            );
            if (totalStock === 0) {
                outOfStockCount++;
            }
        }
        return outOfStockCount;
    }

    /**
     * Calculate total inventory value from batches
     */
    private async calculateInventoryValue(tenantId: string): Promise<number> {
        const batches = await this.prisma.batch.findMany({
            where: { tenantId, isExhausted: false },
            select: {
                quantityCurrent: true,
                unitCost: true,
            },
        });

        const totalValue = batches.reduce((sum, batch) => {
            const value =
                Number(batch.quantityCurrent) * Number(batch.unitCost);
            return sum + value;
        }, 0);

        return Math.round(totalValue * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get recent activity for the activity feed
     */
    private async getRecentActivity(
        tenantId: string,
    ): Promise<DashboardStats['recentActivity']> {
        const movements = await this.prisma.inventoryMovement.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                product: { select: { name: true } },
            },
        });

        return movements.map((m) => ({
            id: m.id,
            type: 'movement' as const,
            description: `${m.type === 'IN' ? 'Ingreso' : 'Salida'}: ${m.product.name} (${m.quantity} unidades)`,
            amount: m.totalCost ? Number(m.totalCost) : undefined,
            createdAt: m.createdAt,
        }));
    }
}
