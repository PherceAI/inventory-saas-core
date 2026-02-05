import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    IsDateString,
} from 'class-validator';
import { MovementType } from '@prisma/client';

export class QueryMovementsDto {
    @ApiPropertyOptional({ description: 'Página actual', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Resultados por página', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Tipo de movimiento', enum: MovementType })
    @IsOptional()
    @IsEnum(MovementType)
    type?: MovementType;

    @ApiPropertyOptional({ description: 'ID del producto' })
    @IsOptional()
    @IsUUID()
    productId?: string;

    @ApiPropertyOptional({ description: 'ID de la bodega' })
    @IsOptional()
    @IsUUID()
    warehouseId?: string;

    @ApiPropertyOptional({ description: 'ID del usuario' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'Fecha inicio (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha fin (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Búsqueda por referencia o ID' })
    @IsOptional()
    @IsString()
    search?: string;
}
