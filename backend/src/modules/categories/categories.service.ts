import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoriesDto } from './dto/index.js';
import { Prisma } from '@prisma/client';

// Tree node interface for hierarchical response
export interface CategoryTreeNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryTreeNode[];
  _count?: { products: number };
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new category
   * Validates parent ownership if parentId is provided
   */
  async create(tenantId: string, createCategoryDto: CreateCategoryDto) {
    // Validate parent belongs to tenant if provided
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: createCategoryDto.parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found or does not belong to this tenant');
      }
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          parentId: createCategoryDto.parentId,
          sortOrder: createCategoryDto.sortOrder ?? 0,
          tenantId,
        },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true } },
        },
      });

      this.logger.log(`Category created: ${category.name} (${category.id}) for tenant ${tenantId}`);
      return category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Category with this name already exists at this level');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Find all categories with optional filters and pagination
   */
  async findAll(tenantId: string, query?: QueryCategoriesDto) {
    const {
      page = 1,
      limit = 50,
      search,
      parentId,
      isActive = true, // Default to active only
      includeInactive = false,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = query || {};

    const skip = (page - 1) * limit;

    // Build where clause - only filter by isActive if NOT including inactive
    const where: Prisma.CategoryWhereInput = {
      tenantId,
      ...(!includeInactive && { isActive }),
      ...(parentId !== undefined && {
        parentId: parentId === 'null' ? null : parentId,
      }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single category by ID
   */
  async findById(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, sortOrder: true },
        },
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Update a category
   * Validates no circular references if parentId is changed
   */
  async update(tenantId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    // Verify category exists and belongs to tenant
    const existing = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // If changing parent, validate no cycles and parent ownership
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (updateCategoryDto.parentId !== null) {
        // Validate parent exists and belongs to tenant
        const parent = await this.prisma.category.findFirst({
          where: { id: updateCategoryDto.parentId, tenantId },
        });
        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }

        // Validate no cycles
        const hasCycle = await this.detectCycle(tenantId, id, updateCategoryDto.parentId);
        if (hasCycle) {
          throw new BadRequestException('Cannot set parent: would create a circular reference');
        }
      }
    }

    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
      });

      this.logger.log(`Category updated: ${updated.name} (${updated.id})`);
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Category with this name already exists at this level');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Soft delete a category (set isActive = false)
   * Does not delete if category has active products or children
   */
  async remove(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for active children
    const activeChildren = await this.prisma.category.count({
      where: { parentId: id, tenantId, isActive: true },
    });

    if (activeChildren > 0) {
      throw new BadRequestException(
        `Cannot delete category: has ${activeChildren} active subcategories. Delete or move them first.`,
      );
    }

    // Check for products using this category
    const productCount = await this.prisma.product.count({
      where: { categoryId: id, tenantId, isActive: true },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: has ${productCount} active products. Move them to another category first.`,
      );
    }

    // Soft delete
    const deleted = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Category soft deleted: ${deleted.name} (${deleted.id})`);
    return { message: 'Category deleted successfully', id };
  }

  /**
   * Get hierarchical tree of categories
   * Returns nested structure with children arrays
   */
  async getTree(tenantId: string, includeInactive = false): Promise<CategoryTreeNode[]> {
    // Fetch all categories for the tenant
    const where: Prisma.CategoryWhereInput = {
      tenantId,
      ...(includeInactive ? {} : { isActive: true }),
    };

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });

    // Build tree from flat list
    return this.buildTree(categories);
  }

  /**
   * Build tree structure from flat category list
   */
  private buildTree(categories: any[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // First pass: create map of all nodes
    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        children: [],
        _count: cat._count,
      });
    }

    // Second pass: build tree
    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Detect if setting newParentId for categoryId would create a cycle
   * Traverses up the tree from newParentId to check if categoryId is an ancestor
   */
  private async detectCycle(
    tenantId: string,
    categoryId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        return true; // Cycle detected!
      }

      const parent = await this.prisma.category.findFirst({
        where: { id: currentId, tenantId },
        select: { parentId: true },
      });

      currentId = parent?.parentId ?? null;
    }

    return false; // No cycle
  }
}

