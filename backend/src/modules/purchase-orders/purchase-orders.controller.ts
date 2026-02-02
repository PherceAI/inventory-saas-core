import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import {
    CreatePurchaseOrderDto,
    UpdatePurchaseOrderDto,
    AddOrderItemDto,
    ReceiveGoodsDto,
    QueryPurchaseOrdersDto,
} from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator.js';
import { ActiveTenant } from '../../common/decorators/active-tenant.decorator.js';
import type { ActiveTenantData } from '../../common/decorators/active-tenant.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, TenantGuard)
@RequireTenant()
export class PurchaseOrdersController {
    constructor(private readonly service: PurchaseOrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Crear orden de compra (DRAFT)' })
    @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
    async create(
        @ActiveTenant() tenant: ActiveTenantData,
        @Body() dto: CreatePurchaseOrderDto,
    ) {
        return this.service.create(tenant.tenantId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar órdenes de compra con filtros' })
    @ApiResponse({ status: 200, description: 'Lista de órdenes' })
    async findAll(
        @ActiveTenant() tenant: ActiveTenantData,
        @Query() query: QueryPurchaseOrdersDto,
    ) {
        return this.service.findAll(tenant.tenantId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener orden de compra con ítems' })
    @ApiResponse({ status: 200, description: 'Orden encontrada' })
    @ApiResponse({ status: 404, description: 'Orden no encontrada' })
    async findOne(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar orden de compra (solo DRAFT)' })
    @ApiResponse({ status: 200, description: 'Orden actualizada' })
    @ApiResponse({ status: 400, description: 'Solo se pueden modificar órdenes DRAFT' })
    async update(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePurchaseOrderDto,
    ) {
        return this.service.update(tenant.tenantId, id, dto);
    }

    @Post(':id/items')
    @ApiOperation({ summary: 'Agregar ítem a orden de compra' })
    @ApiResponse({ status: 201, description: 'Ítem agregado' })
    @ApiResponse({ status: 400, description: 'Solo se pueden agregar ítems a órdenes DRAFT' })
    async addItem(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AddOrderItemDto,
    ) {
        return this.service.addItem(tenant.tenantId, id, dto);
    }

    @Delete(':id/items/:itemId')
    @ApiOperation({ summary: 'Eliminar ítem de orden de compra' })
    @ApiResponse({ status: 200, description: 'Ítem eliminado' })
    async removeItem(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
    ) {
        return this.service.removeItem(tenant.tenantId, id, itemId);
    }

    @Post(':id/send')
    @ApiOperation({ summary: 'Enviar orden de compra al proveedor (DRAFT → SENT)' })
    @ApiResponse({ status: 200, description: 'Orden enviada' })
    @ApiResponse({ status: 400, description: 'Solo se pueden enviar órdenes DRAFT con ítems' })
    async send(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.service.send(tenant.tenantId, id);
    }

    @Post(':id/receive')
    @ApiOperation({
        summary: '🔥 Recibir mercancía - Crea Batches + AccountPayable automáticamente',
        description: `
            Esta es la operación clave que:
            1. Crea lotes (Batches) con el costo REAL de la mercancía
            2. Registra movimientos de inventario (IN)
            3. Actualiza el estado de la orden (PARTIAL/RECEIVED)
            4. Genera automáticamente la cuenta por pagar
        `,
    })
    @ApiResponse({ status: 200, description: 'Mercancía recibida exitosamente' })
    @ApiResponse({ status: 400, description: 'La orden no está en estado SENT o PARTIAL' })
    async receiveGoods(
        @ActiveTenant() tenant: ActiveTenantData,
        @CurrentUser() user: { id: string },
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReceiveGoodsDto,
    ) {
        return this.service.receiveGoods(tenant.tenantId, user.id, id, dto);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancelar orden de compra' })
    @ApiResponse({ status: 200, description: 'Orden cancelada' })
    @ApiResponse({ status: 400, description: 'No se puede cancelar una orden ya recibida' })
    async cancel(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.service.cancel(tenant.tenantId, id);
    }
}
