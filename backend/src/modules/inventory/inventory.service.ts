import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import {
  CreateInboundMovementDto,
  CreateOutboundMovementDto,
  CreateTransferDto,
  QueryMovementsDto,
  OutboundReason,
} from './dto/index.js';
import { MovementType, PayableStatus, AccountPayable, InventoryMovement, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Result of an inbound operation
 */
export interface InboundResult {
  batch: {
    id: string;
    batchNumber: string;
    quantityInitial: Decimal;
    unitCost: Decimal;
    expiresAt: Date | null;
  };
  movement: {
    id: string;
    type: MovementType;
    quantity: Decimal;
    stockAfter: Decimal;
  };
  payable?: {
    id: string;
    totalAmount: Decimal;
    dueDate: Date;
  };
}

/**
 * Result of an outbound operation (may include multiple movements for FIFO)
 */
export interface OutboundResult {
  totalQuantity: Decimal;
  movements: Array<{
    id: string;
    batchId: string;
    batchNumber: string;
    quantity: Decimal;
    stockBefore: Decimal;
    stockAfter: Decimal;
  }>;
  affectedBatches: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Helper: Consume stock from batches using FIFO logic within a transaction
   */
  private async consumeFromBatchesFIFO(
    tx: PrismaService, // Or Prisma.TransactionClient
    params: {
      tenantId: string;
      productId: string;
      warehouseId: string;
      quantity: Decimal;
      userId: string;
      movementType: MovementType;
      warehouseDestinationId?: string; // Optional for transfers
      destinationType?: string; // Optional
      destinationRef?: string;  // Optional check if type definition allows null
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    }
  ) {
    // 1. Get available batches (FIFO)
    const availableBatches = await tx.batch.findMany({
      where: {
        tenantId: params.tenantId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantityCurrent: { gt: 0 },
        isExhausted: false,
      },
      orderBy: [{ receivedAt: 'asc' }, { createdAt: 'asc' }],
    });

    const totalAvailable = availableBatches.reduce(
      (sum, batch) => sum.add(batch.quantityCurrent),
      new Decimal(0),
    );

    if (totalAvailable.lt(params.quantity)) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${totalAvailable}, Solicitado: ${params.quantity}`,
      );
    }

    let remaining = params.quantity;
    const movements: Array<InventoryMovement & {
      batchNumber: string;
      batchId: string; // Override to non-nullable
    }> = [];

    for (const batch of availableBatches) {
      if (remaining.lte(0)) break;

      const batchCurrent = batch.quantityCurrent;
      const toConsume = Decimal.min(remaining, batchCurrent);
      const newQuantity = batchCurrent.sub(toConsume);
      const isExhausted = newQuantity.lte(0);

      // Update batch
      await tx.batch.update({
        where: { id: batch.id },
        data: {
          quantityCurrent: newQuantity,
          isExhausted,
        },
      });

      // Create movement
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId: params.tenantId,
          productId: params.productId,
          batchId: batch.id,
          type: params.movementType,
          quantity: toConsume,
          stockBefore: batchCurrent,
          stockAfter: newQuantity,
          warehouseOriginId: params.warehouseId,
          warehouseDestinationId: params.warehouseDestinationId,
          unitCost: batch.unitCost,
          totalCost: toConsume.mul(batch.unitCost),
          destinationType: params.destinationType,
          destinationRef: params.destinationRef,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          performedById: params.userId,
          notes: params.notes,
        },
      });

      movements.push({
        ...movement,
        batchNumber: batch.batchNumber,
        batchId: batch.id,
      });

      remaining = remaining.sub(toConsume);
    }

    return movements;
  }


  /**
   * Generate a unique batch number if not provided
   */
  private generateBatchNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `B-${timestamp}-${random}`;
  }

  /**
   * Register inbound inventory movement (stock entry)
   * Creates a new Batch and InventoryMovement in a single transaction
   */
  async registerInbound(
    tenantId: string,
    userId: string,
    dto: CreateInboundMovementDto,
  ): Promise<InboundResult> {
    this.logger.log(
      `Registering inbound: ${dto.quantity} units of product ${dto.productId}`,
    );

    // Validate product exists and belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        'Producto no encontrado o no pertenece a este tenant',
      );
    }

    // Validate warehouse exists and belongs to tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException(
        'Bodega no encontrada o no pertenece a este tenant',
      );
    }

    // Validate supplier if provided
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, tenantId },
      });

      if (!supplier) {
        throw new NotFoundException(
          'Proveedor no encontrado o no pertenece a este tenant',
        );
      }
    }

    // Validate user exists (for performedById relation)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      throw new NotFoundException(
        'Usuario no encontrado. Verifique que su sesión sea válida.',
      );
    }

    // Generate batch number if not provided
    const batchNumber = dto.batchNumber || this.generateBatchNumber();

    // Check batch number uniqueness within tenant
    const existingBatch = await this.prisma.batch.findFirst({
      where: { tenantId, batchNumber },
    });

    if (existingBatch) {
      throw new BadRequestException(
        `Ya existe un lote con el número ${batchNumber}`,
      );
    }

    // Convert to Decimal for precision
    const quantity = new Decimal(dto.quantity);
    const unitCost = new Decimal(dto.unitCost);
    const totalCost = quantity.mul(unitCost);

    // Execute transaction: Create Batch + Movement
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create the Batch
        const batch = await tx.batch.create({
          data: {
            tenantId,
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            supplierId: dto.supplierId,
            batchNumber,
            quantityInitial: quantity,
            quantityCurrent: quantity,
            unitCost,
            receivedAt: new Date(),
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          },
        });

        // Step 2: Create the Movement record
        const movement = await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: dto.productId,
            batchId: batch.id,
            type: MovementType.IN,
            quantity,
            stockBefore: new Decimal(0),
            stockAfter: quantity,
            warehouseDestinationId: dto.warehouseId,
            unitCost,
            totalCost,
            performedById: userId,
            notes: dto.notes,
          },
        });

        // Step 3: Create Account Payable (Optional)
        let payable: AccountPayable | null = null;
        if (dto.createPayable && dto.supplierId) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (dto.paymentTermDays || 30));

          payable = await tx.accountPayable.create({
            data: {
              tenantId,
              supplierId: dto.supplierId,
              invoiceNumber: dto.invoiceNumber,
              totalAmount: totalCost,
              balanceAmount: totalCost, // Full amount pending
              issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
              dueDate,
              status: PayableStatus.CURRENT,
              notes: dto.notes
                ? `Generado desde ingreso: ${dto.notes}`
                : 'Generado desde ingreso manual',
            },
          });
        }

        return { batch, movement, payable };
      });
    } catch (error) {
      this.logger.error(`Transaction failed during inbound registration: ${error.message}`);
      this.logger.error(`DTO keys: ${Object.keys(dto).join(', ')}`);
      this.logger.error(`TenantId: ${tenantId}, UserId: ${userId}`);
      throw error;
    }

    this.logger.log(
      `Inbound registered: Batch ${result.batch.batchNumber} with ${quantity} units`,
    );

    return {
      batch: {
        id: result.batch.id,
        batchNumber: result.batch.batchNumber,
        quantityInitial: result.batch.quantityInitial,
        unitCost: result.batch.unitCost,
        expiresAt: result.batch.expiresAt,
      },
      movement: {
        id: result.movement.id,
        type: result.movement.type,
        quantity: result.movement.quantity,
        stockAfter: result.movement.stockAfter,
      },
      payable: result.payable
        ? {
          id: result.payable.id,
          totalAmount: result.payable.totalAmount,
          dueDate: result.payable.dueDate,
        }
        : undefined,
    };
  }

  /**
   * Register outbound inventory movement (stock exit) using FIFO
   * Consumes from oldest batches first (by receivedAt)
   */
  async registerOutbound(
    tenantId: string,
    userId: string,
    dto: CreateOutboundMovementDto,
  ): Promise<OutboundResult> {
    this.logger.log(
      `Registering outbound: ${dto.quantity} units of product ${dto.productId} (FIFO)`,
    );

    // Validate product exists and belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException(
        'Producto no encontrado o no pertenece a este tenant',
      );
    }

    // Validate warehouse exists and belongs to tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException(
        'Bodega no encontrada o no pertenece a este tenant',
      );
    }

    const requestedQuantity = new Decimal(dto.quantity);

    // Map OutboundReason to MovementType
    const movementType = this.mapReasonToMovementType(dto.reason);

    // Execute FIFO logic in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Use reusable FIFO logic
      const movements = await this.consumeFromBatchesFIFO(tx as PrismaService, {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantity: requestedQuantity,
        userId,
        movementType,
        destinationType: dto.destinationType,
        destinationRef: dto.destinationRef,
        referenceType: dto.reason,
        referenceId: dto.referenceId,
        notes: dto.notes,
      });

      return movements;
    });

    this.logger.log(
      `Outbound registered: ${requestedQuantity} units using ${result.length} batch(es)`,
    );

    return {
      totalQuantity: requestedQuantity,
      movements: result,
      affectedBatches: result.length,
    };
  }

  /**
   * Register internal transfer between warehouses
   * Atomic transaction: Outbound from Origin + Inbound to Destination
   */
  async registerTransfer(
    tenantId: string,
    userId: string,
    dto: CreateTransferDto,
  ) {
    this.logger.log(`Registering transfer from ${dto.originWarehouseId} to ${dto.destinationWarehouseId}`);

    // Same tenant validation
    if (dto.originWarehouseId === dto.destinationWarehouseId) {
      throw new BadRequestException('Bodega origen y destino deben ser diferentes');
    }

    return await this.prisma.$transaction(async (tx) => {
      const results: { productId: string; status: string }[] = [];

      for (const item of dto.items) {
        // 1. Outbound from Origin (FIFO) using reusable method
        const outMovements = await this.consumeFromBatchesFIFO(tx as PrismaService, {
          tenantId,
          productId: item.productId,
          warehouseId: dto.originWarehouseId,
          quantity: new Decimal(item.quantity),
          userId,
          movementType: MovementType.TRANSFER,
          warehouseDestinationId: dto.destinationWarehouseId,
          notes: dto.notes ? `Traslado Salida: ${dto.notes}` : 'Traslado entre bodegas',
        });

        // 2. Inbound to Destination (Create new batch for each outbound movement)
        for (const outMov of outMovements) {
          // Fetch source batch properties (needed for inheritance)
          const sourceBatch = await tx.batch.findUnique({
            where: { id: outMov.batchId! }, // BatchId guaranteed by FIFO method
          });

          if (!sourceBatch) throw new Error(`Batch ${outMov.batchId} not found during transfer`);

          // Create new batch at destination
          const newBatch = await tx.batch.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: dto.destinationWarehouseId,
              supplierId: sourceBatch.supplierId,
              batchNumber: this.generateBatchNumber(),
              quantityInitial: outMov.quantity,
              quantityCurrent: outMov.quantity,
              unitCost: outMov.unitCost || new Decimal(0),
              receivedAt: new Date(),
              expiresAt: sourceBatch.expiresAt,
              isQuarantined: false,
            },
          });

          // Create IN movement linked to OUT movement
          await tx.inventoryMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              batchId: newBatch.id,
              type: MovementType.TRANSFER,
              quantity: outMov.quantity,
              stockBefore: new Decimal(0),
              stockAfter: outMov.quantity,
              warehouseOriginId: dto.originWarehouseId,
              warehouseDestinationId: dto.destinationWarehouseId,
              unitCost: outMov.unitCost || new Decimal(0),
              totalCost: (outMov.unitCost || new Decimal(0)).mul(outMov.quantity),
              performedById: userId,
              notes: dto.notes
                ? `Traslado Entrada: ${dto.notes} (Origen: ${sourceBatch.batchNumber})`
                : `Recepción de traslado (Origen: ${sourceBatch.batchNumber})`,
              referenceType: 'MOVEMENT',
              referenceId: outMov.id, // Link to outbound movement
            },
          });
        }

        results.push({ productId: item.productId, status: 'OK' });
      }
      return results;
    });
  }

  /**
   * Map OutboundReason enum to MovementType enum
   */
  private mapReasonToMovementType(reason: OutboundReason): MovementType {
    switch (reason) {
      case OutboundReason.SALE:
        return MovementType.SALE;
      case OutboundReason.CONSUME:
        return MovementType.CONSUME;
      case OutboundReason.TRANSFER:
        return MovementType.TRANSFER;
      case OutboundReason.ADJUSTMENT:
        return MovementType.AUDIT;
      default:
        return MovementType.OUT;
    }
  }

  /**
   * Get current stock for a product in a specific warehouse
   */
  async getProductStock(
    tenantId: string,
    productId: string,
    warehouseId: string,
  ): Promise<{
    totalStock: Decimal;
    batches: Array<{
      batchNumber: string;
      quantity: Decimal;
      expiresAt: Date | null;
    }>;
  }> {
    const batches = await this.prisma.batch.findMany({
      where: {
        tenantId,
        productId,
        warehouseId,
        quantityCurrent: { gt: 0 },
        isExhausted: false,
      },
      orderBy: { receivedAt: 'asc' },
      select: {
        batchNumber: true,
        quantityCurrent: true,
        expiresAt: true,
      },
    });

    const totalStock = batches.reduce(
      (sum, batch) => sum.add(batch.quantityCurrent),
      new Decimal(0),
    );

    return {
      totalStock,
      batches: batches.map((b) => ({
        batchNumber: b.batchNumber,
        quantity: b.quantityCurrent,
        expiresAt: b.expiresAt,
      })),
    };
  }

  /**
   * Get batches that are expiring within a specified number of days
   * @param tenantId - Tenant ID
   * @param daysAhead - Number of days to look ahead (default: 30)
   * @returns List of expiring batches with product and warehouse info
   */
  async getExpiringBatches(
    tenantId: string,
    daysAhead: number = 30,
  ): Promise<{
    count: number;
    batches: Array<{
      id: string;
      batchNumber: string;
      productId: string;
      productName: string;
      productSku: string;
      warehouseId: string;
      warehouseName: string;
      quantityCurrent: Decimal;
      expiresAt: Date;
      daysUntilExpiry: number;
      status: 'CRITICAL' | 'WARNING' | 'UPCOMING';
    }>;
  }> {
    const now = new Date();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysAhead);

    const batches = await this.prisma.batch.findMany({
      where: {
        tenantId,
        expiresAt: {
          lte: deadline,
          not: null,
        },
        isExhausted: false,
        quantityCurrent: { gt: 0 },
      },
      orderBy: { expiresAt: 'asc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const result = batches.map((batch) => {
      const expiresAt = batch.expiresAt!;
      const daysUntilExpiry = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let status: 'CRITICAL' | 'WARNING' | 'UPCOMING';
      if (daysUntilExpiry <= 0) {
        status = 'CRITICAL'; // Already expired
      } else if (daysUntilExpiry <= 7) {
        status = 'WARNING'; // Expiring within a week
      } else {
        status = 'UPCOMING'; // Expiring soon but not urgent
      }

      return {
        id: batch.id,
        batchNumber: batch.batchNumber,
        productId: batch.product.id,
        productName: batch.product.name,
        productSku: batch.product.sku,
        warehouseId: batch.warehouse.id,
        warehouseName: batch.warehouse.name,
        quantityCurrent: batch.quantityCurrent,
        expiresAt,
        daysUntilExpiry,
        status,
      };
    });

    this.logger.log(
      `Found ${result.length} batches expiring within ${daysAhead} days for tenant ${tenantId}`,
    );

    return {
      count: result.length,
      batches: result,
    };
  }
  /**
   * List all inventory movements with filters (History Log)
   */
  async findAllMovements(tenantId: string, query: QueryMovementsDto) {
    const {
      page = 1,
      limit = 20,
      type,
      productId,
      warehouseId,
      userId,
      startDate,
      endDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = { tenantId };
    const andConditions: Prisma.InventoryMovementWhereInput[] = [];

    if (type) where.type = type;
    if (productId) where.productId = productId;
    if (userId) where.performedById = userId;

    if (warehouseId) {
      andConditions.push({
        OR: [
          { warehouseOriginId: warehouseId },
          { warehouseDestinationId: warehouseId },
        ],
      });
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    if (search) {
      andConditions.push({
        OR: [
          { referenceId: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          performedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          warehouseOrigin: { select: { id: true, name: true } },
          warehouseDestination: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

