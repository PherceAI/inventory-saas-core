import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createWarehouseDto: CreateWarehouseDto) {
    try {
      // Check if this is the first warehouse for the tenant
      const warehouseCount = await this.prisma.warehouse.count({
        where: { tenantId },
      });

      const isDefault =
        warehouseCount === 0 ? true : createWarehouseDto.isDefault || false;

      // Generate code if not provided
      const code =
        createWarehouseDto.code ||
        (await this.generateCode(tenantId, createWarehouseDto.name));

      // If setting as default, unset other defaults (though logical only one should be default usually)
      if (isDefault && warehouseCount > 0) {
        await this.prisma.warehouse.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await this.prisma.warehouse.create({
        data: {
          ...createWarehouseDto,
          code,
          isDefault,
          tenantId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Warehouse with this code already exists',
          );
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { isDefault: 'desc' }, // Default warehouse first
    });
  }

  private async generateCode(tenantId: string, name: string): Promise<string> {
    const prefix = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'WH');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    // Ideally check uniqueness, but for MVP this reduces collision chance
    return `${prefix}-${random}`;
  }
}
