import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import type { PaginatedProducts } from './products.service.js';
import { CreateProductDto, QueryProductsDto } from './dto/index.js';
import { ActiveTenant, RequireTenant } from '../../common/decorators/index.js';
import type { ActiveTenantData } from '../../common/decorators/index.js';

@ApiTags('Products')
@ApiBearerAuth()
@RequireTenant() // Adds x-tenant-id header to Swagger and marks as required
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products',
    description: 'Returns paginated list of products for the active tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated product list',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @ActiveTenant() tenant: ActiveTenantData,
    @Query() query: QueryProductsDto,
  ): Promise<PaginatedProducts> {
    return this.productsService.findAll(tenant.tenantId, query);
  }

  @Get(':term')
  @ApiOperation({
    summary: 'Find product',
    description:
      'Search product by ID (UUID), SKU (exact), or name (partial match)',
  })
  @ApiParam({
    name: 'term',
    description: 'Product ID (UUID), SKU, or name to search',
    example: 'VOD-GREY-750',
  })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findByTerm(
    @ActiveTenant() tenant: ActiveTenantData,
    @Param('term') term: string,
  ) {
    return this.productsService.findByTerm(tenant.tenantId, term);
  }

  @Post()
  @ApiOperation({
    summary: 'Create product',
    description:
      'Create a new product. The tenantId is taken from the x-tenant-id header.',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Product with SKU or barcode already exists',
  })
  async create(
    @ActiveTenant() tenant: ActiveTenantData,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(tenant.tenantId, createProductDto);
  }
}
