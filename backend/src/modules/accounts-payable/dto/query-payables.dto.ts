import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payable status filter values
 */
export enum PayableStatusFilter {
    CURRENT = 'CURRENT',
    DUE_SOON = 'DUE_SOON',
    OVERDUE = 'OVERDUE',
    PAID = 'PAID',
}

/**
 * DTO for querying accounts payable with filters
 */
export class QueryPayablesDto {
    @ApiPropertyOptional({
        description: 'Filtrar por estado',
        enum: PayableStatusFilter,
    })
    @IsEnum(PayableStatusFilter)
    @IsOptional()
    status?: PayableStatusFilter;

    @ApiPropertyOptional({
        description: 'Filtrar por proveedor',
        example: 'uuid-supplier',
    })
    @IsUUID('4')
    @IsOptional()
    supplierId?: string;

    @ApiPropertyOptional({
        description: 'Fecha de vencimiento desde',
        example: '2026-01-01',
    })
    @IsDateString()
    @IsOptional()
    dueDateFrom?: string;

    @ApiPropertyOptional({
        description: 'Fecha de vencimiento hasta',
        example: '2026-12-31',
    })
    @IsDateString()
    @IsOptional()
    dueDateTo?: string;

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
