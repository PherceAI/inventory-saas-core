import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          tenantId,
        },
      });
    } catch (error) {
      // Prisma will throw error if name + parentId combo violates unique constraint if we had one,
      // but currently schema has @@unique([tenantId, name, parentId]) which works for root categories too (parentId null)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Category with this name already exists in this level',
          );
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }
}
