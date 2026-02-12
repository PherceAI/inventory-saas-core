import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service.js';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { ActiveTenant, RequireTenant, Roles } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';
import { UserRole } from '@prisma/client';

@ApiTags('Warehouses')
@ApiBearerAuth()
@RequireTenant()
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) { }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  create(
    @ActiveTenant() tenant: ActiveTenantData,
    @Body() createWarehouseDto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(tenant.tenantId, createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all warehouses' })
  @ApiResponse({ status: 200, description: 'List of warehouses' })
  findAll(@ActiveTenant() tenant: ActiveTenantData) {
    return this.warehousesService.findAll(tenant.tenantId);
  }
}
