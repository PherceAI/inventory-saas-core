import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { ActiveTenant, RequireTenant } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';

@ApiTags('Suppliers')
@ApiBearerAuth()
@RequireTenant()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  @ApiResponse({ status: 409, description: 'Code or Tax ID already exists' })
  create(
    @ActiveTenant() tenant: ActiveTenantData,
    @Body() createSupplierDto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(tenant.tenantId, createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all suppliers' })
  @ApiResponse({ status: 200, description: 'List of suppliers' })
  findAll(@ActiveTenant() tenant: ActiveTenantData) {
    return this.suppliersService.findAll(tenant.tenantId);
  }
}
