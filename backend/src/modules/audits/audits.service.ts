import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import {
    CreateAuditDto,
    UpdateAuditItemDto,
    QueryAuditsDto,
} from './dto/index.js';
import { AuditStatus, MovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AuditsService {
    private readonly logger = new Logger(AuditsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateAuditDto) {
        // SECURITY: Using findFirst with tenantId to ensure isolation
        const warehouse = await this.prisma.warehouse.findFirst({
            where: { id: dto.warehouseId, tenantId },
        });

        if (!warehouse) {
            throw new NotFoundException('Bodega no encontrada');
        }

        // 1. Get all active products for the tenant
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true },
            select: { id: true },
        });

        if (products.length === 0) {
            throw new BadRequestException('No hay productos para auditar');
        }

        // 2. Wrap creation in transaction to snapshot stock
        return this.prisma.$transaction(async (tx) => {
            // Create Audit Header
            const audit = await tx.inventoryAudit.create({
                data: {
                    tenantId,
                    warehouseId: dto.warehouseId,
                    code: `AUD-${Date.now()}`, // Simple unique code
                    name: dto.name,
                    scheduledAt: dto.scheduledAt,
                    status: AuditStatus.PENDING,
                    notes: dto.notes,
                },
            });

            // Create Items with System Stock Snapshot
            const itemsData: {
                tenantId: string;
                auditId: string;
                productId: string;
                systemStock: Decimal;
            }[] = [];

            for (const product of products) {
                // Calculate current stock in this warehouse
                const stockAgg = await tx.batch.aggregate({
                    _sum: { quantityCurrent: true },
                    where: {
                        tenantId,
                        warehouseId: dto.warehouseId,
                        productId: product.id,
                        isExhausted: false,
                    },
                });

                const systemStock = stockAgg._sum.quantityCurrent || new Decimal(0);

                itemsData.push({
                    tenantId,
                    auditId: audit.id,
                    productId: product.id,
                    systemStock,
                });
            }

            await tx.inventoryAuditItem.createMany({
                data: itemsData,
            });

            return audit;
        });
    }

    async findAll(tenantId: string, query: QueryAuditsDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.inventoryAudit.findMany({
                where: {
                    tenantId,
                    warehouseId: query.warehouseId,
                    status: query.status,
                },
                include: {
                    warehouse: { select: { name: true } },
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.inventoryAudit.count({
                where: {
                    tenantId,
                    warehouseId: query.warehouseId,
                    status: query.status,
                },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(tenantId: string, id: string) {
        // SECURITY FIX: Filter by tenantId in query to prevent data leakage
        const audit = await this.prisma.inventoryAudit.findFirst({
            where: { id, tenantId },
            include: {
                warehouse: true,
                items: {
                    include: { product: true },
                    orderBy: { product: { name: 'asc' } },
                },
            },
        });

        if (!audit) {
            throw new NotFoundException('Auditoría no encontrada');
        }

        return audit;
    }

    async updateItem(
        tenantId: string,
        auditId: string,
        itemId: string,
        dto: UpdateAuditItemDto,
    ) {
        const item = await this.prisma.inventoryAuditItem.findUnique({
            where: { id: itemId },
            include: { audit: true },
        });

        if (!item || item.audit.tenantId !== tenantId) {
            throw new NotFoundException('Ítem de auditoría no encontrado');
        }

        if (item.audit.status === AuditStatus.COMPLETED || item.audit.status === AuditStatus.CANCELLED) {
            throw new BadRequestException('No se puede modificar una auditoría cerrada');
        }

        // Auto-start audit if PENDING
        if (item.audit.status === AuditStatus.PENDING) {
            await this.prisma.inventoryAudit.update({
                where: { id: auditId },
                data: { status: AuditStatus.IN_PROGRESS, startedAt: new Date() },
            });
        }

        // Calculate variance
        const quantityCounted = new Decimal(dto.quantityCounted);
        const variance = quantityCounted.minus(item.systemStock);

        return this.prisma.inventoryAuditItem.update({
            where: { id: itemId },
            data: {
                countedStock: quantityCounted,
                variance,
                notes: dto.notes,
            },
        });
    }

    async close(tenantId: string, auditId: string, userId: string) {
        const audit = await this.findOne(tenantId, auditId);

        if (audit.status !== AuditStatus.IN_PROGRESS && audit.status !== AuditStatus.PENDING) {
            throw new BadRequestException('La auditoría no está en progreso');
        }

        return this.prisma.$transaction(async (tx) => {
            let totalVariance = new Decimal(0);
            let varianceCost = new Decimal(0);

            const items = await tx.inventoryAuditItem.findMany({
                where: { auditId },
                include: { product: true },
            });

            for (const item of items) {
                if (item.countedStock === null) continue; // Skip uncounted items (or assume 0? Safer to skip)

                const variance = item.variance || new Decimal(0);

                if (!variance.equals(0)) {
                    // Get average cost or last cost for validation
                    // Ideally we should have unitCost snapshot, but let's take average from batches or product cost (if exists)
                    // Fallback to 0 if no cost found (should be improved)
                    const latestBatch = await tx.batch.findFirst({
                        where: { tenantId, productId: item.productId, quantityCurrent: { gt: 0 } },
                        orderBy: { receivedAt: 'desc' }
                    });
                    const unitCost = latestBatch?.unitCost || new Decimal(0);

                    const itemVarianceCost = variance.mul(unitCost);
                    varianceCost = varianceCost.add(itemVarianceCost);
                    totalVariance = totalVariance.add(variance); // Amount variance

                    // Create adjustment movement
                    if (variance.greaterThan(0)) {
                        // Surplus: Create IN movement (Positive Adjustment)
                        // We need to create a new batch for the surplus? Or add to existing?
                        // Best practice: Create new Batch "AUDIT-SURPLUS"
                        const batch = await tx.batch.create({
                            data: {
                                tenantId,
                                productId: item.productId,
                                warehouseId: audit.warehouseId,
                                batchNumber: `AUDIT-${audit.code}-${item.product.sku}`,
                                quantityInitial: variance,
                                quantityCurrent: variance,
                                unitCost, // Use latest cost
                                receivedAt: new Date(),
                                metadata: { auditId },
                            }
                        });

                        await tx.inventoryMovement.create({
                            data: {
                                tenantId,
                                productId: item.productId,
                                batchId: batch.id,
                                warehouseDestinationId: audit.warehouseId,
                                type: MovementType.AUDIT,
                                quantity: variance,
                                stockBefore: item.systemStock, // Approximation
                                stockAfter: item.systemStock.add(variance),
                                unitCost,
                                totalCost: itemVarianceCost,
                                referenceType: 'AUDIT',
                                referenceId: audit.id,
                                performedById: userId,
                                notes: `Ajuste por sobrante en auditoría ${audit.code}`,
                            }
                        });

                        // Update item adjusted status
                        await tx.inventoryAuditItem.update({
                            where: { id: item.id },
                            data: { isAdjusted: true, varianceCost: itemVarianceCost }
                        });

                    } else {
                        // Deficit: Create OUT movement (Negative Adjustment)
                        // Need to consume from batches (FIFO preferably)
                        const varianceAbs = variance.abs();
                        let remainingToConsume = varianceAbs;

                        const batchesToConsume = await tx.batch.findMany({
                            where: {
                                tenantId,
                                productId: item.productId,
                                warehouseId: audit.warehouseId,
                                quantityCurrent: { gt: 0 }
                            },
                            orderBy: { receivedAt: 'asc' } // FIFO
                        });

                        for (const batch of batchesToConsume) {
                            if (remainingToConsume.lte(0)) break;

                            const quantityToTake = Decimal.min(batch.quantityCurrent, remainingToConsume);

                            await tx.batch.update({
                                where: { id: batch.id },
                                data: {
                                    quantityCurrent: batch.quantityCurrent.minus(quantityToTake),
                                    isExhausted: batch.quantityCurrent.minus(quantityToTake).equals(0)
                                }
                            });

                            await tx.inventoryMovement.create({
                                data: {
                                    tenantId,
                                    productId: item.productId,
                                    batchId: batch.id,
                                    warehouseOriginId: audit.warehouseId,
                                    type: MovementType.AUDIT,
                                    quantity: quantityToTake,
                                    stockBefore: batch.quantityCurrent,
                                    stockAfter: batch.quantityCurrent.minus(quantityToTake),
                                    unitCost: batch.unitCost,
                                    totalCost: quantityToTake.mul(batch.unitCost),
                                    referenceType: 'AUDIT',
                                    referenceId: audit.id,
                                    performedById: userId,
                                    notes: `Ajuste por faltante en auditoría ${audit.code}`,
                                }
                            });

                            remainingToConsume = remainingToConsume.minus(quantityToTake);
                        }

                        // I6: Validate all stock was consumed
                        if (remainingToConsume.gt(0)) {
                            this.logger.warn(
                                `Audit ${audit.code}: Could not fully adjust deficit for product ${item.productId}. ` +
                                `Remaining unconsumed: ${remainingToConsume.toString()} units. ` +
                                `Available batch stock was insufficient.`
                            );
                        }

                        // Update item adjusted status
                        await tx.inventoryAuditItem.update({
                            where: { id: item.id },
                            data: { isAdjusted: true, varianceCost: itemVarianceCost }
                        });
                    }
                }
            }

            // Close Audit
            return tx.inventoryAudit.update({
                where: { id: auditId },
                data: {
                    status: AuditStatus.COMPLETED,
                    completedAt: new Date(),
                    closedById: userId,
                    totalVariance,
                    varianceCost,
                },
            });
        });
    }
}
