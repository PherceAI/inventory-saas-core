import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import { CreateProductDto, QueryProductsDto } from './dto/index.js';
import { Prisma } from '@prisma/client';

export interface PaginatedProducts {
  data: unknown[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * List products with pagination and filters
   * Always filters by tenantId for security
   */
  async findAll(
    tenantId: string,
    query: QueryProductsDto,
  ): Promise<PaginatedProducts> {
    const {
      page = 1,
      limit = 20,
      search,
      familyId,
      isActive = true, // Default to active only
      includeInactive = false,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause - ALWAYS include tenantId
    const where: Prisma.ProductWhereInput = {
      tenantId, // MANDATORY: Security filter
      ...(!includeInactive && { isActive }),
      ...(familyId && { familyId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Parallel queries for data and count
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true },
          },
          family: {
            select: { id: true, name: true },
          },
          // Include batches to calculate current stock on frontend (or mapped here)
          batches: {
            select: { quantityCurrent: true },
            where: { quantityCurrent: { gt: 0 } },
          },
          preferredSupplier: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Calculate aggregated stock from batches
    const productsWithStock = products.map((product) => {
      const currentStock = product.batches.reduce(
        (acc, batch) => acc.add(batch.quantityCurrent),
        new Prisma.Decimal(0),
      );

      return {
        ...product,
        currentStock,
      };
    });

    this.logger.debug(
      `Found ${products.length} products for tenant ${tenantId}`,
    );

    return {
      data: productsWithStock,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find product by ID, SKU, or name (partial match)
   * Always filters by tenantId for security
   */
  async findByTerm(tenantId: string, term: string) {
    // Try UUID first
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(term)) {
      const product = await this.prisma.product.findFirst({
        where: { id: term, tenantId },
        include: {
          category: { select: { id: true, name: true } },
          family: { select: { id: true, name: true } },
          batches: {
            where: { quantityCurrent: { gt: 0 } },
            include: { warehouse: { select: { id: true, name: true } } },
          },
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${term} not found`);
      }

      return product;
    }

    // Search by SKU (exact) or name (partial)
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        OR: [
          { sku: { equals: term, mode: 'insensitive' } },
          { barcode: term },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { id: true, name: true } },
        family: { select: { id: true, name: true } },
      },
      take: 10, // Limit results for partial matches
    });

    if (products.length === 0) {
      throw new NotFoundException(`No products found matching "${term}"`);
    }

    // If exact SKU match, return single product
    const exactMatch = products.find(
      (p) => p.sku.toLowerCase() === term.toLowerCase() || p.barcode === term,
    );

    return exactMatch || products;
  }

  /**
   * Create a new product
   * tenantId comes from validated header, NEVER from body
   */
  async create(tenantId: string, dto: CreateProductDto) {
    // Check SKU uniqueness within tenant
    const existingSku = await this.prisma.product.findFirst({
      where: { tenantId, sku: dto.sku },
    });

    if (existingSku) {
      throw new ConflictException(
        `Product with SKU "${dto.sku}" already exists`,
      );
    }

    // Verify category belongs to tenant
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category not found or does not belong to this tenant`,
      );
    }

    // Verify family if provided
    if (dto.familyId) {
      const family = await this.prisma.productFamily.findFirst({
        where: { id: dto.familyId, tenantId },
      });

      if (!family) {
        throw new NotFoundException(
          `Product family not found or does not belong to this tenant`,
        );
      }
    }

    // Check barcode uniqueness if provided
    if (dto.barcode) {
      const existingBarcode = await this.prisma.product.findFirst({
        where: { tenantId, barcode: dto.barcode },
      });

      if (existingBarcode) {
        throw new ConflictException(
          `Product with barcode "${dto.barcode}" already exists`,
        );
      }
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId, // FORCED from header, not from DTO
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        familyId: dto.familyId,
        barcode: dto.barcode,
        stockMin: dto.stockMin ?? 0,
        stockIdeal: dto.stockIdeal,
        stockMax: dto.stockMax,
        costAverage: dto.costAverage ?? 0,
        priceDefault: dto.priceDefault,
        isService: dto.isService ?? false,
        hasExpiry: dto.hasExpiry ?? false,
        trackBatches: dto.trackBatches ?? true,
        isActive: dto.isActive ?? true,
      },
      include: {
        category: { select: { id: true, name: true } },
        family: { select: { id: true, name: true } },
      },
    });

    this.logger.log(
      `Product created: ${product.sku} (${product.name}) for tenant ${tenantId}`,
    );
    return product;
  }
}
