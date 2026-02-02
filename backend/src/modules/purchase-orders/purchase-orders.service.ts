import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import {
    CreatePurchaseOrderDto,
    UpdatePurchaseOrderDto,
    AddOrderItemDto,
    ReceiveGoodsDto,
    QueryPurchaseOrdersDto,
} from './dto/index.js';
import { PurchaseOrderStatus, MovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Result of goods receipt operation
 */
export interface GoodsReceiptResult {
    order: {
        id: string;
        orderNumber: string;
        status: PurchaseOrderStatus;
    };
    batchesCreated: number;
    movementsCreated: number;
    payable: {
        id: string;
        totalAmount: Decimal;
        dueDate: Date;
    } | null;
}

@Injectable()
export class PurchaseOrdersService {
    private readonly logger = new Logger(PurchaseOrdersService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate unique order number
     */
    private generateOrderNumber(): string {
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        return `PO-${year}-${timestamp}`;
    }

    /**
     * Generate batch number for goods receipt
     */
    private generateBatchNumber(orderNumber: string, index: number): string {
        const timestamp = Date.now();
        return `${orderNumber}-B${(index + 1).toString().padStart(2, '0')}-${timestamp}`;
    }

    /**
     * Create a new purchase order (DRAFT status)
     */
    async create(tenantId: string, dto: CreatePurchaseOrderDto) {
        // Validate supplier exists and belongs to tenant
        const supplier = await this.prisma.supplier.findFirst({
            where: { id: dto.supplierId, tenantId },
        });

        if (!supplier) {
            throw new NotFoundException('Proveedor no encontrado o no pertenece a este tenant');
        }

        const orderNumber = dto.orderNumber || this.generateOrderNumber();

        // Check order number uniqueness
        const existing = await this.prisma.purchaseOrder.findFirst({
            where: { tenantId, orderNumber },
        });

        if (existing) {
            throw new BadRequestException(`Ya existe una orden con el número ${orderNumber}`);
        }

        const order = await this.prisma.purchaseOrder.create({
            data: {
                tenantId,
                supplierId: dto.supplierId,
                orderNumber,
                status: PurchaseOrderStatus.DRAFT,
                expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
                paymentTermDays: dto.paymentTermDays,
                currency: dto.currency || 'USD',
                notes: dto.notes,
            },
            include: {
                supplier: { select: { id: true, name: true } },
            },
        });

        this.logger.log(`Purchase order created: ${order.orderNumber}`);
        return order;
    }

    /**
     * List purchase orders with filters and pagination
     */
    async findAll(tenantId: string, query: QueryPurchaseOrdersDto) {
        const { status, supplierId, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where = {
            tenantId,
            ...(status && { status: status as PurchaseOrderStatus }),
            ...(supplierId && { supplierId }),
        };

        const [orders, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    supplier: { select: { id: true, name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.purchaseOrder.count({ where }),
        ]);

        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single purchase order with items
     */
    async findOne(tenantId: string, id: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, tenantId },
            include: {
                supplier: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        product: { select: { id: true, sku: true, name: true } },
                    },
                },
                payables: {
                    select: { id: true, totalAmount: true, balanceAmount: true, status: true },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        return order;
    }

    /**
     * Update purchase order (DRAFT status only)
     */
    async update(tenantId: string, id: string, dto: UpdatePurchaseOrderDto) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        if (order.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden modificar órdenes en estado DRAFT');
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: {
                expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
                paymentTermDays: dto.paymentTermDays,
                currency: dto.currency,
                notes: dto.notes,
            },
            include: {
                supplier: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * Add item to purchase order
     */
    async addItem(tenantId: string, orderId: string, dto: AddOrderItemDto) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id: orderId, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        if (order.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden agregar ítems a órdenes en estado DRAFT');
        }

        // Validate product exists and belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: { id: dto.productId, tenantId },
        });

        if (!product) {
            throw new NotFoundException('Producto no encontrado o no pertenece a este tenant');
        }

        // Check if product already in order
        const existingItem = await this.prisma.purchaseOrderItem.findFirst({
            where: { orderId, productId: dto.productId },
        });

        if (existingItem) {
            throw new BadRequestException('Este producto ya está en la orden. Modifique la cantidad existente.');
        }

        // Calculate item total
        const quantity = new Decimal(dto.quantityOrdered);
        const unitPrice = new Decimal(dto.unitPrice);
        const discount = new Decimal(dto.discount || 0);
        const taxRate = new Decimal(dto.taxRate || 0);

        const subtotal = quantity.mul(unitPrice.sub(discount));
        const tax = subtotal.mul(taxRate);
        const itemTotal = subtotal.add(tax);

        const item = await this.prisma.purchaseOrderItem.create({
            data: {
                orderId,
                productId: dto.productId,
                quantityOrdered: quantity,
                unitPrice,
                discount,
                taxRate,
                total: itemTotal,
                notes: dto.notes,
            },
            include: {
                product: { select: { id: true, sku: true, name: true } },
            },
        });

        // Recalculate order totals
        await this.recalculateOrderTotals(orderId);

        return item;
    }

    /**
     * Remove item from purchase order
     */
    async removeItem(tenantId: string, orderId: string, itemId: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id: orderId, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        if (order.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden eliminar ítems de órdenes en estado DRAFT');
        }

        const item = await this.prisma.purchaseOrderItem.findFirst({
            where: { id: itemId, orderId },
        });

        if (!item) {
            throw new NotFoundException('Ítem no encontrado');
        }

        await this.prisma.purchaseOrderItem.delete({
            where: { id: itemId },
        });

        // Recalculate order totals
        await this.recalculateOrderTotals(orderId);

        return { deleted: true };
    }

    /**
     * Recalculate order totals from items
     */
    private async recalculateOrderTotals(orderId: string) {
        const items = await this.prisma.purchaseOrderItem.findMany({
            where: { orderId },
        });

        let subtotal = new Decimal(0);
        let taxAmount = new Decimal(0);

        for (const item of items) {
            const itemSubtotal = item.quantityOrdered.mul(item.unitPrice.sub(item.discount));
            const itemTax = itemSubtotal.mul(item.taxRate);
            subtotal = subtotal.add(itemSubtotal);
            taxAmount = taxAmount.add(itemTax);
        }

        const total = subtotal.add(taxAmount);

        await this.prisma.purchaseOrder.update({
            where: { id: orderId },
            data: { subtotal, taxAmount, total },
        });
    }

    /**
     * Send purchase order to supplier (change status to SENT)
     */
    async send(tenantId: string, orderId: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id: orderId, tenantId },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        if (order.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Solo se pueden enviar órdenes en estado DRAFT');
        }

        if (order.items.length === 0) {
            throw new BadRequestException('No se puede enviar una orden sin ítems');
        }

        const updated = await this.prisma.purchaseOrder.update({
            where: { id: orderId },
            data: {
                status: PurchaseOrderStatus.ORDERED,
                orderedAt: new Date(),
            },
            include: {
                supplier: { select: { id: true, name: true } },
            },
        });

        this.logger.log(`Purchase order sent: ${updated.orderNumber}`);
        return updated;
    }

    /**
     * 🔥 GOODS RECEIPT - The KEY operation
     * Creates Batches, InventoryMovements, and AccountPayable
     */
    async receiveGoods(
        tenantId: string,
        userId: string,
        orderId: string,
        dto: ReceiveGoodsDto,
    ): Promise<GoodsReceiptResult> {
        this.logger.log(`Receiving goods for order ${orderId}`);

        // Validate order
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id: orderId, tenantId },
            include: {
                items: true,
                supplier: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        if (order.status !== PurchaseOrderStatus.ORDERED && order.status !== PurchaseOrderStatus.PARTIAL) {
            throw new BadRequestException(
                `Solo se puede recibir mercancía de órdenes en estado SENT o PARTIAL. Estado actual: ${order.status}`,
            );
        }

        // Validate warehouse
        const warehouse = await this.prisma.warehouse.findFirst({
            where: { id: dto.warehouseId, tenantId },
        });

        if (!warehouse) {
            throw new NotFoundException('Bodega no encontrada o no pertenece a este tenant');
        }

        // Validate all products in dto exist in order
        const orderProductIds = new Set(order.items.map((i) => i.productId));
        for (const item of dto.items) {
            if (!orderProductIds.has(item.productId)) {
                throw new BadRequestException(
                    `El producto ${item.productId} no está en esta orden de compra`,
                );
            }
        }

        // Execute transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const batchesCreated: string[] = [];
            const movementsCreated: string[] = [];
            let totalReceiptAmount = new Decimal(0);

            // Process each received item
            for (let i = 0; i < dto.items.length; i++) {
                const receivedItem = dto.items[i];
                const orderItem = order.items.find((oi) => oi.productId === receivedItem.productId);

                if (!orderItem) continue;

                const quantity = new Decimal(receivedItem.quantityReceived);
                const unitCost = new Decimal(receivedItem.unitCost);
                const batchNumber = receivedItem.batchNumber || this.generateBatchNumber(order.orderNumber, i);

                // 1. Create Batch
                const batch = await tx.batch.create({
                    data: {
                        tenantId,
                        productId: receivedItem.productId,
                        warehouseId: dto.warehouseId,
                        supplierId: order.supplierId,
                        batchNumber,
                        quantityInitial: quantity,
                        quantityCurrent: quantity,
                        unitCost,
                        receivedAt: new Date(),
                        expiresAt: receivedItem.expiresAt ? new Date(receivedItem.expiresAt) : null,
                    },
                });
                batchesCreated.push(batch.id);

                // 2. Create InventoryMovement
                const movement = await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        productId: receivedItem.productId,
                        batchId: batch.id,
                        type: MovementType.IN,
                        quantity,
                        stockBefore: new Decimal(0),
                        stockAfter: quantity,
                        warehouseDestinationId: dto.warehouseId,
                        unitCost,
                        totalCost: quantity.mul(unitCost),
                        referenceType: 'PURCHASE_ORDER',
                        referenceId: orderId,
                        performedById: userId,
                        notes: dto.notes || `Recepción de orden ${order.orderNumber}`,
                    },
                });
                movementsCreated.push(movement.id);

                // 3. Update PurchaseOrderItem.quantityReceived
                await tx.purchaseOrderItem.update({
                    where: { id: orderItem.id },
                    data: {
                        quantityReceived: orderItem.quantityReceived.add(quantity),
                    },
                });

                // Accumulate total for payable (Subtotal + Tax)
                const itemSubtotal = quantity.mul(unitCost);
                // Use taxRate from the original order item
                const taxRate = orderItem.taxRate || new Decimal(0);
                const itemTax = itemSubtotal.mul(taxRate);

                totalReceiptAmount = totalReceiptAmount.add(itemSubtotal.add(itemTax));
            }

            // 4. Determine new order status
            const updatedItems = await tx.purchaseOrderItem.findMany({
                where: { orderId },
            });

            const allFullyReceived = updatedItems.every((item) =>
                item.quantityReceived.gte(item.quantityOrdered),
            );
            const someReceived = updatedItems.some((item) => item.quantityReceived.gt(0));

            let newStatus: PurchaseOrderStatus;
            if (allFullyReceived) {
                newStatus = PurchaseOrderStatus.RECEIVED;
            } else if (someReceived) {
                newStatus = PurchaseOrderStatus.PARTIAL;
            } else {
                newStatus = order.status!;
            }

            // Update order status
            await tx.purchaseOrder.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    receivedAt: newStatus === PurchaseOrderStatus.RECEIVED ? new Date() : undefined,
                },
            });

            // 5. Create AccountPayable
            const dueDate = new Date();
            if (order.paymentTermDays) {
                dueDate.setDate(dueDate.getDate() + order.paymentTermDays);
            } else {
                dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
            }

            const payable = await tx.accountPayable.create({
                data: {
                    tenantId,
                    supplierId: order.supplierId,
                    purchaseOrderId: orderId,
                    invoiceNumber: dto.invoiceNumber,
                    totalAmount: totalReceiptAmount,
                    balanceAmount: totalReceiptAmount,
                    issueDate: new Date(),
                    dueDate,
                    notes: `Generado automáticamente desde orden ${order.orderNumber}`,
                },
            });

            return {
                order: { id: orderId, orderNumber: order.orderNumber, status: newStatus },
                batchesCreated: batchesCreated.length,
                movementsCreated: movementsCreated.length,
                payable: {
                    id: payable.id,
                    totalAmount: payable.totalAmount,
                    dueDate: payable.dueDate,
                },
            };
        });

        this.logger.log(
            `Goods received for ${order.orderNumber}: ${result.batchesCreated} batches, ${result.movementsCreated} movements, payable created`,
        );

        return result;
    }

    /**
     * Cancel purchase order
     */
    async cancel(tenantId: string, orderId: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id: orderId, tenantId },
        });

        if (!order) {
            throw new NotFoundException('Orden de compra no encontrada');
        }

        if (order.status === PurchaseOrderStatus.RECEIVED) {
            throw new BadRequestException('No se puede cancelar una orden ya recibida');
        }

        const updated = await this.prisma.purchaseOrder.update({
            where: { id: orderId },
            data: { status: PurchaseOrderStatus.CANCELLED },
        });

        this.logger.log(`Purchase order cancelled: ${updated.orderNumber}`);
        return updated;
    }
}
