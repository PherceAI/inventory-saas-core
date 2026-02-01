import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FamiliesService } from './families.service.js';
import { QueryFamiliesDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RequireTenant } from '../../common/decorators/require-tenant.decorator.js';
import { ActiveTenant } from '../../common/decorators/active-tenant.decorator.js';
import type { ActiveTenantData } from '../../common/decorators/active-tenant.decorator.js';

@ApiTags('Product Families')
@ApiBearerAuth()
@Controller('families')
@UseGuards(JwtAuthGuard, TenantGuard)
@RequireTenant()
export class FamiliesController {
    constructor(private readonly service: FamiliesService) { }

    @Get()
    @ApiOperation({ summary: 'Listar familias de productos' })
    @ApiResponse({ status: 200, description: 'Lista de familias' })
    async findAll(
        @ActiveTenant() tenant: ActiveTenantData,
        @Query() query: QueryFamiliesDto,
    ) {
        return this.service.findAll(tenant.tenantId, query);
    }

    @Get('deficit')
    @ApiOperation({ summary: 'Familias con stock por debajo del objetivo' })
    @ApiResponse({ status: 200, description: 'Lista de familias con déficit' })
    async getDeficit(@ActiveTenant() tenant: ActiveTenantData) {
        return this.service.getFamiliesWithDeficit(tenant.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener familia con productos' })
    @ApiResponse({ status: 200, description: 'Familia encontrada' })
    @ApiResponse({ status: 404, description: 'Familia no encontrada' })
    async findOne(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.service.findOne(tenant.tenantId, id);
    }

    @Get(':id/stock')
    @ApiOperation({
        summary: '🔥 Stock agregado en unidad base',
        description: `
            Calcula el stock total de la familia convertido a la unidad base.
            Ejemplo: Familia "Cocoa" con baseUnit=GRAM
            - Bolsa 400g: 5 unidades → 2000g
            - Bolsa 900g: 3 unidades → 2700g
            - Total: 4700g (vs targetStockBase: 10000g → déficit: 5300g)
        `,
    })
    @ApiResponse({ status: 200, description: 'Stock agregado de la familia' })
    @ApiResponse({ status: 404, description: 'Familia no encontrada' })
    async getFamilyStock(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.service.getFamilyStock(tenant.tenantId, id);
    }
}
