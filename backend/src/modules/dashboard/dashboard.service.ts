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
     * Count products where current stock < stockMin (raw SQL with fallback)
     */
    private async countLowStockProducts(tenantId: string): Promise<number> {
        try {
            const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
                SELECT COUNT(*)::bigint as count FROM (
                    SELECT p.id
                    FROM products p
                    LEFT JOIN batches b ON b."productId" = p.id
                        AND b."isExhausted" = false
                        AND b."tenantId" = ${tenantId}::uuid
                    WHERE p."tenantId" = ${tenantId}::uuid
                        AND p."isActive" = true
                    GROUP BY p.id, p."stockMin"
                    HAVING COALESCE(SUM(b."quantityCurrent"), 0::decimal) > 0::decimal
                        AND COALESCE(SUM(b."quantityCurrent"), 0::decimal) < p."stockMin"
                ) AS low_stock
            `;
            return Number(result[0]?.count ?? 0);
        } catch (error) {
            this.logger.error(`Error in countLowStockProducts raw query: ${error.message}`, error.stack);
            // Fallback: Fetch all active products and calculate in memory
            const products = await this.prisma.product.findMany({
                where: { tenantId, isActive: true },
                select: { stockMin: true, id: true },
            });
            // We need batches for these products... this is N+1 if not careful, better to fetch batches separately?
            // Actually, for fallback, just do one big query with include if limits allow, or better:
            // Fetch all non-exhausted batches and map them.
            const batches = await this.prisma.batch.findMany({
                where: { tenantId, isExhausted: false },
                select: { productId: true, quantityCurrent: true },
            });

            const stockMap = new Map<string, number>();
            for (const batch of batches) {
                const current = stockMap.get(batch.productId) || 0;
                stockMap.set(batch.productId, current + Number(batch.quantityCurrent));
            }

            let count = 0;
            for (const p of products) {
                const stock = stockMap.get(p.id) || 0;
                if (stock > 0 && stock < Number(p.stockMin)) {
                    count++;
                }
            }
            return count;
        }
    }

    /**
     * Count products with zero stock (raw SQL with fallback)
     */
    private async countOutOfStockProducts(tenantId: string): Promise<number> {
        try {
            const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
                SELECT COUNT(*)::bigint as count FROM (
                    SELECT p.id
                    FROM products p
                    LEFT JOIN batches b ON b."productId" = p.id
                        AND b."isExhausted" = false
                        AND b."tenantId" = ${tenantId}::uuid
                    WHERE p."tenantId" = ${tenantId}::uuid
                        AND p."isActive" = true
                    GROUP BY p.id
                    HAVING COALESCE(SUM(b."quantityCurrent"), 0::decimal) = 0::decimal
                ) AS out_of_stock
            `;
            return Number(result[0]?.count ?? 0);
        } catch (error) {
            this.logger.error(`Error in countOutOfStockProducts raw query: ${error.message}`, error.stack);
            // Fallback
            const products = await this.prisma.product.findMany({
                where: { tenantId, isActive: true },
                select: { id: true },
            });

            const batches = await this.prisma.batch.findMany({
                where: { tenantId, isExhausted: false },
                select: { productId: true, quantityCurrent: true },
            });

            const stockMap = new Map<string, number>();
            for (const batch of batches) {
                const current = stockMap.get(batch.productId) || 0;
                stockMap.set(batch.productId, current + Number(batch.quantityCurrent));
            }

            let count = 0;
            for (const p of products) {
                const stock = stockMap.get(p.id) || 0;
                if (stock === 0) {
                    count++;
                }
            }
            return count;
        }
    }

    /**
     * Calculate total inventory value (raw SQL with fallback)
     */
    private async calculateInventoryValue(tenantId: string): Promise<number> {
        try {
            const result = await this.prisma.$queryRaw<[{ total: number | null }]>`
                SELECT COALESCE(SUM("quantityCurrent" * "unitCost"), 0::decimal)::float8 as total
                FROM batches
                WHERE "tenantId" = ${tenantId}::uuid
                    AND "isExhausted" = false
            `;
            const total = Number(result[0]?.total ?? 0);
            return Math.round(total * 100) / 100;
        } catch (error) {
            this.logger.error(`Error in calculateInventoryValue raw query: ${error.message}`, error.stack);
            // Fallback
            const batches = await this.prisma.batch.findMany({
                where: { tenantId, isExhausted: false },
                select: { quantityCurrent: true, unitCost: true },
            });

            const total = batches.reduce((sum, b) => sum + (Number(b.quantityCurrent) * Number(b.unitCost)), 0);
            return Math.round(total * 100) / 100;
        }
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
