import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryAuditsDto {
    @ApiPropertyOptional({ description: 'Filtrar por ID de bodega' })
    @IsOptional()
    @IsString()
    warehouseId?: string;

    @ApiPropertyOptional({
        description: 'Filtrar por estado',
        enum: AuditStatus,
    })
    @IsOptional()
    @IsEnum(AuditStatus)
    status?: AuditStatus;

    @ApiPropertyOptional({ description: 'Número de página', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Límite por página', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
