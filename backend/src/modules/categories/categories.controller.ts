import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
} from './dto/index.js';
import { ActiveTenant, RequireTenant, Roles } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';
import { UserRole } from '@prisma/client';

@ApiTags('Categories')
@ApiBearerAuth()
@RequireTenant()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  create(
    @ActiveTenant() tenant: ActiveTenantData,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenant.tenantId, createCategoryDto);
  }

  // IMPORTANT: /tree must come BEFORE /:id to avoid route conflict
  @Get('tree')
  @ApiOperation({ summary: 'Get hierarchical category tree' })
  @ApiResponse({ status: 200, description: 'Category tree structure' })
  getTree(@ActiveTenant() tenant: ActiveTenantData) {
    return this.categoriesService.getTree(tenant.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of categories' })
  findAll(
    @ActiveTenant() tenant: ActiveTenantData,
    @Query() query: QueryCategoriesDto,
  ) {
    return this.categoriesService.findAll(tenant.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(
    @ActiveTenant() tenant: ActiveTenantData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findById(tenant.tenantId, id);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 400, description: 'Circular reference detected' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Name conflict' })
  update(
    @ActiveTenant() tenant: ActiveTenantData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenant.tenantId, id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 400, description: 'Category has products or children' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  remove(
    @ActiveTenant() tenant: ActiveTenantData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.remove(tenant.tenantId, id);
  }
}

