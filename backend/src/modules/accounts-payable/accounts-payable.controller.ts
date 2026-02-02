import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsPayableService } from './accounts-payable.service.js';
import { QueryPayablesDto, RegisterPaymentDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator.js';
import { ActiveTenant } from '../../common/decorators/active-tenant.decorator.js';
import type { ActiveTenantData } from '../../common/decorators/active-tenant.decorator.js';

@ApiTags('Accounts Payable')
@ApiBearerAuth()
@Controller('accounts-payable')
@UseGuards(JwtAuthGuard, TenantGuard)
@RequireTenant()
export class AccountsPayableController {
    constructor(private readonly service: AccountsPayableService) { }

    @Get()
    @ApiOperation({ summary: 'Listar cuentas por pagar con filtros' })
    @ApiResponse({ status: 200, description: 'Lista de cuentas por pagar' })
    async findAll(
        @ActiveTenant() tenant: ActiveTenantData,
        @Query() query: QueryPayablesDto,
    ) {
        return this.service.findAll(tenant.tenantId, query);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Resumen de cuentas por pagar por estado' })
    @ApiResponse({ status: 200, description: 'Resumen por estado' })
    async getSummary(@ActiveTenant() tenant: ActiveTenantData) {
        return this.service.getSummary(tenant.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener cuenta por pagar con pagos' })
    @ApiResponse({ status: 200, description: 'Cuenta por pagar encontrada' })
    @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
    async findOne(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Post(':id/payments')
    @ApiOperation({ summary: 'Registrar pago (parcial o total)' })
    @ApiResponse({ status: 201, description: 'Pago registrado exitosamente' })
    @ApiResponse({ status: 400, description: 'Monto excede el saldo pendiente' })
    async registerPayment(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RegisterPaymentDto,
    ) {
        return this.service.registerPayment(tenant.tenantId, id, dto);
    }

    @Post('update-statuses')
    @ApiOperation({ summary: 'Actualizar estados de cuentas por fecha de vencimiento' })
    @ApiResponse({ status: 200, description: 'Estados actualizados' })
    async updateStatuses(@ActiveTenant() tenant: ActiveTenantData) {
        return this.service.updatePayableStatuses(tenant.tenantId);
    }
}
