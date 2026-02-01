import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/index.js';
import { QueryFamiliesDto } from './dto/index.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Stock aggregated by base unit for a family
 */
export interface FamilyStockResult {
    familyId: string;
    familyName: string;
    baseUnit: string;
    targetStockBase: Decimal;
    currentStockBase: Decimal;
    deficit: Decimal;
    percentageOfTarget: number;
    products: Array<{
        productId: string;
        sku: string;
        name: string;
        conversionFactor: Decimal;
        unitStock: Decimal;
        baseStock: Decimal;
        percentageOfFamily: number;
    }>;
}

@Injectable()
export class FamiliesService {
    private readonly logger = new Logger(FamiliesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * List product families with pagination
     */
    async findAll(tenantId: string, query: QueryFamiliesDto) {
        const { search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = { tenantId };

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const [families, total] = await Promise.all([
            this.prisma.productFamily.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { products: true } },
                },
            }),
            this.prisma.productFamily.count({ where }),
        ]);

        return {
            data: families,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get family detail with products
     */
    async findOne(tenantId: string, id: string) {
        const family = await this.prisma.productFamily.findFirst({
            where: { id, tenantId },
            include: {
                products: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        conversionFactor: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!family) {
            throw new NotFoundException('Familia de productos no encontrada');
        }

        return family;
    }

    /**
     * 🔥 Get aggregated stock in base unit for a family
     * This is the KEY feature for managing related products
     */
    async getFamilyStock(tenantId: string, familyId: string): Promise<FamilyStockResult> {
        this.logger.log(`Calculating family stock for ${familyId}`);

        // Get family with products
        const family = await this.prisma.productFamily.findFirst({
            where: { id: familyId, tenantId },
            include: {
                products: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        conversionFactor: true,
                    },
                },
            },
        });

        if (!family) {
            throw new NotFoundException('Familia de productos no encontrada');
        }

        // Calculate stock for each product
        const productStocks: FamilyStockResult['products'] = [];
        let totalBaseStock = new Decimal(0);

        for (const product of family.products) {
            // Get sum of available batch quantities for this product
            const batchAggregate = await this.prisma.batch.aggregate({
                where: {
                    productId: product.id,
                    isExhausted: false,
                    quantityCurrent: { gt: 0 },
                },
                _sum: { quantityCurrent: true },
            });

            const unitStock = batchAggregate._sum.quantityCurrent || new Decimal(0);
            const conversionFactor = product.conversionFactor || new Decimal(1);
            const baseStock = unitStock.mul(conversionFactor);

            totalBaseStock = totalBaseStock.add(baseStock);

            productStocks.push({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                conversionFactor,
                unitStock,
                baseStock,
                percentageOfFamily: 0, // Will be calculated after
            });
        }

        // Calculate percentages
        for (const p of productStocks) {
            p.percentageOfFamily = totalBaseStock.isZero()
                ? 0
                : p.baseStock.div(totalBaseStock).mul(100).toNumber();
        }

        // Calculate deficit
        const targetStockBase = family.targetStockBase || new Decimal(0);
        const deficit = targetStockBase.sub(totalBaseStock);
        const percentageOfTarget = targetStockBase.isZero()
            ? 0
            : totalBaseStock.div(targetStockBase).mul(100).toNumber();

        this.logger.log(
            `Family ${family.name}: ${totalBaseStock} ${family.baseUnit} (${percentageOfTarget.toFixed(1)}% of target)`,
        );

        return {
            familyId: family.id,
            familyName: family.name,
            baseUnit: family.baseUnit,
            targetStockBase,
            currentStockBase: totalBaseStock,
            deficit,
            percentageOfTarget,
            products: productStocks,
        };
    }

    /**
     * Get all families with low stock (below target)
     */
    async getFamiliesWithDeficit(tenantId: string) {
        const families = await this.prisma.productFamily.findMany({
            where: { tenantId },
        });

        const results: Array<{
            familyId: string;
            familyName: string;
            deficit: Decimal;
            percentageOfTarget: number;
        }> = [];

        for (const family of families) {
            const stock = await this.getFamilyStock(tenantId, family.id);

            if (stock.deficit.gt(0)) {
                results.push({
                    familyId: stock.familyId,
                    familyName: stock.familyName,
                    deficit: stock.deficit,
                    percentageOfTarget: stock.percentageOfTarget,
                });
            }
        }

        // Sort by percentage (lowest first = most critical)
        results.sort((a, b) => a.percentageOfTarget - b.percentageOfTarget);

        return results;
    }
}
