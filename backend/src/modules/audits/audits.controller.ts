import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditsService } from './audits.service.js';
import {
    CreateAuditDto,
    UpdateAuditItemDto,
    QueryAuditsDto,
} from './dto/index.js';
import { ActiveTenant, RequireTenant, Roles } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '@prisma/client';

@ApiTags('Audits')
@ApiBearerAuth()
@RequireTenant()
@Controller('audits')
export class AuditsController {
    constructor(private readonly auditsService: AuditsService) { }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Crear una nueva auditoría (snapshot de stock)' })
    @ApiResponse({ status: 201, description: 'Auditoría creada' })
    async create(
        @ActiveTenant() tenant: ActiveTenantData,
        @Body() dto: CreateAuditDto,
    ) {
        return this.auditsService.create(tenant.tenantId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar auditorías' })
    async findAll(
        @ActiveTenant() tenant: ActiveTenantData,
        @Query() query: QueryAuditsDto,
    ) {
        return this.auditsService.findAll(tenant.tenantId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalle de auditoría' })
    async findOne(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id') id: string,
    ) {
        return this.auditsService.findOne(tenant.tenantId, id);
    }

    @Patch(':id/items/:itemId')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR)
    @ApiOperation({ summary: 'Actualizar conteo de un ítem' })
    async updateItem(
        @ActiveTenant() tenant: ActiveTenantData,
        @Param('id') auditId: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateAuditItemDto,
    ) {
        return this.auditsService.updateItem(
            tenant.tenantId,
            auditId,
            itemId,
            dto,
        );
    }

    @Post(':id/close')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Cerrar auditoría y generar ajustes' })
    @ApiResponse({ status: 200, description: 'Auditoría cerrada y ajustes generados' })
    async close(
        @ActiveTenant() tenant: ActiveTenantData,
        @CurrentUser() user: { userId: string },
        @Param('id') auditId: string,
    ) {
        return this.auditsService.close(tenant.tenantId, auditId, user.userId);
    }
}
