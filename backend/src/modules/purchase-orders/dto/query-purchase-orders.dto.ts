import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Purchase Order status filter values
 */
export enum PurchaseOrderStatusFilter {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    PARTIAL = 'PARTIAL',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

/**
 * DTO for querying purchase orders with filters
 */
export class QueryPurchaseOrdersDto {
    @ApiPropertyOptional({
        description: 'Filtrar por estado',
        enum: PurchaseOrderStatusFilter,
    })
    @IsEnum(PurchaseOrderStatusFilter)
    @IsOptional()
    status?: PurchaseOrderStatusFilter;

    @ApiPropertyOptional({
        description: 'Filtrar por proveedor',
        example: 'uuid-supplier',
    })
    @IsUUID('4')
    @IsOptional()
    supplierId?: string;

    @ApiPropertyOptional({
        description: 'Página',
        default: 1,
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({
        description: 'Límite por página',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;
}
