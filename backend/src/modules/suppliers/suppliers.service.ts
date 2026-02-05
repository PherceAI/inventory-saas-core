import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { QuerySuppliersDto } from './dto/query-suppliers.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, createSupplierDto: CreateSupplierDto) {
    try {
      // Generate code if not provided
      const code =
        createSupplierDto.code ||
        (await this.generateCode(tenantId, createSupplierDto.name));

      return await this.prisma.supplier.create({
        data: {
          ...createSupplierDto,
          code,
          tenantId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Supplier with this code or tax ID already exists',
          );
        }
      }
      // SECURITY: Log full error but return generic message to client
      this.logger.error('Error creating supplier', error);
      throw new InternalServerErrorException('Error al crear proveedor');
    }
  }

  async findAll(tenantId: string, query: QuerySuppliersDto = {}) {
    const { page = 1, limit = 10, search, includeInactive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      ...(!includeInactive && { isActive: true }),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async generateCode(tenantId: string, name: string): Promise<string> {
    // Simple code generation strategy: 3 chars from name + timestamp part
    // In a real app, maybe use a sequence
    const prefix = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'SUP');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}-${random}`;
  }
}
