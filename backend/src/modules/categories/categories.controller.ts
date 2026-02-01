import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { ActiveTenant, RequireTenant } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';

@ApiTags('Categories')
@ApiBearerAuth()
@RequireTenant()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  create(
    @ActiveTenant() tenant: ActiveTenantData,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenant.tenantId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(@ActiveTenant() tenant: ActiveTenantData) {
    return this.categoriesService.findAll(tenant.tenantId);
  }
}
