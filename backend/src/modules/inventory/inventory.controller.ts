import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  InventoryService,
  InboundResult,
  OutboundResult,
} from './inventory.service.js';
import {
  CreateInboundMovementDto,
  CreateOutboundMovementDto,
} from './dto/index.js';
import { ActiveTenant, RequireTenant } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';
import { CurrentUser } from '../auth/decorators/index.js';

@ApiTags('Inventory')
@ApiBearerAuth()
@RequireTenant()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  /**
   * POST /inventory/inbound
   * Register stock entry (creates Batch + Movement)
   */
  @Post('inbound')
  @ApiOperation({
    summary: 'Registrar ingreso de mercancía',
    description:
      'Crea un nuevo lote y registra el movimiento de entrada. El número de lote se genera automáticamente si no se proporciona.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ingreso registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        batch: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-batch' },
            batchNumber: { type: 'string', example: 'B-1706425200000-A1B2' },
            quantityInitial: { type: 'number', example: 100 },
            unitCost: { type: 'number', example: 0.5 },
          },
        },
        movement: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-movement' },
            type: { type: 'string', example: 'IN' },
            quantity: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o lote duplicado' })
  @ApiResponse({ status: 404, description: 'Producto o bodega no encontrados' })
  async registerInbound(
    @ActiveTenant() tenant: ActiveTenantData,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateInboundMovementDto,
  ): Promise<InboundResult> {
    return this.inventoryService.registerInbound(tenant.tenantId, user.id, dto);
  }

  /**
   * POST /inventory/outbound
   * Register stock exit using FIFO logic
   */
  @Post('outbound')
  @ApiOperation({
    summary: 'Registrar salida de mercancía (FIFO)',
    description:
      'Consume stock de los lotes más antiguos primero (FIFO). Si la cantidad solicitada excede el stock disponible, retorna error.',
  })
  @ApiResponse({
    status: 201,
    description: 'Egreso registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalQuantity: { type: 'number', example: 50 },
        affectedBatches: { type: 'number', example: 2 },
        movements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              batchId: { type: 'string' },
              batchNumber: { type: 'string' },
              quantity: { type: 'number' },
              stockBefore: { type: 'number' },
              stockAfter: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o datos inválidos',
  })
  @ApiResponse({ status: 404, description: 'Producto o bodega no encontrados' })
  async registerOutbound(
    @ActiveTenant() tenant: ActiveTenantData,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOutboundMovementDto,
  ): Promise<OutboundResult> {
    return this.inventoryService.registerOutbound(
      tenant.tenantId,
      user.id,
      dto,
    );
  }

  /**
   * GET /inventory/stock/:productId
   * Get current stock for a product in a warehouse
   */
  @Get('stock/:productId')
  @ApiOperation({
    summary: 'Consultar stock de un producto',
    description:
      'Retorna el stock total y desglose por lotes de un producto en una bodega específica.',
  })
  @ApiResponse({ status: 200, description: 'Stock consultado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async getProductStock(
    @ActiveTenant() tenant: ActiveTenantData,
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
  ) {
    return this.inventoryService.getProductStock(
      tenant.tenantId,
      productId,
      warehouseId,
    );
  }

  /**
   * GET /inventory/expiring
   * Get batches that are expiring soon
   */
  @Get('expiring')
  @ApiOperation({
    summary: 'Consultar lotes próximos a vencer',
    description:
      'Retorna los lotes que vencen dentro de los próximos N días. Por defecto 30 días. Incluye clasificación de urgencia: CRITICAL (vencidos), WARNING (< 7 días), UPCOMING (> 7 días).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lotes próximos a vencer',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
        batches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              batchNumber: { type: 'string', example: 'LOT-2026-001' },
              productName: { type: 'string', example: 'Leche Entera 1L' },
              productSku: { type: 'string', example: 'LECH-001' },
              warehouseName: { type: 'string', example: 'Bodega Central' },
              quantityCurrent: { type: 'number', example: 25 },
              expiresAt: { type: 'string', format: 'date-time' },
              daysUntilExpiry: { type: 'number', example: 5 },
              status: {
                type: 'string',
                enum: ['CRITICAL', 'WARNING', 'UPCOMING'],
              },
            },
          },
        },
      },
    },
  })
  async getExpiringBatches(
    @ActiveTenant() tenant: ActiveTenantData,
    @Query('days') days?: string,
  ) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.inventoryService.getExpiringBatches(tenant.tenantId, daysAhead);
  }
}

