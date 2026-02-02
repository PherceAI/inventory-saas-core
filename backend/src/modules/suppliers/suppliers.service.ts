import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
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
